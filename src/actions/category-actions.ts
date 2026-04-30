"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createCategory(data: { name: string, slug: string, parentId?: string, icon?: string, color?: string, description?: string }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      parentId: data.parentId || null,
      icon: data.icon,
      color: data.color,
      description: data.description,
      orderIndex: await getNextOrderIndex(data.parentId),
    }
  });

  revalidatePath("/admin/categories");
  return { success: true, category };
}

export async function updateCategory(id: string, data: any) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const category = await prisma.category.update({
    where: { id },
    data
  });

  revalidatePath("/admin/categories");
  return { success: true, category };
}

export async function deleteCategory(id: string, strategy: 'DELETE_CHILDREN' | 'MOVE_TO_PARENT' = 'DELETE_CHILDREN') {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");


  const category = await prisma.category.findUnique({
    where: { id },
    include: { children: true }
  });

  if (!category) throw new Error("Category not found");

  if (strategy === 'MOVE_TO_PARENT') {
    // Move children to the deleted category's parent
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: category.parentId }
    });
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function reorderCategories(items: { id: string, parentId: string | null, orderIndex: number }[]) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.$transaction(
    items.map(item => 
      prisma.category.update({
        where: { id: item.id },
        data: { parentId: item.parentId, orderIndex: item.orderIndex }
      })
    )
  );

  revalidatePath("/admin/categories");
  return { success: true };
}

async function getNextOrderIndex(parentId?: string | null) {
  const last = await prisma.category.findFirst({
    where: { parentId: parentId || null },
    orderBy: { orderIndex: 'desc' }
  });
  return last ? last.orderIndex + 1 : 0;
}

export async function getCategoryTree() {
  const categories = await prisma.category.findMany({
    orderBy: { orderIndex: 'asc' }
  });
  
  // Transform to tree structure
  const map = new Map();
  const roots: any[] = [];
  
  categories.forEach(c => map.set(c.id, { ...c, children: [], materialCount: 0 })); // Note: count would be separate
  
  categories.forEach(c => {
    if (c.parentId) {
      const parent = map.get(c.parentId);
      if (parent) {
        parent.children.push(map.get(c.id));
      } else {
        roots.push(map.get(c.id)); // Orphan protection
      }
    } else {
      roots.push(map.get(c.id));
    }
  });

  return roots;
}

export async function getFlatCategories() {
  return await prisma.category.findMany({
    orderBy: [
      { parentId: 'asc' },
      { orderIndex: 'asc' }
    ]
  });
}
