const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/app/student/assignments/[id]/run/quiz/KidTeenQuizRunner.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Put back flex-1 overflow-y-auto min-h-0 to the Card body
content = content.replace(
  'className="px-[clamp(1rem,4vw,3rem)] py-[clamp(1rem,4dvh,2.5rem)] space-y-[clamp(1rem,2.5dvh,1.5rem)] relative"',
  'className="px-[clamp(1rem,4vw,3rem)] py-[clamp(1rem,4dvh,2.5rem)] space-y-[clamp(1rem,2.5dvh,1.5rem)] flex-1 overflow-y-auto min-h-0 relative"'
);

// 2. Extract the Floating Pill and put it back as Card Footer
const floatingPillRegex = /\{\/\* ── FLOATING GLASS NAVIGATION PILL ── \*\/\}\s*<div className="w-full max-w-4xl mx-auto mt-6 bg-white\/40 backdrop-blur-xl border-\[3px\] border-white\/60 shadow-2xl shadow-purple-900\/10 px-\[clamp\(1rem,4vw,3rem\)\] py-\[clamp\(0.75rem,2dvh,1.25rem\)\] flex items-center justify-between rounded-\[3rem\] z-20 animate-in slide-in-from-bottom-8 duration-500">([\s\S]*?)<\/div>/;

const match = content.match(floatingPillRegex);

if (match) {
  const navItems = match[1];

  // Remove the floating pill
  content = content.replace(floatingPillRegex, '');

  // Now insert it back inside the Card Wrapper.
  // The Card Wrapper ends at:
  //       )}
  //             
  //           </div>
  //         </div>
  // Let's find exactly the end of Card Wrapper.
  
  const endOfCardWrapperRegex = /\s*<\/div>\s*<\/div>\s*\{\/\* ── SIDE PANEL TOGGLE BUTTON ── \*\/\}/;
  
  const newFooter = `
            {/* ── CARD FOOTER (NAVIGATION) ── */}
            <div className="w-full bg-transparent px-[clamp(1rem,4vw,3rem)] py-[clamp(0.75rem,2dvh,1.25rem)] flex items-center justify-between border-t border-slate-100 shrink-0 z-20">
${navItems}
            </div>
          </div>
        </div>

    {/* ── SIDE PANEL TOGGLE BUTTON ── */}`;

  content = content.replace(endOfCardWrapperRegex, newFooter);
}

fs.writeFileSync(targetFile, content);
console.log('Undid patch 9 and applied Transparent Footer (Hướng 2).');
