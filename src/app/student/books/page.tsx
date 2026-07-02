import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StudentBooksPage() {
  const books = await prisma.readAlongBook.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      slides: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  return (
    <div className="px-4 py-8 md:px-8 max-w-7xl mx-auto space-y-8">
      {/* Title Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black font-display text-slate-800 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-orange-500">auto_stories</span>
            Story Books
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Pick a story to practise reading aloud with Dolbot!
          </p>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-16 text-center shadow-lg max-w-lg mx-auto mt-12">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-4xl">menu_book</span>
          </div>
          <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-2">No books yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Your teacher is uploading stories — please check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => {
            const coverSlide =
              book.slides.find((s) => s.slideNumber === "01" || s.orderIndex === 0) ||
              book.slides[0];
            const coverUrl = coverSlide?.imageUrl || "";

            return (
              <Link
                key={book.id}
                href={`/student/books/${book.bookId}`}
                className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/55 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group shadow-md"
              >
                {/* Book Thumbnail */}
                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt={book.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-slate-350 dark:text-slate-700">
                      menu_book
                    </span>
                  )}

                  {/* Page Count Pill */}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">auto_stories</span>
                    <span>{book.slides.length} pages</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <h3 className="text-slate-800 dark:text-white font-black text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                    <span>Auto read &amp; speak</span>
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <span className="material-symbols-outlined text-xs">mic</span>
                      <span>Pronunciation</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
