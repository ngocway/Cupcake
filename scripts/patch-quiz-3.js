const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/app/student/assignments/[id]/run/quiz/KidTeenQuizRunner.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Replace the Question Card logic
const cardSearch = `          <div className={\`bg-white rounded-[2rem] p-3 shadow-xl overflow-visible transition-colors duration-500 relative border-4 \${
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

const cardReplace = `          {/* Card Wrapper with exact border and border-radius */}
          <div className={\`bg-white rounded-[48px] shadow-xl overflow-visible transition-colors duration-500 relative border-[6px] \${
            isCorrectNow
              ? "border-emerald-400"
              : isWrongNow
              ? "border-rose-400"
              : "border-[#9A89FF]"
          }\`}>

            {/* Header Label overlapping top left */}
            <div className="absolute -top-8 left-10 z-20">
              <div className="bg-[#7C66FF] rounded-full px-6 py-3 flex items-center shadow-md relative">
                <span className="text-white font-black text-xl tracking-widest uppercase">
                  CÂU {currentIndex + 1} / {questions.length}
                </span>
                <div className="absolute -top-4 -right-4 transform rotate-12">
                   <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-md border-[3px] border-white">
                     <Star className="w-5 h-5 text-white fill-white" />
                   </div>
                </div>
              </div>
            </div>

            {/* Optional Type Label (moved to top right) */}
            <div className="absolute -top-6 right-10 z-20 hidden sm:block">
              <span className="bg-[#9A89FF] text-white text-sm font-bold px-5 py-2 rounded-full shadow-md whitespace-nowrap">
                {qType === "MULTIPLE_SELECT" ? "Chọn nhiều đáp án"
                  : qType === "MATCHING" ? "Nối cặp"
                  : qType === "CLOZE_TEST" ? "Điền vào chỗ trống"
                  : qType === "TRUE_FALSE" ? "Đúng / Sai"
                  : "Chọn đáp án đúng"}
              </span>
            </div>

            {isChecked && (
              <div className="absolute -top-6 right-10 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-20">
                <div className={\`flex items-center gap-2 text-white font-black text-sm whitespace-nowrap px-5 py-2 rounded-full shadow-md \${isCorrectNow ? "bg-emerald-500" : "bg-rose-500"}\`}>
                  {isCorrectNow
                    ? <><CheckCircle2 className="w-5 h-5" /> Đúng rồi! 🎉</>
                    : <><XCircle className="w-5 h-5" /> Sai rồi! 😅</>}
                </div>
              </div>
            )}

            {/* Card body */}
            <div className="px-8 py-12 lg:px-12 lg:pt-16 lg:pb-12 space-y-10">
              {/* Question text */}
              {questionText && questionText !== "{}" && (
                <div className="text-center relative w-full">
                  <h3 className="text-[1.75rem] lg:text-[2rem] font-[800] text-[#2D366D] leading-tight" style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}>
                    {questionText}
                  </h3>
                </div>
              )}`;

const optionsSearch = `                    // New kid-friendly palette
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

const optionsReplace = `                    // Exact specifications palette
                    const EXACT_PALETTE = [
                      { border: "#3b82f6", bg: "transparent", text: "#3b82f6" }, // Blue for A
                      { border: "#10b981", bg: "transparent", text: "#10b981" }, // Green for B
                      { border: "#f59e0b", bg: "transparent", text: "#f59e0b" }, // Orange for C
                      { border: "#8b5cf6", bg: "transparent", text: "#8b5cf6" }, // Purple for D (fallback)
                    ];
                    const theme = EXACT_PALETTE[i % EXACT_PALETTE.length];

                    let btnStyle = { borderColor: theme.border };
                    let labelStyle = { backgroundColor: theme.border };
                    let textStyle = { color: theme.border, fontFamily: "'Quicksand', 'Nunito', sans-serif" };

                    if (isChecked) {
                      if (isCorrectOpt) {
                        btnStyle = { borderColor: "#10b981", backgroundColor: "#ecfdf5" };
                        labelStyle = { backgroundColor: "#10b981" };
                        textStyle = { color: "#047857", fontFamily: "'Quicksand', 'Nunito', sans-serif" };
                      } else if (isSelected) {
                        btnStyle = { borderColor: "#f43f5e", backgroundColor: "#fff1f2" };
                        labelStyle = { backgroundColor: "#f43f5e" };
                        textStyle = { color: "#be123c", fontFamily: "'Quicksand', 'Nunito', sans-serif" };
                      } else {
                        btnStyle = { borderColor: "#e2e8f0", backgroundColor: "#f8fafc", opacity: 0.6 };
                        labelStyle = { backgroundColor: "#cbd5e1" };
                        textStyle = { color: "#94a3b8", fontFamily: "'Quicksand', 'Nunito', sans-serif" };
                      }
                    } else if (isSelected) {
                      btnStyle = { borderColor: theme.border, backgroundColor: theme.border, color: "white" };
                      labelStyle = { backgroundColor: "white", color: theme.border };
                      textStyle = { color: "white", fontFamily: "'Quicksand', 'Nunito', sans-serif" };
                    }

                    return (
                      <button
                        key={i}
                        disabled={isChecked}
                        onClick={() => handleAnswerChange(currentQuestion, i)}
                        className="group flex items-center gap-5 w-full px-6 transition-all duration-300 bg-white hover:-translate-y-1 shadow-sm hover:shadow-md"
                        style={{ ...btnStyle, borderRadius: "32px", height: "80px", borderStyle: "solid", borderWidth: "3px" }}
                      >
                        {/* Scalloped badge simulation (rounded full) */}
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-[900] shrink-0 transition-all text-white shadow-inner"
                          style={{ ...labelStyle, boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.15)" }}
                        >
                          {isMultiSelect
                            ? <Check className={\`w-6 h-6 transition-all \${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"}\`} strokeWidth={4} />
                            : String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-xl sm:text-2xl flex-1 ml-2 font-[800]" style={textStyle}>
                          {option.text}
                        </span>
                        {/* Illustration Icon (Using an icon mapping based on letter if possible, or just a decorative star/sparkle for now since we don't have exact image assets) */}
                        {!isChecked && !isSelected && (
                           <Star className="ml-auto w-6 h-6 shrink-0 opacity-40" style={{ color: theme.border }} fill="currentColor" />
                        )}
                        {isChecked && isCorrectOpt && <CheckCircle2 className="ml-auto w-8 h-8 text-emerald-500 shrink-0" />}
                        {isChecked && isSelected && !isCorrectOpt && <XCircle className="ml-auto w-8 h-8 text-rose-500 shrink-0" />}
                      </button>
                    );`;

content = content.replace(cardSearch, cardReplace);
content = content.replace(optionsSearch, optionsReplace);

fs.writeFileSync(targetFile, content);
console.log('Patched layout 3 successfully.');
