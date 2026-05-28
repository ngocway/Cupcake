const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/app/student/assignments/[id]/run/quiz/KidTeenQuizRunner.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Make Card Wrapper flex column and max-h-[85dvh]
content = content.replace(
  /className=\{`bg-white rounded-\[48px\] shadow-xl overflow-visible transition-colors duration-500 relative border-\[6px\] \$\{/g,
  'className={`bg-white rounded-[48px] shadow-xl overflow-visible transition-colors duration-500 relative border-[6px] flex flex-col max-h-[85dvh] ${'
);

// 2. Make Card body scrollable and fluid
content = content.replace(
  'className="px-8 py-8 lg:px-12 lg:pt-10 lg:pb-8 space-y-6"',
  'className="px-[clamp(1rem,4vw,3rem)] py-[clamp(1rem,4dvh,2.5rem)] space-y-[clamp(1rem,2.5dvh,1.5rem)] flex-1 overflow-y-auto min-h-0 relative"'
);

// 3. Question text fluid
content = content.replace(
  'className="text-2xl lg:text-3xl font-[800] text-[#2D366D] leading-tight"',
  'className="text-[clamp(1.25rem,3.5dvh,2rem)] font-[800] text-[#2D366D] leading-tight"'
);

// 4. Options Container gap fluid
content = content.replace(
  'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-8 pt-4"',
  'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-[clamp(1rem,4dvh,2rem)] pt-[clamp(0.5rem,1.5dvh,1rem)]"'
);

// 5. Option Button fluid
content = content.replace(
  /className=\{`group relative min-h-\[5rem\] w-full \$\{blobShape\} py-4 px-6 transition-all/g,
  'className={`group relative min-h-[clamp(4.5rem,9dvh,6rem)] w-full ${blobShape} py-[clamp(0.75rem,2dvh,1.25rem)] px-[clamp(1rem,3vw,1.5rem)] transition-all'
);

// 6. Option Badge fluid positioning
content = content.replace(
  /className=\{`absolute -top-4 -left-3 rounded-full shadow-lg transition-all duration-700 flex items-center justify-center w-10 h-10 text-xl font-\[900\]/g,
  'className={`absolute -top-3 -left-2 sm:-top-4 sm:-left-3 rounded-full shadow-lg transition-all duration-700 flex items-center justify-center w-10 h-10 text-xl font-[900]'
);

// 7. Option Text fluid
content = content.replace(
  /className=\{`relative z-10 font-\[800\] text-lg md:text-xl tracking-tight transition-all duration-500 \$\{textClass\} text-center`\}/g,
  'className={`relative z-10 font-[800] text-[clamp(1rem,2.5dvh,1.25rem)] tracking-tight transition-all duration-500 ${textClass} text-center`}'
);

// 8. Main container padding reduction (since card is max-h-[85dvh], we don't need huge pb)
content = content.replace(
  'className="flex-1 flex flex-col items-center justify-center px-4 pt-6 pb-36 lg:pb-48 w-full relative bg-cover bg-center bg-no-repeat"',
  'className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full relative bg-cover bg-center bg-no-repeat"'
);


// 9. Move Navigation Bar inside Card Wrapper
// We need to extract the navigation bar, remove it from the bottom, and place it inside the card wrapper.
const navSearchRegex = /\{\/\* ── BOTTOM NAVIGATION BAR ── \*\/\}\s*<div className="fixed bottom-4 sm:bottom-8 left-1\/2 -translate-x-1\/2 w-\[95%\] max-w-4xl bg-white px-5 sm:px-8 py-4 rounded-\[3rem\] flex items-center justify-between shadow-lg shadow-black\/10 border border-slate-100 z-50">([\s\S]*?)<\/div>\s*<\/>\s*\)\}\s*<\/div>\s*<\/div>/;

const navMatch = content.match(navSearchRegex);

if (navMatch) {
  const navContent = navMatch[1];
  
  // Replace the old nav block with just the closing tags for Question Card
  content = content.replace(navSearchRegex, `</>\n      )}\n      </div>\n    </div>`);
  
  // Now we find the end of the Card Wrapper to insert the nav inside it
  // The Card Wrapper ends right before:
  //       </div>
  //     </div>
  //
  //     {/* ── SIDE PANEL TOGGLE BUTTON ── */}
  
  const insertNavRegex = /\s*<\/div>\s*<\/div>\s*\{\/\* ── SIDE PANEL TOGGLE BUTTON ── \*\/\}/;
  
  const newNavCode = `
            {/* ── CARD FOOTER (NAVIGATION) ── */}
            <div className="w-full bg-slate-50/80 backdrop-blur-sm px-[clamp(1rem,4vw,3rem)] py-[clamp(0.75rem,2dvh,1.25rem)] flex items-center justify-between border-t-2 border-slate-100 shrink-0 rounded-b-[42px] z-20">
${navContent}
            </div>
          </div>
        </div>
        
    {/* ── SIDE PANEL TOGGLE BUTTON ── */}`;

  content = content.replace(insertNavRegex, newNavCode);
} else {
  console.log("Could not find nav block.");
}

fs.writeFileSync(targetFile, content);
console.log('Patched layout 8 for fluid inner scroll successfully.');
