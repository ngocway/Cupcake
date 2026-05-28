const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/app/student/assignments/[id]/run/quiz/KidTeenQuizRunner.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Chunk 1
const chunk1_search = `  // ── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-sky-50 to-violet-50 font-body flex flex-col pb-8">
      <FloatingTeacherInfo teacher={assignment.teacher} onNavigate={handleSafeNavigate} />

      {/* ── TOP BAR ── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b-2 border-primary/10 px-4 py-3 flex flex-col gap-3 shadow-md shadow-black/5">
        {/* Row 1: Back + Title */}
        <div className="flex items-center gap-3">
          <BackButton className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-black text-[11px] uppercase tracking-widest rounded-2xl border-2 border-slate-200 hover:border-primary/30 transition-all active:scale-95 shrink-0 shadow-sm">
            <ChevronLeft className="w-4 h-4" />
            Back
          </BackButton>
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide truncate flex-1 text-center pr-16">{assignment.title}</h2>
        </div>

        {/* Row 2: Question Map */}
        <div className="flex items-center justify-center flex-wrap gap-2 px-2">
          {questions.map((q, i) => {
            const ans = answers[q.id];
            const answered = ans !== undefined && ans !== null && (typeof ans === "object" ? Object.keys(ans).length > 0 : true);
            const active = i === currentIndex;
            const correct = checkedQuestions[q.id] && getQuestionStatus(q, ans) === "correct";
            const wrong = checkedQuestions[q.id] && getQuestionStatus(q, ans) !== "correct";

            return (
              <button
                key={q.id}
                onClick={() => navigateTo(i)}
                disabled={isAutoRevealing}
                className={\`relative w-10 h-10 rounded-full font-black text-sm transition-all duration-300 border-2 shrink-0 \${
                  active
                    ? "bg-amber-400 border-amber-500 text-white scale-125 shadow-lg shadow-amber-400/40 z-10"
                    : correct
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : wrong
                    ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/30"
                    : answered
                    ? "bg-primary border-primary text-white shadow-sm shadow-primary/30"
                    : "bg-white border-slate-200 text-slate-400 hover:border-primary/40 hover:text-primary"
                }\`}
              >
                {i + 1}
                {checkedQuestions[q.id] && (
                  <div className={\`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm \${correct ? "bg-emerald-500" : "bg-rose-500"}\`}>
                    {correct
                      ? <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                      : <X className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-6 pb-4 max-w-3xl mx-auto w-full">`;

const chunk1_replace = `  // ── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen font-body flex flex-col bg-[#8cd2f6]">
      {/* ── TOP HEADER (White) ── */}
      <div className="relative z-30 bg-white px-6 py-4 flex flex-col items-center justify-center shadow-sm">
        <div className="absolute left-6 top-6 z-40 hidden md:block">
          <FloatingTeacherInfo teacher={assignment.teacher} onNavigate={handleSafeNavigate} />
        </div>

        {/* Back Button */}
        <div className="absolute left-6 top-4">
          <BackButton className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-600 font-black text-sm tracking-wider rounded-full border-2 border-purple-100 hover:bg-purple-50 hover:border-purple-300 transition-all active:scale-95 shadow-sm">
            <ChevronLeft className="w-5 h-5 text-purple-500" />
            BACK
          </BackButton>
        </div>

        {/* Title */}
        <h2 className="text-base lg:text-lg font-black text-slate-800 uppercase tracking-widest text-center mt-2 flex items-center gap-3">
          <span className="text-rose-400 text-xl">✧</span> 
          {assignment.title || "FUN WITH SCHOOL TOOLS: QUIZ FOR LITTLE LEARNERS"} 
          <span className="text-rose-400 text-xl">✧</span>
        </h2>

        {/* Question Map */}
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
        </div>

        {/* Decorative Sun */}
        <div className="absolute right-10 top-4 hidden lg:flex pointer-events-none">
          <div className="w-16 h-16 bg-yellow-400 rounded-full shadow-[0_0_30px_rgba(250,204,21,0.6)] flex items-center justify-center relative">
            <div className="absolute inset-0 border-[4px] border-dashed border-yellow-300 rounded-full animate-spin-slow"></div>
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
            </div>
            <div className="absolute top-10 w-4 h-2 bg-rose-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (Image Background) ── */}
      <div 
        className="flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-28 w-full relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/kid_quiz_bg.png)' }}
      >
        <div className="w-full max-w-4xl mx-auto z-10 relative">`;

// Chunk 2
const chunk2_search = `          <div className={\`bg-white rounded-[2rem] border-4 shadow-2xl overflow-hidden transition-colors duration-500 \${
            isCorrectNow
              ? "border-emerald-400 shadow-emerald-200/60"
              : isWrongNow
              ? "border-rose-400 shadow-rose-200/60"
              : "border-primary/20 shadow-primary/10"
          }\`}>

            {/* Card header gradient */}
            <div className={\`px-6 py-4 flex items-center justify-between transition-all duration-500 \${
              isCorrectNow
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : isWrongNow
                ? "bg-gradient-to-r from-rose-500 to-pink-500"
                : "bg-gradient-to-r from-violet-600 to-indigo-600"
            }\`}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-white font-black text-sm uppercase tracking-widest">
                  Câu {currentIndex + 1} / {questions.length}
                </span>
                <span className="bg-white/25 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                  {qType === "MULTIPLE_SELECT" ? "Chọn nhiều đáp án"
                    : qType === "MATCHING" ? "Nối cặp"
                    : qType === "CLOZE_TEST" ? "Điền vào chỗ trống"
                    : qType === "TRUE_FALSE" ? "Đúng / Sai"
                    : "Chọn đáp án đúng"}
                </span>
              </div>
              {isChecked && (
                <div className="flex items-center gap-2 text-white font-black text-sm shrink-0">
                  {isCorrectNow
                    ? <><CheckCircle2 className="w-5 h-5" /> Đúng rồi! 🎉</>
                    : <><XCircle className="w-5 h-5" /> Sai rồi! 😅</>}
                </div>
              )}
            </div>`;

