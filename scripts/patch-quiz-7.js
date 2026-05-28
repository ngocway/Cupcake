const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/app/student/assignments/[id]/run/quiz/KidTeenQuizRunner.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Replace 1: Main container pt-10 -> pt-6
content = content.replace(
  'className="flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-36 lg:pb-48 w-full relative bg-cover bg-center bg-no-repeat"',
  'className="flex-1 flex flex-col items-center justify-center px-4 pt-6 pb-36 lg:pb-48 w-full relative bg-cover bg-center bg-no-repeat"'
);

// Replace 2: Card body spacing
content = content.replace(
  'className="px-8 py-12 lg:px-12 lg:pt-16 lg:pb-12 space-y-10"',
  'className="px-8 py-8 lg:px-12 lg:pt-10 lg:pb-8 space-y-6"'
);

// Replace 3: Question Text size
content = content.replace(
  'className="text-[1.75rem] lg:text-[2rem] font-[800] text-[#2D366D] leading-tight"',
  'className="text-2xl lg:text-3xl font-[800] text-[#2D366D] leading-tight"'
);

// Replace 4: Options Container gap
content = content.replace(
  'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-12 pt-6"',
  'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-8 pt-4"'
);

// Replace 5: Option Button size and padding
content = content.replace(
  /className=\{`group relative min-h-\[6rem\] w-full \$\{blobShape\} p-6 transition-all/g,
  'className={`group relative min-h-[5rem] w-full ${blobShape} py-4 px-6 transition-all'
);

// Replace 6: Option Badge size
content = content.replace(
  /className=\{`absolute -top-5 -left-4 rounded-full shadow-lg transition-all duration-700 flex items-center justify-center w-12 h-12 text-2xl font-\[900\]/g,
  'className={`absolute -top-4 -left-3 rounded-full shadow-lg transition-all duration-700 flex items-center justify-center w-10 h-10 text-xl font-[900]'
);

// Replace 7: Option Text size
content = content.replace(
  /className=\{`relative z-10 font-\[800\] text-xl md:text-2xl tracking-tight transition-all duration-500 \$\{textClass\} text-center`\}/g,
  'className={`relative z-10 font-[800] text-lg md:text-xl tracking-tight transition-all duration-500 ${textClass} text-center`}'
);

fs.writeFileSync(targetFile, content);
console.log('Patched layout 7 for smaller sizing successfully.');
