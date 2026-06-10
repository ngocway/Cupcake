require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { generateThumbnailFromTitle } = require('./src/actions/ai-image-generator.ts');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const title = "Mastering the Present Simple Forms of 'To Be'";
  console.log("Generating thumbnail for:", title);
  
  // Need to mock or ensure ts-node runs it correctly, actually calling TS from JS might be tricky without ts-node.
  // I will write a TS script instead.
}
main();
