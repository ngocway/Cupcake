import { getAdminTags } from "@/actions/tag-actions";
import TagManager from "./TagManager";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const initialTags = await getAdminTags();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Quản lý Thẻ (Tags)</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Xem danh sách, tìm kiếm, chỉnh sửa và loại bỏ các thẻ từ bài tập và ngân hàng câu hỏi.
        </p>
      </div>

      <TagManager initialTags={initialTags} />
    </div>
  );
}
