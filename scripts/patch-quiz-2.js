const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/app/student/assignments/[id]/run/quiz/KidTeenQuizRunner.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Replace Top Header Question Circles
const topHeaderSearch = `        {/* Question Map */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {questions.map((q, i) => {
            const active = i === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => navigateTo(i)}
                disabled={isAutoRevealing}
                className={\`relative w-10 h-10 rounded-full font-black text-base transition-all duration-300 shrink-0 flex items-center justify-center \${
                  active
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40"
                    : "bg-white border-2 border-slate-100 text-slate-400 hover:border-orange-300 hover:text-orange-400"
                }\`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>`;

const topHeaderReplace = `        {/* Question Map */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {questions.map((q, i) => {
            const active = i === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => navigateTo(i)}
                disabled={isAutoRevealing}
                className={\`relative w-10 h-10 rounded-full font-black text-base transition-all duration-300 shrink-0 flex items-center justify-center \${
                  active
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/40 border-2 border-orange-500"
                    : "bg-white border-2 border-slate-100 text-[#a855f7] hover:border-purple-300 hover:text-purple-600 shadow-sm"
                }\`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>`;

// Replace Question Card container
const cardSearch = `          <div className={\`bg-white rounded-[3rem] shadow-2xl overflow-visible transition-colors duration-500 relative border-8 \${
            isCorrectNow
              ? "border-emerald-400 shadow-emerald-200/60"
              : isWrongNow
              ? "border-rose-400 shadow-rose-200/60"
              : "border-white shadow-black/10"
          }\`}>

            {/* Purple Header overlapping the white card */}
            <div className="bg-white pt-5 px-6 sm:px-10 rounded-t-[3rem] relative">
              <div className="bg-[#8b5cf6] rounded-[2rem] px-6 sm:px-8 py-3 flex items-center flex-wrap gap-4 sm:gap-6 relative shadow-md">
                <div className="absolute -top-4 sm:left-36 transform -rotate-12 hidden sm:block">
                   <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                     <Star className="w-5 h-5 text-white fill-white" />
                   </div>
                </div>
                <span className="text-white font-black text-lg sm:text-xl tracking-widest sm:ml-4 whitespace-nowrap">
                  CÂU {currentIndex + 1} / {questions.length}
                </span>
                <span className="bg-white/20 text-white text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full sm:ml-6 border border-white/30 backdrop-blur-sm whitespace-nowrap">
                  {qType === "MULTIPLE_SELECT" ? "Chọn nhiều đáp án"
                    : qType === "MATCHING" ? "Nối cặp"
                    : qType === "CLOZE_TEST" ? "Điền vào chỗ trống"
                    : qType === "TRUE_FALSE" ? "Đúng / Sai"
                    : "Chọn đáp án đúng"}
                </span>
                
                {isChecked && (
                  <div className="ml-auto flex items-center gap-2 text-white font-black text-sm whitespace-nowrap">
                    {isCorrectNow
                      ? <><CheckCircle2 className="w-5 h-5" /> Đúng rồi! 🎉</>
                      : <><XCircle className="w-5 h-5" /> Sai rồi! 😅</>}
                  </div>
                )}
              </div>
            </div>

            {/* Card body */}
            <div className="p-6 lg:p-8 space-y-7">
              {/* Question text */}
              {questionText && questionText !== "{}" && (
                <h3 className="text-2xl lg:text-3xl font-black text-slate-800 leading-snug">
                  {questionText}
                </h3>
              )}`;

const cardReplace = `          <div className={\`bg-white rounded-[2rem] p-3 shadow-xl overflow-visible transition-colors duration-500 relative border-4 \${
            isCorrectNow
              ? "border-emerald-400 shadow-emerald-200/60"
              : isWrongNow
              ? "border-rose-400 shadow-rose-200/60"
              : "border-transparent shadow-black/10"
          }\`}>

            {/* Purple Header */}
            <div className="bg-[#9d6bf6] rounded-t-[1.5rem] rounded-b-2xl px-4 sm:px-6 py-4 flex items-center flex-wrap gap-3 sm:gap-4 relative shadow-sm">
              <div className="bg-[#7a48de] rounded-full px-5 py-2 flex items-center relative">
                <span className="text-white font-black text-lg tracking-widest">
                  CÂU {currentIndex + 1} / {questions.length}
                </span>
                <div className="absolute -top-3 -right-3 transform rotate-12">
                   <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                     <Star className="w-4 h-4 text-white fill-white" />
                   </div>
                </div>
              </div>
              <span className="bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm whitespace-nowrap ml-2">
                {qType === "MULTIPLE_SELECT" ? "Chọn nhiều đáp án"
                  : qType === "MATCHING" ? "Nối cặp"
                  : qType === "CLOZE_TEST" ? "Điền vào chỗ trống"
                  : qType === "TRUE_FALSE" ? "Đúng / Sai"
                  : "Chọn đáp án đúng"}
              </span>
              
              {isChecked && (
                <div className="ml-auto flex items-center gap-2 text-white font-black text-sm whitespace-nowrap bg-white/20 px-4 py-1.5 rounded-full">
                  {isCorrectNow
                    ? <><CheckCircle2 className="w-5 h-5" /> Đúng rồi! 🎉</>
                    : <><XCircle className="w-5 h-5" /> Sai rồi! 😅</>}
                </div>
              )}
            </div>

            {/* Card body */}
            <div className="px-6 py-8 lg:px-10 lg:py-10 space-y-8">
              {/* Question text */}
              {questionText && questionText !== "{}" && (
                <div className="text-center relative inline-block w-full">
                  <h3 className="text-2xl lg:text-3xl font-black text-[#1e293b] leading-snug inline-block relative z-10">
                    {questionText}
                  </h3>
                </div>
              )}`;

