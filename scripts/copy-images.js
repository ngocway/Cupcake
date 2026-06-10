const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\ad849cca-6ec0-4736-b885-cb3805e2ab00';
const destDir = 'd:\\Cupcakes\\public\\games\\sentence-builder\\images';

const mappings = [
  { prefix: 'l1_q23_', dest: 'l1_q23.png' },
  { prefix: 'l1_q24_', dest: 'l1_q24.png' },
  { prefix: 'l1_q25_', dest: 'l1_q25.png' },
  { prefix: 'l1_q26_', dest: 'l1_q26.png' },
  { prefix: 'l1_q27_', dest: 'l1_q27.png' },
  { prefix: 'l1_q28_', dest: 'l1_q28.png' },
  { prefix: 'l1_q29_', dest: 'l1_q29.png' },
  { prefix: 'l1_q30_', dest: 'l1_q30.png' },
  { prefix: 'l1_q31_', dest: 'l1_q31.png' },
  { prefix: 'l1_q32_', dest: 'l1_q32.png' },
  { prefix: 'l1_q33_', dest: 'l1_q33.png' },
  { prefix: 'l1_q34_', dest: 'l1_q34.png' },
  { prefix: 'l1_q35_', dest: 'l1_q35.png' },
  { prefix: 'l1_q36_', dest: 'l1_q36.png' },
  { prefix: 'l1_q37_', dest: 'l1_q37.png' },
  { prefix: 'l1_q38_', dest: 'l1_q38.png' },
  { prefix: 'l1_q39_', dest: 'l1_q39.png' },
  { prefix: 'l1_q40_', dest: 'l1_q40.png' }
];

const files = fs.readdirSync(srcDir);

mappings.forEach(map => {
  const file = files.find(f => f.startsWith(map.prefix) && f.endsWith('.png'));
  if (file) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, map.dest));
    console.log(`Copied ${file} to ${map.dest}`);
  } else {
    console.log(`Warning: Could not find file for ${map.prefix}`);
  }
});
