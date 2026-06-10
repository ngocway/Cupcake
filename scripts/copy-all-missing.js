const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\ad849cca-6ec0-4736-b885-cb3805e2ab00';
const destDir = 'd:\\Cupcakes\\public\\games\\sentence-builder\\images';

const missingData = JSON.parse(fs.readFileSync('missing-images.json', 'utf8'));
const files = fs.readdirSync(srcDir);
let copied = 0;

missingData.forEach(item => {
  const destName = path.basename(item.originalImage);
  const prefix = destName.replace('.png', '_').replace('.jpg', '_');
  
  const matchingFiles = files.filter(f => f.startsWith(prefix) && f.endsWith('.png'));
  if (matchingFiles.length > 0) {
    matchingFiles.sort().reverse();
    const file = matchingFiles[0];
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, destName));
    console.log(`Copied ${file} to ${destName}`);
    copied++;
  } else {
    console.log(`Warning: Could not find file for prefix ${prefix}`);
  }
});

console.log(`Successfully copied ${copied} images.`);
