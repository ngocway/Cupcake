import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCategoryTree } from "@/actions/category-actions";
import CategoryManager from "./CategoryManager";

export const metadata = {
  title: "Quản lý danh mục | Admin",
};

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/login");

  const categoryTree = await getCategoryTree();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface">Quản lý Cây Danh Mục (Categories)</h1>
        <p className="text-on-surface-variant mt-1">
          Xây dựng cấu trúc danh mục đa cấp để phân loại bài học và bài tập.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
        <CategoryManager initialTree={categoryTree} />
      </div>
    </div>
  );
}
