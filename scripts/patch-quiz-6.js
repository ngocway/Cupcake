const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/app/student/assignments/[id]/run/quiz/KidTeenQuizRunner.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const optionsSearch = `              {/* ── MULTIPLE CHOICE / SELECT ── */}
              {(qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") && (
                <div className="grid grid-cols-1 gap-3">
                  {(currentQuestionData.options || []).map((option: any, i: number) => {
                    const isSelected = isMultiSelect
                      ? Array.isArray(userAnswer) && userAnswer.includes(i)
                      : userAnswer === i;
                    const isCorrectOpt = option.isCorrect;
                    const colors = OPTION_COLORS[i % OPTION_COLORS.length];

                    let btnClass = "";
                    let labelClass = "";

                    // Exact specifications palette
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
                    );
                  })}
                </div>
              )}`;

const optionsReplace = `              {/* ── MULTIPLE CHOICE / SELECT ── */}
              {(qType === "MULTIPLE_CHOICE" || qType === "MULTIPLE_SELECT") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-12 pt-6">
                  {(currentQuestionData.options || []).map((option: any, i: number) => {
                    const isSelected = isMultiSelect
                      ? Array.isArray(userAnswer) && userAnswer.includes(i)
                      : userAnswer === i;
                    const isCorrectOpt = option.isCorrect;

                    const solarpunkStyles = [
                      { color: "text-emerald-900", bg: "bg-emerald-100", border: "border-emerald-300", iconBg: "bg-emerald-200", shadow: "shadow-emerald-900/10" },
                      { color: "text-orange-900", bg: "bg-orange-100", border: "border-orange-300", iconBg: "bg-orange-200", shadow: "shadow-orange-900/10" },
                      { color: "text-sky-900", bg: "bg-sky-100", border: "border-sky-300", iconBg: "bg-sky-200", shadow: "shadow-sky-900/10" },
                      { color: "text-purple-900", bg: "bg-purple-100", border: "border-purple-300", iconBg: "bg-purple-200", shadow: "shadow-purple-900/10" },
                      { color: "text-rose-900", bg: "bg-rose-100", border: "border-rose-300", iconBg: "bg-rose-200", shadow: "shadow-rose-900/10" },
                    ];
                    
                    const blobShapes = [
                      "rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem]",
                      "rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem]",
                      "rounded-[2.5rem_4.5rem_3rem_4rem_/_4rem_3rem_4.5rem_2.5rem]",
                      "rounded-[4rem_2.5rem_4rem_3rem_/_2.5rem_4.5rem_3rem_4.5rem]",
                      "rounded-[3rem_4rem_2.5rem_4.5rem_/_4.5rem_2.5rem_4.5rem_3rem]",
                    ];

                    const theme = solarpunkStyles[i % solarpunkStyles.length];
                    const blobShape = blobShapes[i % blobShapes.length];

                    let containerClass = \`\${theme.bg} \${theme.border} \${theme.shadow}\`;
                    let textClass = theme.color;
                    let iconClass = \`\${theme.iconBg} \${theme.color}\`;

                    if (isChecked) {
                      if (isCorrectOpt) {
                        containerClass = "bg-emerald-100 border-emerald-400 shadow-emerald-900/10 scale-[1.02]";
                        textClass = "text-emerald-900";
                        iconClass = "bg-emerald-500 text-white";
                      } else if (isSelected) {
                        containerClass = "bg-rose-100 border-rose-400 shadow-rose-900/10";
                        textClass = "text-rose-900";
                        iconClass = "bg-rose-500 text-white";
                      } else {
                        containerClass = "bg-slate-50 border-slate-200 opacity-60";
                        textClass = "text-slate-500";
                        iconClass = "bg-slate-200 text-slate-500";
                      }
                    } else if (isSelected) {
                      containerClass = \`\${theme.bg} \${theme.border} scale-[1.05] shadow-xl z-10 animate-solar-pulse border-4\`;
                      iconClass = \`\${theme.iconBg} \${theme.color} scale-110 -rotate-6 shadow-xl\`;
                    }

                    return (
                      <button
                        key={i}
                        disabled={isChecked}
                        onClick={() => handleAnswerChange(currentQuestion, i)}
                        className={\`group relative min-h-[6rem] w-full \${blobShape} p-6 transition-all duration-700 flex flex-col items-center justify-center border-[3px] shadow-lg \${containerClass} \${!isChecked && !isSelected ? "hover:scale-[1.03]" : ""}\`}
                        style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}
                      >
                        {/* Floating Badge (A, B, C, D) */}
                        <div className={\`absolute -top-5 -left-4 rounded-full shadow-lg transition-all duration-700 flex items-center justify-center w-12 h-12 text-2xl font-[900] \${iconClass} \${!isChecked && !isSelected ? "group-hover:scale-110 group-hover:-rotate-12" : ""}\`}>
                          {isMultiSelect
                            ? <Check className={\`w-6 h-6 transition-all \${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"}\`} strokeWidth={4} />
                            : String.fromCharCode(65 + i)}
                        </div>

                        <span className={\`relative z-10 font-[800] text-xl md:text-2xl tracking-tight transition-all duration-500 \${textClass} text-center\`}>
                          {option.text}
                        </span>

                        {/* Status Icons */}
                        {isChecked && isCorrectOpt && <CheckCircle2 className="absolute top-4 right-4 w-8 h-8 text-emerald-600 shrink-0" />}
                        {isChecked && isSelected && !isCorrectOpt && <XCircle className="absolute top-4 right-4 w-8 h-8 text-rose-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}`;

content = content.replace(optionsSearch, optionsReplace);

fs.writeFileSync(targetFile, content);
console.log('Patched layout options to blob styles successfully.');
