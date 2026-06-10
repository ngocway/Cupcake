const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\ad849cca-6ec0-4736-b885-cb3805e2ab00';
const destDir = 'd:\\Cupcakes\\public\\games\\sentence-builder\\images';

const prefixes = [];
for(let i=21; i<=40; i++) {
  prefixes.push(`l2_q${i}_`);
  prefixes.push(`l3_q${i}_`);
}

const files = fs.readdirSync(srcDir);
let copied = 0;

prefixes.forEach(prefix => {
  // Find latest generated file for this prefix
  const matchingFiles = files.filter(f => f.startsWith(prefix) && f.endsWith('.png'));
  if (matchingFiles.length > 0) {
    // Sort by name (timestamp) descending to get the newest
    matchingFiles.sort().reverse();
    const file = matchingFiles[0];
    const destName = prefix.slice(0, -1) + '.png'; // e.g. l2_q21.png
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, destName));
    console.log(`Copied ${file} to ${destName}`);
    copied++;
  } else {
    console.log(`Warning: Could not find file for ${prefix}`);
  }
});

console.log(`Successfully copied ${copied} images.`);
