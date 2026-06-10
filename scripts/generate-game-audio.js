const fs = require('fs');
const path = require('path');
const https = require('https');
const googleTTS = require('google-tts-api');

const htmlPath = path.join(__dirname, '../public/games/sentence-builder/index.html');
const audioDir = path.join(__dirname, '../public/games/sentence-builder/audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// Match all expected arrays and audio paths
const regex = /expected:\s*\[([^\]]+)\].*?audio:\s*"([^"]+)"/g;
let match;
const tasks = [];

while ((match = regex.exec(htmlContent)) !== null) {
  const sentence = match[1].replace(/"/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  let audioPath = match[2];
  
  tasks.push({ sentence, audioPath });
}

console.log(`Found ${tasks.length} audio files to generate.`);

function downloadAudio(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function processTasks() {
  for (const task of tasks) {
    const destPath = path.join(__dirname, '../public', task.audioPath);
    if (!fs.existsSync(destPath)) {
      console.log(`Generating audio for: "${task.sentence}" -> ${task.audioPath}`);
      try {
        const url = googleTTS.getAudioUrl(task.sentence, {
          lang: 'en',
          slow: false,
          host: 'https://translate.google.com',
        });
        await downloadAudio(url, destPath);
        // Wait a bit to avoid rate limiting
        await new Promise(res => setTimeout(res, 500));
      } catch (e) {
        console.error(`Failed to generate ${task.audioPath}:`, e.message);
      }
    }
  }
  console.log('All missing audio files generated successfully!');
}

processTasks();
