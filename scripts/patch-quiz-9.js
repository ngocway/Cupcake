const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/app/student/assignments/[id]/run/quiz/KidTeenQuizRunner.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Make Card Body hug content (remove flex-1, overflow-y-auto, min-h-0)
content = content.replace(
  'className="px-[clamp(1rem,4vw,3rem)] py-[clamp(1rem,4dvh,2.5rem)] space-y-[clamp(1rem,2.5dvh,1.5rem)] flex-1 overflow-y-auto min-h-0 relative"',
  'className="px-[clamp(1rem,4vw,3rem)] py-[clamp(1rem,4dvh,2.5rem)] space-y-[clamp(1rem,2.5dvh,1.5rem)] relative"'
);

// We need to extract the navigation footer from the Card Wrapper, and put it right AFTER the Question Card.
// The current structure:
//             {/* ── CARD FOOTER (NAVIGATION) ── */}
//             <div className="w-full bg-slate-50/80 ...">
//               ... nav items ...
//             </div>
//           </div>  // end Card Wrapper
//         </div> // end Question Card

// We will find the CARD FOOTER and move it outside, styling it as a Glassmorphism pill.
const footerRegex = /\{\/\* ── CARD FOOTER \(NAVIGATION\) ── \*\/\}\s*<div className="w-full bg-slate-50\/80 backdrop-blur-sm px-\[clamp\(1rem,4vw,3rem\)\] py-\[clamp\(0.75rem,2dvh,1.25rem\)\] flex items-center justify-between border-t-2 border-slate-100 shrink-0 rounded-b-\[42px\] z-20">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/;

const footerMatch = content.match(footerRegex);
if (footerMatch) {
  const navItems = footerMatch[1];
  
  // Replace the extracted block with closing tags for Card Wrapper and Question Card, 
  // THEN insert the new Floating Footer.
  const newStructure = `
          </div>
        </div>

        {/* ── FLOATING GLASS NAVIGATION PILL ── */}
        <div className="w-full max-w-4xl mx-auto mt-6 bg-white/40 backdrop-blur-xl border-[3px] border-white/60 shadow-2xl shadow-purple-900/10 px-[clamp(1rem,4vw,3rem)] py-[clamp(0.75rem,2dvh,1.25rem)] flex items-center justify-between rounded-[3rem] z-20 animate-in slide-in-from-bottom-8 duration-500">
${navItems}
        </div>
`;
  content = content.replace(footerRegex, newStructure);
}

fs.writeFileSync(targetFile, content);
console.log('Patched layout 9 for snug card and floating glass footer successfully.');