const chunk2_replace = `          <div className={\`bg-white rounded-[3rem] shadow-2xl overflow-visible transition-colors duration-500 relative border-8 \${
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
            </div>`;

// Chunk 3
const chunk3_search = `                    if (isChecked) {
                      if (isCorrectOpt) {
                        btnClass = "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-emerald-100";
                        labelClass = "bg-emerald-500 text-white";
                      } else if (isSelected) {
                        btnClass = "border-rose-500 bg-rose-50 text-rose-800 shadow-rose-100";
                        labelClass = "bg-rose-500 text-white";
                      } else {
                        btnClass = "border-slate-200 bg-slate-50 text-slate-400 opacity-50";
                        labelClass = "bg-slate-300 text-slate-500";
                      }
                    } else {
                      btnClass = isSelected
                        ? "border-primary bg-primary text-white shadow-primary/25"
                        : colors.base;
                      labelClass = isSelected ? "bg-white/30 text-white" : colors.label;
                    }

                    return (
                      <button
                        key={i}
                        disabled={isChecked}
                        onClick={() => handleAnswerChange(currentQuestion, i)}
                        className={\`flex items-center gap-5 w-full px-5 py-4 rounded-2xl border-2 font-bold text-left transition-all duration-200 shadow-sm \${btnClass} \${!isChecked ? "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]" : "cursor-default"}\`}
                      >
                        <div className={\`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 shadow-sm transition-all \${labelClass}\`}>
                          {isMultiSelect
                            ? <Check className={\`w-5 h-5 transition-all \${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"}\`} strokeWidth={3} />
                            : String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-base lg:text-lg flex-1">{option.text}</span>
                        {isChecked && isCorrectOpt && <CheckCircle2 className="ml-auto w-6 h-6 text-emerald-500 shrink-0" />}
                        {isChecked && isSelected && !isCorrectOpt && <XCircle className="ml-auto w-6 h-6 text-rose-500 shrink-0" />}
                      </button>
                    );`;

const chunk3_replace = `                    // New kid-friendly palette
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

// Chunk 4
const chunk4_search = `        {/* ── NAVIGATION BAR ── */}
        <div className="flex items-center justify-between w-full mt-6 gap-4">
          {/* Back */}
          <button
            disabled={currentIndex === 0 || isAutoRevealing}
            onClick={() => navigateTo(currentIndex - 1)}
            className={\`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all duration-200 border-2 shadow-sm \${
              currentIndex === 0 || isAutoRevealing
                ? "border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed"
                : "border-primary/30 bg-white text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            }\`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Câu trước</span>
          </button>

          {/* Progress */}
          <div className="flex items-center justify-center flex-1">
            {questions.length <= 12 ? (
              <div className="flex items-center gap-1.5">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={\`rounded-full transition-all duration-300 \${
                      i === currentIndex ? "w-8 h-3 bg-primary" : "w-3 h-3 bg-slate-200"
                    }\`}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-28 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                    style={{ width: \`\${((currentIndex + 1) / questions.length) * 100}%\` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  {currentIndex + 1} / {questions.length}
                </span>
              </div>
            )}
          </div>

          {/* Next / Check / Reset */}
          {currentIndex < questions.length - 1 ? (
            <button
              disabled={isAutoRevealing}
              onClick={() => navigateTo(currentIndex + 1)}
              className={\`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all duration-200 border-2 shadow-sm \${
                isAutoRevealing
                  ? "border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed"
                  : "border-secondary bg-secondary text-white hover:bg-secondary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 shadow-secondary/30"
              }\`}
            >
              <span className="hidden sm:inline">Câu tiếp</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : isAllChecked ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm border-2 border-orange-500 bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 shadow-md shadow-orange-500/30 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="hidden sm:inline">Làm lại</span>
            </button>
          ) : (
            <button
              disabled={isAutoRevealing}
              onClick={handleCheckAll}
              className={\`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm border-2 transition-all duration-200 \${
                isAutoRevealing
                  ? "border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed"
                  : "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 shadow-md shadow-emerald-500/30"
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
                  <span>Kiểm tra đáp án</span>
                </>
              )}
            </button>
          )}
        </div>`;

const chunk4_replace = `        {/* ── BOTTOM FLOATING NAVIGATION BAR ── */}
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

content = content.replace(chunk1_search, chunk1_replace);
content = content.replace(chunk2_search, chunk2_replace);
content = content.replace(chunk3_search, chunk3_replace);
content = content.replace(chunk4_search, chunk4_replace);

fs.writeFileSync(targetFile, content);
console.log('Patched KidTeenQuizRunner.tsx successfully.');
