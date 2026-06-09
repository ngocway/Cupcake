import { PrismaClient } from "../src/generated/client";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import "dotenv/config";

const prisma = new PrismaClient();

const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 environment variables are missing');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
};

function getWavHeader(dataSize: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const fileSize = 36 + dataSize;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return header;
}

async function createTTSAudio(word: string, exampleSentence: string) {
  const speechText = `${word}. ${word}. ${exampleSentence} ${word}.`;
  console.log("Speech text:", speechText);

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables");
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;
  const rateStr = "slow";
  const ssmlText = `<speak><prosody rate="${rateStr}">${speechText}</prosody></speak>`;

  const geminiReqBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: ssmlText }]
      }
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Aoede"
          }
        }
      }
    }
  };

  const response = await fetch(geminiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(geminiReqBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const inlineData = parts.find((p: any) => p.inlineData)?.inlineData;
  
  if (!inlineData || !inlineData.data) {
    throw new Error("No audio data returned from Gemini");
  }

  const pcmBuffer = Buffer.from(inlineData.data, "base64");
  const wavHeader = getWavHeader(pcmBuffer.length, 24000, 1, 16);
  const buffer = Buffer.concat([wavHeader, pcmBuffer]);
  const mimeType = "audio/wav";

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL;

  if (!bucketName || !publicUrlBase) {
    throw new Error('R2_BUCKET_NAME or NEXT_PUBLIC_R2_URL is not set');
  }

  const s3Client = getR2Client();
  const fileName = `tts-gemini-system-${Date.now()}.wav`;
  const filePath = `uploads/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filePath,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  const publicUrl = `${publicUrlBase.replace(/\/$/, '')}/${filePath}`;
  return publicUrl;
}

async function main() {
  try {
    console.log("Checking Category...");
    let category = await prisma.flashcardCategory.findUnique({
      where: { slug: "kids-2-5" }
    });

    if (!category) {
      console.log("Category not found, creating new category...");
      category = await prisma.flashcardCategory.create({
        data: {
          name: "Kids (2-5 years)",
          slug: "kids-2-5"
        }
      });
    }

    console.log("Checking Topic...");
    let topic = await prisma.flashcardTopic.findFirst({
      where: { categoryId: category.id, slug: "do-dung-trong-nha" }
    });

    if (!topic) {
      console.log("Topic not found, creating new topic...");
      topic = await prisma.flashcardTopic.create({
        data: {
          categoryId: category.id,
          name: "Đồ dùng trong nhà",
          slug: "do-dung-trong-nha"
        }
      });
    }

    const cardsToCreate = [
      {
        word: "Sofa",
        phonetic: "/ˈsəʊ.fə/",
        definition: "A long, soft seat with a back and usually arms",
        definitionVi: "Ghế sô pha",
        definitionTh: "โซฟา",
        exampleSentence: "I sit on the sofa.",
        orderIndex: 3
      },
      {
        word: "Television",
        phonetic: "/ˈtel.ɪ.vɪʒ.ən/",
        definition: "A device with a screen for receiving television signals",
        definitionVi: "Ti vi",
        definitionTh: "โทรทัศน์",
        exampleSentence: "I watch television.",
        orderIndex: 4
      },
      {
        word: "Lamp",
        phonetic: "/læmp/",
        definition: "A device for giving light",
        definitionVi: "Cái đèn",
        definitionTh: "โคมไฟ",
        exampleSentence: "I turn on the lamp.",
        orderIndex: 5
      },
      {
        word: "Window",
        phonetic: "/ˈwɪn.dəʊ/",
        definition: "An opening in a wall or vehicle that lets in light",
        definitionVi: "Cửa sổ",
        definitionTh: "หน้าต่าง",
        exampleSentence: "I open the window.",
        orderIndex: 6
      },
      {
        word: "Door",
        phonetic: "/dɔːr/",
        definition: "A flat object that is used to close the entrance of something",
        definitionVi: "Cửa ra vào",
        definitionTh: "ประตู",
        exampleSentence: "I close the door.",
        orderIndex: 7
      },
      {
        word: "Clock",
        phonetic: "/klɒk/",
        definition: "A device for measuring and showing time",
        definitionVi: "Đồng hồ",
        definitionTh: "นาฬิกา",
        exampleSentence: "I look at the clock.",
        orderIndex: 8
      },
      {
        word: "Carpet",
        phonetic: "/ˈkɑː.pɪt/",
        definition: "A thick woven material used for covering floors",
        definitionVi: "Tấm thảm",
        definitionTh: "พรม",
        exampleSentence: "I play on the carpet.",
        orderIndex: 9
      },
      {
        word: "Pillow",
        phonetic: "/ˈpɪl.əʊ/",
        definition: "A rectangular cloth bag filled with soft material",
        definitionVi: "Cái gối",
        definitionTh: "หมอน",
        exampleSentence: "I sleep on the pillow.",
        orderIndex: 10
      },
      {
        word: "Blanket",
        phonetic: "/ˈblæŋ.kɪt/",
        definition: "A flat cover made of wool or similar warm material",
        definitionVi: "Cái chăn",
        definitionTh: "ผ้าห่ม",
        exampleSentence: "I need a blanket.",
        orderIndex: 11
      },
      {
        word: "Cup",
        phonetic: "/kʌp/",
        definition: "A small, round container used for drinking",
        definitionVi: "Cái cốc",
        definitionTh: "ถ้วย",
        exampleSentence: "I drink from the cup.",
        orderIndex: 12
      },
      {
        word: "Spoon",
        phonetic: "/spuːn/",
        definition: "An object consisting of a round, hollow part and a handle",
        definitionVi: "Cái thìa",
        definitionTh: "ช้อน",
        exampleSentence: "I eat with a spoon.",
        orderIndex: 13
      },
      {
        word: "Fork",
        phonetic: "/fɔːk/",
        definition: "An implement with two or more prongs used for eating",
        definitionVi: "Cái dĩa",
        definitionTh: "ส้อม",
        exampleSentence: "I use a fork.",
        orderIndex: 14
      },
      {
        word: "Plate",
        phonetic: "/pleɪt/",
        definition: "A flat, usually round dish",
        definitionVi: "Cái đĩa",
        definitionTh: "จาน",
        exampleSentence: "The food is on the plate.",
        orderIndex: 15
      },
      {
        word: "Bowl",
        phonetic: "/bəʊl/",
        definition: "A round container that is open at the top",
        definitionVi: "Cái bát",
        definitionTh: "ชาม",
        exampleSentence: "I eat from the bowl.",
        orderIndex: 16
      },
      {
        word: "Mirror",
        phonetic: "/ˈmɪr.ər/",
        definition: "A piece of glass with a shiny, metal-covered back",
        definitionVi: "Cái gương",
        definitionTh: "กระจก",
        exampleSentence: "I look in the mirror.",
        orderIndex: 17
      },
      {
        word: "Sink",
        phonetic: "/sɪŋk/",
        definition: "A bowl that is attached to the wall in a kitchen or bathroom",
        definitionVi: "Bồn rửa",
        definitionTh: "อ่างล้างจาน",
        exampleSentence: "I wash my hands in the sink.",
        orderIndex: 18
      },
      {
        word: "Towel",
        phonetic: "/taʊəl/",
        definition: "A piece of cloth or paper used for drying someone or something",
        definitionVi: "Cái khăn",
        definitionTh: "ผ้าเช็ดตัว",
        exampleSentence: "I dry my hands with a towel.",
        orderIndex: 19
      }
    ];

    for (const cardData of cardsToCreate) {
      console.log(`Generating Audio for ${cardData.word}...`);
      const audioUrl = await createTTSAudio(cardData.word, cardData.exampleSentence);
      console.log(`Generated Audio URL for ${cardData.word}:`, audioUrl);

      console.log(`Saving Flashcard ${cardData.word}...`);
      const flashcard = await prisma.globalFlashcard.create({
        data: {
          topicId: topic.id,
          word: cardData.word,
          phonetic: cardData.phonetic,
          definition: cardData.definition,
          definitionVi: cardData.definitionVi,
          definitionTh: cardData.definitionTh,
          exampleSentence: cardData.exampleSentence,
          audioUrl: audioUrl,
          orderIndex: cardData.orderIndex
        }
      });
      console.log("Flashcard created successfully:", flashcard.id);
    }
  } catch (error) {
    console.error("Error creating flashcard:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
