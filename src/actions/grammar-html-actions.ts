"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 environment variables are missing");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

/**
 * Fetch grammar lesson HTML data, CDN URLs, and current content for editing.
 */
export async function getGrammarLessonHtmlInfo(classId: string, assignmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const assignmentClass = await prisma.assignmentClass.findFirst({
    where: { classId, assignmentId },
    include: {
      assignment: true,
      class: { select: { id: true, name: true, teacherId: true } },
      group: { select: { id: true, title: true } },
    },
  });

  if (!assignmentClass) {
    throw new Error("Không tìm thấy bài học trong lớp này.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isTeacherAdmin = user?.role === "ADMIN" || session.user.email?.includes("admin");
  if (!isTeacherAdmin && assignmentClass.class.teacherId !== session.user.id) {
    throw new Error("Bạn không có quyền quản lý bài giảng của lớp học này.");
  }

  const assignment = assignmentClass.assignment;
  let cdnUrlEn: string | null = null;
  let cdnUrlVi: string | null = null;

  if (assignment.instructionsTranslations && typeof assignment.instructionsTranslations === "object") {
    const trans = assignment.instructionsTranslations as any;
    if (trans.cdnUrlEn) cdnUrlEn = trans.cdnUrlEn;
    if (trans.cdnUrlVi) cdnUrlVi = trans.cdnUrlVi;
  }

  if (assignment.instructions && assignment.instructions.trim().startsWith("{")) {
    try {
      const meta = JSON.parse(assignment.instructions);
      if (!cdnUrlEn && meta.cdnUrlEn) cdnUrlEn = meta.cdnUrlEn;
      if (!cdnUrlVi && meta.cdnUrlVi) cdnUrlVi = meta.cdnUrlVi;
    } catch {}
  }

  const lessonId = assignment.grammarLesson;
  let grammarLesson: any = null;

  if (lessonId) {
    grammarLesson = await prisma.grammarLesson.findUnique({
      where: { id: lessonId },
      select: { instructions: true, instructionsTranslations: true },
    });
    if (grammarLesson?.instructionsTranslations) {
      const glTrans = grammarLesson.instructionsTranslations as any;
      if (!cdnUrlEn && glTrans.cdnUrlEn) cdnUrlEn = glTrans.cdnUrlEn;
      if (!cdnUrlVi && glTrans.cdnUrlVi) cdnUrlVi = glTrans.cdnUrlVi;
    }
  }

  // Fetch current HTML content
  let htmlEn = "";
  let htmlVi = "";

  if (cdnUrlEn) {
    try {
      const res = await fetch(cdnUrlEn, { cache: "no-store" });
      if (res.ok) htmlEn = await res.text();
    } catch (err) {
      console.warn("[GrammarHTML] Failed to fetch cdnUrlEn:", err);
    }
  }

  if (!htmlEn) {
    htmlEn = (grammarLesson?.instructions && !grammarLesson.instructions.trim().startsWith("{"))
      ? grammarLesson.instructions
      : (!assignment.instructions?.trim().startsWith("{") ? (assignment.instructions || "") : "");
  }

  if (cdnUrlVi) {
    try {
      const res = await fetch(cdnUrlVi, { cache: "no-store" });
      if (res.ok) htmlVi = await res.text();
    } catch (err) {
      console.warn("[GrammarHTML] Failed to fetch cdnUrlVi:", err);
    }
  }

  if (!htmlVi) {
    const trans = assignment.instructionsTranslations as any;
    const glTrans = grammarLesson?.instructionsTranslations as any;
    htmlVi = (typeof trans?.vi === "string" && trans.vi)
      ? trans.vi
      : ((typeof glTrans?.vi === "string" && glTrans.vi) ? glTrans.vi : htmlEn);
  }

  const isCustomizedForClass = Boolean(
    (cdnUrlEn && cdnUrlEn.includes(`/classes/${classId}/`)) ||
    (cdnUrlVi && cdnUrlVi.includes(`/classes/${classId}/`))
  );

  return {
    success: true,
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    className: assignmentClass.class.name,
    groupTitle: assignmentClass.group?.title || "",
    lessonId,
    cdnUrlEn,
    cdnUrlVi,
    htmlEn,
    htmlVi,
    isCustomizedForClass,
  };
}

/**
 * Upload an HTML file content for EN or VI to Cloudflare R2 and update assignment.
 */
export async function uploadGrammarLessonHtmlFile({
  classId,
  assignmentId,
  lang,
  htmlContent,
}: {
  classId: string;
  assignmentId: string;
  lang: "en" | "vi";
  htmlContent: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const assignmentClass = await prisma.assignmentClass.findFirst({
    where: { classId, assignmentId },
    include: {
      assignment: true,
      class: { select: { id: true, teacherId: true } },
    },
  });

  if (!assignmentClass) {
    throw new Error("Không tìm thấy bài học trong lớp học này.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isTeacherAdmin = user?.role === "ADMIN" || session.user.email?.includes("admin");
  if (!isTeacherAdmin && assignmentClass.class.teacherId !== session.user.id) {
    throw new Error("Bạn không có quyền sửa bài giảng của lớp này.");
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = (process.env.NEXT_PUBLIC_R2_URL || "https://media.dolcake.com").replace(/\/$/, "");
  if (!bucketName) throw new Error("R2_BUCKET_NAME is not configured");

  const s3 = getR2Client();
  const fileKey = `grammar/classes/${classId}/${assignmentId}/${lang}.html`;
  const timestamp = Date.now();
  const cdnUrl = `${publicUrlBase}/${fileKey}?v=${timestamp}`;

  // 1. Upload to Cloudflare R2
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: Buffer.from(htmlContent, "utf-8"),
      ContentType: "text/html; charset=utf-8",
      CacheControl: "public, max-age=86400, stale-while-revalidate=604800",
    })
  );

  // 2. Update Database Assignment
  const assignment = assignmentClass.assignment;
  const currentTrans = (typeof assignment.instructionsTranslations === "object" && assignment.instructionsTranslations !== null)
    ? (assignment.instructionsTranslations as any)
    : {};

  const updatedTrans = {
    ...currentTrans,
    [lang === "en" ? "cdnUrlEn" : "cdnUrlVi"]: cdnUrl,
  };

  let updatedInstructions = assignment.instructions;
  if (assignment.instructions && assignment.instructions.trim().startsWith("{")) {
    try {
      const meta = JSON.parse(assignment.instructions);
      meta[lang === "en" ? "cdnUrlEn" : "cdnUrlVi"] = cdnUrl;
      updatedInstructions = JSON.stringify(meta);
    } catch {}
  } else {
    updatedInstructions = JSON.stringify({
      kind: "LESSON",
      rawId: assignment.grammarLesson ? `grammar:${assignment.grammarTopic || "grammar"}:${assignment.grammarLesson}` : undefined,
      [lang === "en" ? "cdnUrlEn" : "cdnUrlVi"]: cdnUrl,
    });
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      instructions: updatedInstructions,
      instructionsTranslations: updatedTrans,
    },
  });

  // 3. Invalidate Redis cache
  try {
    const { redis } = await import("@/lib/redis");
    await redis.del(`grammar:lesson-template:v2:${assignmentId}`);
  } catch (err) {
    console.warn("[GrammarHTML] Failed to invalidate Redis cache:", err);
  }

  return {
    success: true,
    url: cdnUrl,
    lang,
  };
}

/**
 * Save both EN and VI HTML content at once to Cloudflare R2.
 */
export async function saveBothGrammarLessonHtml({
  classId,
  assignmentId,
  htmlEn,
  htmlVi,
}: {
  classId: string;
  assignmentId: string;
  htmlEn?: string;
  htmlVi?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const assignmentClass = await prisma.assignmentClass.findFirst({
    where: { classId, assignmentId },
    include: {
      assignment: true,
      class: { select: { id: true, teacherId: true } },
    },
  });

  if (!assignmentClass) {
    throw new Error("Không tìm thấy bài học trong lớp học này.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isTeacherAdmin = user?.role === "ADMIN" || session.user.email?.includes("admin");
  if (!isTeacherAdmin && assignmentClass.class.teacherId !== session.user.id) {
    throw new Error("Bạn không có quyền sửa bài giảng của lớp này.");
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = (process.env.NEXT_PUBLIC_R2_URL || "https://media.dolcake.com").replace(/\/$/, "");
  if (!bucketName) throw new Error("R2_BUCKET_NAME is not configured");

  const s3 = getR2Client();
  const timestamp = Date.now();

  let cdnUrlEn: string | undefined;
  let cdnUrlVi: string | undefined;

  const uploadPromises: Promise<any>[] = [];

  if (typeof htmlEn === "string" && htmlEn.trim()) {
    const fileKeyEn = `grammar/classes/${classId}/${assignmentId}/en.html`;
    cdnUrlEn = `${publicUrlBase}/${fileKeyEn}?v=${timestamp}`;
    uploadPromises.push(
      s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileKeyEn,
          Body: Buffer.from(htmlEn, "utf-8"),
          ContentType: "text/html; charset=utf-8",
          CacheControl: "public, max-age=86400, stale-while-revalidate=604800",
        })
      )
    );
  }

  if (typeof htmlVi === "string" && htmlVi.trim()) {
    const fileKeyVi = `grammar/classes/${classId}/${assignmentId}/vi.html`;
    cdnUrlVi = `${publicUrlBase}/${fileKeyVi}?v=${timestamp}`;
    uploadPromises.push(
      s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileKeyVi,
          Body: Buffer.from(htmlVi, "utf-8"),
          ContentType: "text/html; charset=utf-8",
          CacheControl: "public, max-age=86400, stale-while-revalidate=604800",
        })
      )
    );
  }

  await Promise.all(uploadPromises);

  // Update DB
  const assignment = assignmentClass.assignment;
  const currentTrans = (typeof assignment.instructionsTranslations === "object" && assignment.instructionsTranslations !== null)
    ? (assignment.instructionsTranslations as any)
    : {};

  const updatedTrans = {
    ...currentTrans,
    ...(cdnUrlEn && { cdnUrlEn }),
    ...(cdnUrlVi && { cdnUrlVi }),
  };

  let updatedInstructions = assignment.instructions;
  if (assignment.instructions && assignment.instructions.trim().startsWith("{")) {
    try {
      const meta = JSON.parse(assignment.instructions);
      if (cdnUrlEn) meta.cdnUrlEn = cdnUrlEn;
      if (cdnUrlVi) meta.cdnUrlVi = cdnUrlVi;
      updatedInstructions = JSON.stringify(meta);
    } catch {}
  } else {
    updatedInstructions = JSON.stringify({
      kind: "LESSON",
      rawId: assignment.grammarLesson ? `grammar:${assignment.grammarTopic || "grammar"}:${assignment.grammarLesson}` : undefined,
      ...(cdnUrlEn && { cdnUrlEn }),
      ...(cdnUrlVi && { cdnUrlVi }),
    });
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      instructions: updatedInstructions,
      instructionsTranslations: updatedTrans,
    },
  });

  // Invalidate Redis cache
  try {
    const { redis } = await import("@/lib/redis");
    await redis.del(`grammar:lesson-template:v2:${assignmentId}`);
  } catch (err) {
    console.warn("[GrammarHTML] Failed to invalidate Redis cache:", err);
  }

  return {
    success: true,
    cdnUrlEn,
    cdnUrlVi,
  };
}

