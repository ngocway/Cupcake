import prisma from "@/lib/prisma";

export function toSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function generateUniqueSlug(baseTitle: string, model: 'assignment' | 'lesson' = 'assignment') {
  const baseSlug = toSlug(baseTitle);
  if (!baseSlug) return null;

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let existing;
    if (model === 'assignment') {
      existing = await prisma.assignment.findUnique({ where: { slug } });
    } else {
      existing = await prisma.lesson.findUnique({ where: { slug } });
    }
    
    if (!existing) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}
