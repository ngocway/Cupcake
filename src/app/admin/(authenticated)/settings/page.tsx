export default function AdminPlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center">
      <div className="w-24 h-24 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-8 border border-blue-500/20">
         <span className="material-symbols-outlined text-blue-500 text-5xl animate-pulse">construction</span>
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">Tính năng đang phát triển</h1>
      <p className="text-neutral-500 max-w-md mx-auto leading-relaxed">
        Trang này đang được thiết kế và sẽ sớm ra mắt trong bản cập nhật tiếp theo. 
        Vui lòng quay lại sau!
      </p>
      <button className="mt-10 px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl border border-neutral-800 transition-all">
         Quay lại Dashboard
      </button>
    </div>
  )
}
