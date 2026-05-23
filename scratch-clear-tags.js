const fs = require('fs');
const path = require('path');

// 1. Parse .env file manually to load Database URL
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes if any
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
  console.log('Loaded environment variables from .env file successfully.');
} else {
  console.log('Warning: .env file not found.');
}

const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  await prisma.$connect();
  console.log('Successfully connected to database.');

  console.log('Clearing all tags from Assignment table...');
  const assResult = await prisma.assignment.updateMany({
    data: { tags: "" }
  });
  console.log(`Updated ${assResult.count} assignments.`);

  console.log('Clearing all tags from QuestionBank table...');
  const qbResult = await prisma.questionBank.updateMany({
    data: { tags: "" }
  });
  console.log(`Updated ${qbResult.count} question banks.`);

  console.log('Clearing all tags from HomepageFeed table...');
  const feedResult = await prisma.homepageFeed.updateMany({
    data: { tags: [] }
  });
  console.log(`Updated ${feedResult.count} home feed items.`);

  console.log('All tags cleared successfully!');
}

main()
  .catch(err => {
    console.error('Error running script:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Disconnected from database.');
  });