// Replace Options styling
const optionsSearch = `                    // New kid-friendly palette
                    const KID_PALETTE = [
                      { border: "border-blue-300 border-dashed", bg: "bg-blue-50", text: "text-blue-500", badge: "bg-blue-500" },
                      { border: "border-emerald-300 border-dashed", bg: "bg-emerald-50", text: "text-emerald-500", badge: "bg-emerald-500" },
                      { border: "border-orange-300 border-dashed", bg: "bg-orange-50", text: "text-orange-500", badge: "bg-orange-500" },
                      { border: "border-purple-300 border-dashed", bg: "bg-purple-50", text: "text-purple-500", badge: "bg-purple-500" },
                    ];
                    const theme = KID_PALETTE[i % KID_PALETTE.length];

                    if (isChecked) {
                      if (isCorrectOpt) {
                        btnClass = "border-emerald-500 border-solid bg-emerald-100 text-emerald-800 shadow-md";
                        labelClass = "bg-emerald-500 text-white scale-110";
                      } else if (isSelected) {
                        btnClass = "border-rose-500 border-solid bg-rose-100 text-rose-800 shadow-md";
                        labelClass = "bg-rose-500 text-white";
                      } else {
                        btnClass = "border-slate-200 border-solid bg-slate-50 text-slate-400 opacity-60";
                        labelClass = "bg-slate-300 text-white";
                      }
                    } else {
                      btnClass = isSelected
                        ? \`\${theme.border} border-solid bg-white shadow-md shadow-slate-200 scale-[1.02] \${theme.text}\`
                        : \`\${theme.border} \${theme.bg} \${theme.text} hover:bg-white\`;
                      labelClass = \`\${theme.badge} text-white \${isSelected ? "scale-110" : ""}\`;
                    }

                    return (
                      <button
                        key={i}
                        disabled={isChecked}
                        onClick={() => handleAnswerChange(currentQuestion, i)}
                        className={\`group flex items-center gap-5 w-full px-4 sm:px-6 py-4 rounded-full border-2 font-black text-left transition-all duration-300 \${btnClass}\`}
                      >
                        <div className={\`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shrink-0 transition-all shadow-sm \${labelClass}\`}>
                          {isMultiSelect
                            ? <Check className={\`w-6 h-6 transition-all \${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"}\`} strokeWidth={4} />
                            : String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-xl sm:text-2xl flex-1 ml-2">{option.text}</span>
                        {isChecked && isCorrectOpt && <CheckCircle2 className="ml-auto w-8 h-8 text-emerald-500 shrink-0" />}
                        {isChecked && isSelected && !isCorrectOpt && <XCircle className="ml-auto w-8 h-8 text-rose-500 shrink-0" />}
                      </button>
                    );`;

