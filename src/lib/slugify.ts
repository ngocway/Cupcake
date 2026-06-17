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

  // 1. Check if the clean base slug is available first
  let existing;
  if (model === 'assignment') {
    existing = await prisma.assignment.findUnique({ where: { slug: baseSlug } });
  } else {
    existing = await prisma.lesson.findUnique({ where: { slug: baseSlug } });
  }
  
  if (!existing) return baseSlug;

  // 2. If already taken, append a random 4-character alphanumeric suffix
  let attempts = 0;
  while (attempts < 10) {
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;
    
    if (model === 'assignment') {
      existing = await prisma.assignment.findUnique({ where: { slug } });
    } else {
      existing = await prisma.lesson.findUnique({ where: { slug } });
    }
    
    if (!existing) return slug;
    attempts++;
  }
  
  // 3. Fallback in case of extreme collision
  return `${baseSlug}-${Date.now()}`;
}