/**
 * Delete custom grammar lesson HTML from Cloudflare R2 and reset assignment URLs.
 */
export async function deleteGrammarLessonHtml({
  classId,
  assignmentId,
  lang,
}: {
  classId: string;
  assignmentId: string;
  lang: "en" | "vi" | "both";
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const assignmentClass = await prisma.assignmentClass.findFirst({
    where: { classId, assignmentId },
    include: {
      assignment: true,
      class: { select: { id: true, teacherId: true } },
    },
  });

  if (!assignmentClass) {
    throw new Error("Không tìm thấy bài học trong lớp học này.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isTeacherAdmin = user?.role === "ADMIN" || session.user.email?.includes("admin");
  if (!isTeacherAdmin && assignmentClass.class.teacherId !== session.user.id) {
    throw new Error("Bạn không có quyền quản lý bài giảng của lớp này.");
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) throw new Error("R2_BUCKET_NAME is not configured");

  const s3 = getR2Client();
  const deletePromises: Promise<any>[] = [];

  if (lang === "en" || lang === "both") {
    deletePromises.push(
      s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: `grammar/classes/${classId}/${assignmentId}/en.html`,
        })
      ).catch((e) => console.warn("[GrammarHTML] Delete EN object warning:", e.message))
    );
  }

  if (lang === "vi" || lang === "both") {
    deletePromises.push(
      s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: `grammar/classes/${classId}/${assignmentId}/vi.html`,
        })
      ).catch((e) => console.warn("[GrammarHTML] Delete VI object warning:", e.message))
    );
  }

  await Promise.all(deletePromises);

  // Reset in Assignment
  const assignment = assignmentClass.assignment;
  const currentTrans = (typeof assignment.instructionsTranslations === "object" && assignment.instructionsTranslations !== null)
    ? { ...(assignment.instructionsTranslations as any) }
    : {};

  if (lang === "en" || lang === "both") delete currentTrans.cdnUrlEn;
  if (lang === "vi" || lang === "both") delete currentTrans.cdnUrlVi;

  let updatedInstructions = assignment.instructions;
  if (assignment.instructions && assignment.instructions.trim().startsWith("{")) {
    try {
      const meta = JSON.parse(assignment.instructions);
      if (lang === "en" || lang === "both") delete meta.cdnUrlEn;
      if (lang === "vi" || lang === "both") delete meta.cdnUrlVi;
      updatedInstructions = JSON.stringify(meta);
    } catch {}
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      instructions: updatedInstructions,
      instructionsTranslations: Object.keys(currentTrans).length > 0 ? currentTrans : null,
    },
  });

  // Invalidate Redis cache
  try {
    const { redis } = await import("@/lib/redis");
    await redis.del(`grammar:lesson-template:v2:${assignmentId}`);
  } catch (err) {
    console.warn("[GrammarHTML] Failed to invalidate Redis cache:", err);
  }

  return { success: true };
}
