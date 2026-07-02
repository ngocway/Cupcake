import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BookDetailClient } from "./BookDetailClient";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/auth/signin");
  }

  const { id } = await params;

  return <BookDetailClient bookId={id} />;
}