const optionsReplace = `                    // New kid-friendly palette
                    const KID_PALETTE = [
                      { border: "border-blue-300", bg: "bg-blue-50/40", text: "text-[#3b82f6]", badge: "bg-[#3b82f6]" },
                      { border: "border-emerald-300", bg: "bg-emerald-50/40", text: "text-[#10b981]", badge: "bg-[#10b981]" },
                      { border: "border-orange-300", bg: "bg-orange-50/40", text: "text-[#f59e0b]", badge: "bg-[#f59e0b]" },
                      { border: "border-purple-300", bg: "bg-purple-50/40", text: "text-[#8b5cf6]", badge: "bg-[#8b5cf6]" },
                    ];
                    const theme = KID_PALETTE[i % KID_PALETTE.length];

                    if (isChecked) {
                      if (isCorrectOpt) {
                        btnClass = "border-emerald-500 border-solid bg-emerald-50 text-emerald-700 shadow-sm";
                        labelClass = "bg-emerald-500 text-white scale-110";
                      } else if (isSelected) {
                        btnClass = "border-rose-400 border-solid bg-rose-50 text-rose-700 shadow-sm";
                        labelClass = "bg-rose-500 text-white";
                      } else {
                        btnClass = "border-slate-200 border-solid bg-slate-50 text-slate-400 opacity-60";
                        labelClass = "bg-slate-300 text-white";
                      }
                    } else {
                      btnClass = isSelected
                        ? \`\${theme.border} border-solid bg-white shadow-md scale-[1.01] \${theme.text}\`
                        : \`\${theme.border} border-dashed \${theme.bg} \${theme.text} hover:bg-white hover:border-solid hover:shadow-sm\`;
                      labelClass = \`\${theme.badge} text-white \${isSelected ? "scale-110" : ""}\`;
                    }

                    return (
                      <button
                        key={i}
                        disabled={isChecked}
                        onClick={() => handleAnswerChange(currentQuestion, i)}
                        className={\`group flex items-center gap-4 w-full px-4 sm:px-6 py-3.5 rounded-[2rem] border-2 font-black text-left transition-all duration-300 \${btnClass}\`}
                      >
                        {/* Wavy/Scalloped style badge using rounded polygon or just circular with border */}
                        <div className={\`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shrink-0 transition-all shadow-inner \${labelClass}\`} style={{ boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.15)" }}>
                          {isMultiSelect
                            ? <Check className={\`w-6 h-6 transition-all \${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"}\`} strokeWidth={4} />
                            : String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-xl sm:text-2xl flex-1 ml-3 tracking-wide">{option.text}</span>
                        {isChecked && isCorrectOpt && <CheckCircle2 className="ml-auto w-8 h-8 text-emerald-500 shrink-0" />}
                        {isChecked && isSelected && !isCorrectOpt && <XCircle className="ml-auto w-8 h-8 text-rose-500 shrink-0" />}
                      </button>
                    );`;

// Replace Bottom Nav
const navSearch = `        {/* ── BOTTOM FLOATING NAVIGATION BAR ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-white/90 backdrop-blur-md px-4 py-3 rounded-full flex items-center justify-between shadow-2xl border-4 border-white/50">
          {/* Back */}
          <button
            disabled={currentIndex === 0 || isAutoRevealing}
            onClick={() => navigateTo(currentIndex - 1)}
            className={\`flex items-center gap-2 px-6 py-3 rounded-full font-black text-base transition-all duration-200 border-2 \${
              currentIndex === 0 || isAutoRevealing
                ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                : "border-purple-200 bg-white text-purple-600 hover:bg-purple-50 active:scale-95 shadow-sm"
            }\`}
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="hidden sm:inline">Câu trước</span>
          </button>

          {/* Progress Dots */}
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center gap-3">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={\`rounded-full transition-all duration-300 \${
                    i === currentIndex ? "w-4 h-4 bg-purple-500 scale-125" : "w-3 h-3 bg-purple-100"
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
              className={\`flex items-center gap-2 px-8 py-3 rounded-full font-black text-lg transition-all duration-200 shadow-md \${
                isAutoRevealing
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-orange-500 text-white hover:bg-orange-400 active:scale-95 shadow-orange-500/40"
              }\`}
            >
              <span className="hidden sm:inline">Câu tiếp</span>
              <ChevronRight className="w-6 h-6" />
            </button>
          ) : isAllChecked ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-8 py-3 rounded-full font-black text-lg bg-orange-500 text-white hover:bg-orange-400 active:scale-95 shadow-md shadow-orange-500/40 transition-all"
            >
              <RotateCcw className="w-6 h-6" />
              <span className="hidden sm:inline">Làm lại</span>
            </button>
          ) : (
            <button
              disabled={isAutoRevealing}
              onClick={handleCheckAll}
              className={\`flex items-center gap-2 px-8 py-3 rounded-full font-black text-lg transition-all duration-200 shadow-md \${
                isAutoRevealing
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-500 text-white hover:bg-emerald-400 active:scale-95 shadow-emerald-500/40"
              }\`}
            >
              {isAutoRevealing ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  <span className="hidden sm:inline">Đang chấm...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
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

content = content.replace(topHeaderSearch, topHeaderReplace);
content = content.replace(cardSearch, cardReplace);
content = content.replace(optionsSearch, optionsReplace);
content = content.replace(navSearch, navReplace);

fs.writeFileSync(targetFile, content);
console.log('Patched layout 2 successfully.');
