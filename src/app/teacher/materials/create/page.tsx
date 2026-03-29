import React from 'react';
import Link from 'next/link';

export default function CreateMaterialPage() {
  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Tạo tài liệu mới</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/teacher/materials/new/edit?type=quiz" className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center justify-center h-48">
          <h2 className="text-xl font-bold text-slate-700">Bài tập (Quiz)</h2>
          <p className="text-slate-500 text-center mt-2 text-sm">Tạo bài tập trắc nghiệm, điền từ, nối cặp...</p>
        </Link>
        <Link href="/teacher/materials/new/edit?type=flashcard" className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col items-center justify-center h-48">
          <h2 className="text-xl font-bold text-slate-700">Flashcard</h2>
          <p className="text-slate-500 text-center mt-2 text-sm">Bộ thẻ ghi nhớ từ vựng tự động xáo trộn</p>
        </Link>
        <Link href="/teacher/materials/new/edit?type=reading" className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col items-center justify-center h-48">
          <h2 className="text-xl font-bold text-slate-700">Bài đọc hiểu</h2>
          <p className="text-slate-500 text-center mt-2 text-sm">Đoạn văn kết hợp câu hỏi tương tác</p>
        </Link>
      </div>
    </div>
  );
}
