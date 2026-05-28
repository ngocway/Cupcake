const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/app/student/assignments/[id]/run/quiz/KidTeenQuizRunner.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const navSearch = `        {/* ── BOTTOM FLOATING NAVIGATION BAR ── */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl bg-white px-5 sm:px-8 py-4 rounded-[3rem] flex items-center justify-between shadow-lg shadow-black/10 border border-slate-100">
          {/* Back */}
          <button
            disabled={currentIndex === 0 || isAutoRevealing}
            onClick={() => navigateTo(currentIndex - 1)}
            className={\`flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 border-2 \${
              currentIndex === 0 || isAutoRevealing
                ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                : "border-[#e9d5ff] bg-white text-[#a855f7] hover:bg-purple-50 active:scale-95"
            }\`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Câu trước</span>
          </button>

          {/* Progress Dots */}
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center gap-2 sm:gap-4">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={\`rounded-full transition-all duration-300 \${
                    i === currentIndex ? "w-3 h-3 sm:w-4 sm:h-4 bg-[#9d6bf6]" : "w-2 h-2 sm:w-3 sm:h-3 bg-purple-100"
                  }\`}
                />
              ))}
            </div>
          </div>

          {/* Next / Check / Reset */}
          {currentIndex < questions.length - 1 ? (
            <button
              disabled={isAutoRevealing}
              onClick={() => navigateTo(currentIndex + 1)}
              className={\`flex items-center gap-2 px-6 sm:px-10 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 shadow-md \${
                isAutoRevealing
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-[#f97316] text-white hover:bg-orange-400 active:scale-95 shadow-orange-500/30 border-b-4 border-[#c2410c]"
              }\`}
              style={{ paddingBottom: isAutoRevealing ? undefined : '0.5rem', paddingTop: isAutoRevealing ? undefined : '0.5rem' }}
            >
              <span className="hidden sm:inline">Câu tiếp</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : isAllChecked ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 sm:px-10 py-3 rounded-full font-black text-base sm:text-lg bg-[#f97316] text-white hover:bg-orange-400 active:scale-95 shadow-md shadow-orange-500/30 border-b-4 border-[#c2410c] transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="hidden sm:inline">Làm lại</span>
            </button>
          ) : (
            <button
              disabled={isAutoRevealing}
              onClick={handleCheckAll}
              className={\`flex items-center gap-2 px-6 sm:px-10 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 shadow-md \${
                isAutoRevealing
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-500 text-white hover:bg-emerald-400 active:scale-95 shadow-emerald-500/30 border-b-4 border-emerald-700"
              }\`}
            >
              {isAutoRevealing ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  <span className="hidden sm:inline">Đang chấm...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Nộp bài</span>
                </>
              )}
            </button>
          )}
        </div>`;

const navReplace = `        {/* ── BOTTOM FLOATING NAVIGATION BAR ── */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl bg-white px-5 sm:px-8 py-4 rounded-[3rem] flex items-center justify-between shadow-lg shadow-black/10 border border-slate-100">
          {/* Back */}
          <button
            disabled={currentIndex === 0 || isAutoRevealing}
            onClick={() => navigateTo(currentIndex - 1)}
            className={\`flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 border-2 \${
              currentIndex === 0 || isAutoRevealing
                ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                : "border-[#e9d5ff] bg-white text-[#9A89FF] hover:bg-purple-50 active:scale-95"
            }\`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Câu trước</span>
          </button>

          {/* Progress Dots */}
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center gap-2 sm:gap-4">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={\`rounded-full transition-all duration-300 \${
                    i === currentIndex ? "w-3 h-3 sm:w-4 sm:h-4 bg-[#9A89FF]" : "w-2 h-2 sm:w-3 sm:h-3 bg-purple-100"
                  }\`}
                />
              ))}
            </div>
          </div>

          {/* Next / Check / Reset */}
          {currentIndex < questions.length - 1 ? (
            <button
              disabled={isAutoRevealing}
              onClick={() => navigateTo(currentIndex + 1)}
              className={\`flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 border-2 \${
                isAutoRevealing
                  ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                  : "border-[#e9d5ff] bg-white text-[#9A89FF] hover:bg-purple-50 active:scale-95"
              }\`}
            >
              <span className="hidden sm:inline">Câu tiếp</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : isAllChecked ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg border-2 border-[#e9d5ff] bg-white text-[#9A89FF] hover:bg-purple-50 active:scale-95 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="hidden sm:inline">Làm lại</span>
            </button>
          ) : (
            <button
              disabled={isAutoRevealing}
              onClick={handleCheckAll}
              className={\`flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg transition-all duration-200 border-2 \${
                isAutoRevealing
                  ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                  : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 active:scale-95"
              }\`}
            >
              {isAutoRevealing ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  <span className="hidden sm:inline">Đang chấm...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Nộp bài</span>
                </>
              )}
            </button>
          )}
        </div>`;

content = content.replace(navSearch, navReplace);
fs.writeFileSync(targetFile, content);
console.log('Patched layout nav successfully.');
