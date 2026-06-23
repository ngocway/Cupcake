"use server"

import openai from "@/lib/openai";
import { searchImagesAction } from "@/actions/image-search-actions";
import { uploadUrlMedia, uploadBufferToR2 } from "@/actions/upload-actions";
import { adminCreateFlashcard } from "@/actions/admin-flashcards";
import { generateTTSHelper } from "@/actions/lesson-ai";
import { auth } from "@/auth";

function getAgeGroupGuidelines(categoryName: string) {
  const cat = categoryName.toLowerCase();
  
  if (cat.includes("kindergarten") || cat.includes("< 6") || cat.includes("under 6")) {
    return {
      vocabulary: "Extremely simple, basic, concrete nouns or visual concepts (e.g., 'apple', 'cat', 'sun', 'ball'). Avoid abstract, complex, or multi-syllable words.",
      definition: "An extremely simple, child-friendly English definition using basic words suitable for children under 6 years old (e.g., 'a sweet red fruit' for apple).",
      example: "An extremely short and simple English sentence (Pre-A1 level, 3-6 words, e.g., 'The apple is red.', 'I see a cute dog.'). Use only basic words."
    };
  } else if (cat.includes("kid")) {
    return {
      vocabulary: "Simple, everyday vocabulary words that elementary school students (6-10 years old) encounter (e.g., 'kitchen', 'pencil', 'towel', 'giraffe'). Avoid overly formal or complex academic words.",
      definition: "A simple, clear English definition (A1-A2 level) using easy-to-understand language.",
      example: "A simple English sentence (A1 level, e.g., 'This is a clean towel.', 'The giraffe has a long neck.'). Keep it clear and direct."
    };
  } else if (cat.includes("teen")) {
    return {
      vocabulary: "General intermediate vocabulary words suitable for middle/high school students (11-16 years old) (e.g., 'tamarind', 'adventure', 'celebrate', 'solution').",
      definition: "A clear English definition at CEFR A2-B1 level.",
      example: "A natural, slightly longer English sentence (A2-B1 level, e.g., 'I gave some sour tamarind to my mother after school.'). Feel free to use compound sentences."
    };
  } else {
    // Default to Learner / Adult
    return {
      vocabulary: "Intermediate to advanced English vocabulary suitable for adults or advanced learners (16+ years old) (e.g., 'dilemma', 'consequence', 'nostalgic', 'persistent').",
      definition: "A clear, precise English definition at CEFR B1-B2 level.",
      example: "A natural, high-quality English sentence (B1-B2 level, e.g., 'He faced a difficult dilemma when choosing between two career paths.'). Use compound or complex structures where appropriate."
    };
  }
}

export async function generateFlashcardVocabularyList(categoryName: string, topicName: string, count: number) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: "Missing OPENAI_API_KEY. Please set it in .env file." };
  }

  if (count <= 0) return { success: true, vocabularies: [] };

  try {
    const guidelines = getAgeGroupGuidelines(categoryName);
    const prompt = `Generate a list of exactly ${count} English vocabulary words that are highly relevant to the topic "${topicName}" and appropriate for the age group "${categoryName}". 

    CRITICAL AGE-APPROPRIATE RULES for "${categoryName}":
    1. Vocabulary: Select words that match this guideline: ${guidelines.vocabulary}
    2. Definition: Define the words matching this guideline: ${guidelines.definition}
    3. Example Sentence: Create sentences matching this guideline: ${guidelines.example}

    For each word, provide:
    - "word": The English word
    - "phonetic": Its phonetic transcription
    - "definition": An English definition matching the rules above.
    - "definitionVi": A SHORT, direct Vietnamese translation (1-3 words max, e.g. "Quả chuối", NOT a definition).
    - "definitionTh": A SHORT, direct Thai translation (1-3 words max).
    - "definitionId": A SHORT, direct Indonesian translation (1-3 words max).
    - "exampleSentence": A simple English example sentence matching the rules above.
    - "imageSearchKeyword": A very descriptive English search keyword for finding a representative image on Google Images (e.g. for "dilemma", use "confused person at crossroads").

    Return the result as a JSON object with a single key "vocabularies" containing the array of these words.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert educational curriculum designer." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0].message.content;
    if (!text) {
      return { success: false, error: "Empty response from OpenAI" };
    }

    const data = JSON.parse(text);
    return { success: true, vocabularies: data.vocabularies || [] };
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return { success: false, error: error.message || "Không thể tạo danh sách từ vựng từ AI." };
  }
}

export async function generateSingleFlashcardWithImage(topicId: string, wordData: any, categoryName?: string) {
  try {
    let imageUrl = null;
    let audioUrl = null;

    // 1. Search for image
    if (wordData.imageSearchKeyword || wordData.word) {
      try {
        const searchKeyword = wordData.imageSearchKeyword || wordData.word;
        const images = await searchImagesAction(searchKeyword);
        if (images && images.length > 0) {
          // Pick the first image
          const firstImage = images[0];
          // Upload to R2 to make it permanent
          const uploadRes = await uploadUrlMedia(firstImage.url);
          if (uploadRes.success && uploadRes.url) {
            imageUrl = uploadRes.url;
          }
        }
      } catch (imgError) {
        console.error("Error finding or uploading image for", wordData.word, imgError);
        // Continue without image if it fails
      }
    }

    // 2. Generate TTS Audio
    if (wordData.word) {
      try {
        const session = await auth();
        const userId = session?.user?.id || "system";
        
        // Construct speechText: Word. Word. Example. Word.
        const word = wordData.word.trim();
        const exampleSentence = wordData.exampleSentence || "";
        const speechText = exampleSentence.trim() 
          ? `${word}. ${word}. ${exampleSentence} ${word}.`
          : `${word}. ${word}. ${word}.`;

        // Determine speed based on categoryName
        let speed = 1.0;
        if (categoryName) {
          const cat = categoryName.toLowerCase();
          if (cat.includes("kindergarten") || cat.includes("< 6") || cat.includes("under 6")) {
            speed = 0.8;
          }
        }

        console.log(`Generating auto TTS for bulk card: ${word} with speed ${speed}`);
        const ttsRes = await generateTTSHelper(speechText, "Aoede", speed, userId, "flashcard");
        if (ttsRes && ttsRes.url) {
          audioUrl = ttsRes.url;
        }
      } catch (ttsError) {
        console.error("Error generating auto TTS for word", wordData.word, ttsError);
        // Continue without audio if it fails
      }
    }

    // 3. Create flashcard
    const res = await adminCreateFlashcard({
      topicId: topicId,
      word: wordData.word,
      phonetic: wordData.phonetic,
      definition: wordData.definition,
      definitionVi: wordData.definitionVi,
      definitionTh: wordData.definitionTh,
      definitionId: wordData.definitionId,
      exampleSentence: wordData.exampleSentence,
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
    });

    return { success: res.success, error: res.error, card: res.card };
  } catch (error: any) {
    console.error("Error generating single flashcard:", error);
    return { success: false, error: error.message };
  }
}

// WAV Header Helper
function getWavHeader(dataLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

// Adaptive WAV audio splitter
async function splitWavFileAdaptive(audioUrl: string): Promise<Buffer | null> {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio file: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const riff = fileBuffer.toString('utf8', 0, 4);
  const wave = fileBuffer.toString('utf8', 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error("Not a valid RIFF/WAVE file");
  }

  const numChannels = fileBuffer.readUInt16LE(22);
  const sampleRate = fileBuffer.readUInt32LE(24);
  const bitsPerSample = fileBuffer.readUInt16LE(34);

  if (bitsPerSample !== 16) {
    throw new Error(`Unsupported bits per sample: ${bitsPerSample}`);
  }

  // Find the 'data' subchunk
  let dataOffset = 12;
  while (dataOffset < fileBuffer.length - 8) {
    const chunkId = fileBuffer.toString('utf8', dataOffset, dataOffset + 4);
    const chunkSize = fileBuffer.readUInt32LE(dataOffset + 4);
    if (chunkId === 'data') {
      dataOffset += 8;
      break;
    }
    dataOffset += 8 + chunkSize;
  }

  const pcmBytes = fileBuffer.subarray(dataOffset);
  const numSamples = pcmBytes.length / 2;
  const samples = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, numSamples);

  const frameSize = Math.floor(sampleRate * 0.01); // 10ms
  const numFrames = Math.floor(numSamples / frameSize);

  const frameEnergies = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    let sumAbs = 0;
    const start = i * frameSize;
    for (let j = 0; j < frameSize; j++) {
      sumAbs += Math.abs(samples[start + j]);
    }
    frameEnergies[i] = sumAbs / frameSize;
  }

  // Adaptive thresholds
  const options = [
    { activeThreshold: 200, silenceThreshold: 100, silenceDurationNeeded: 15 },
    { activeThreshold: 200, silenceThreshold: 120, silenceDurationNeeded: 12 },
    { activeThreshold: 150, silenceThreshold: 120, silenceDurationNeeded: 10 },
    { activeThreshold: 100, silenceThreshold: 150, silenceDurationNeeded: 8 },
    { activeThreshold: 80,  silenceThreshold: 180, silenceDurationNeeded: 6 },
    { activeThreshold: 50,  silenceThreshold: 200, silenceDurationNeeded: 5 }
  ];

  for (const opt of options) {
    let onsetFrame = -1;
    let offsetFrame = -1;

    for (let i = 0; i < numFrames; i++) {
      if (frameEnergies[i] > opt.activeThreshold) {
        onsetFrame = i;
        break;
      }
    }

    if (onsetFrame === -1) {
      continue;
    }

    for (let i = onsetFrame; i < numFrames; i++) {
      let isSilence = true;
      for (let j = 0; j < opt.silenceDurationNeeded; j++) {
        if (i + j >= numFrames || frameEnergies[i + j] > opt.silenceThreshold) {
          isSilence = false;
          break;
        }
      }
      if (isSilence) {
        offsetFrame = i;
        break;
      }
    }

    if (offsetFrame !== -1) {
      console.log(`  [Split Success] active=${opt.activeThreshold}, silence=${opt.silenceThreshold}, duration=${opt.silenceDurationNeeded}`);
      const cutFrame = Math.min(offsetFrame + 10, numFrames);
      const cutSampleIndex = cutFrame * frameSize;
      const cutByteLength = cutSampleIndex * 2;

      const cutPcmBytes = pcmBytes.subarray(0, cutByteLength);
      const newHeader = getWavHeader(cutPcmBytes.length, sampleRate, numChannels, bitsPerSample);
      return Buffer.concat([newHeader, cutPcmBytes]);
    }
  }

  // Fallback cut (first 1.2 seconds)
  console.log(`  [Split Fallback] Silence not found. Cutting first 1.2 seconds.`);
  const defaultDuration = 1.2;
  const cutFrame = Math.min(Math.floor(defaultDuration * 100), numFrames);
  const cutSampleIndex = cutFrame * frameSize;
  const cutByteLength = cutSampleIndex * 2;

  const cutPcmBytes = pcmBytes.subarray(0, cutByteLength);
  const newHeader = getWavHeader(cutPcmBytes.length, sampleRate, numChannels, bitsPerSample);
  return Buffer.concat([newHeader, cutPcmBytes]);
}

// Action to generate card image
export async function generateCardImageAction(word: string, imageSearchKeyword: string) {
  let imageUrl = null;
  if (imageSearchKeyword || word) {
    try {
      const searchKeyword = imageSearchKeyword || word;
      const images = await searchImagesAction(searchKeyword);
      if (images && images.length > 0) {
        const firstImage = images[0];
        const uploadRes = await uploadUrlMedia(firstImage.url);
        if (uploadRes.success && uploadRes.url) {
          imageUrl = uploadRes.url;
        }
      }
    } catch (imgError) {
      console.error("Error finding or uploading image for", word, imgError);
    }
  }
  return { success: true, imageUrl };
}

// Action to generate card audio (includes splitting)
export async function generateCardAudioAction(word: string, exampleSentence: string, categoryName?: string) {
  let audioUrl = null;
  let audioWordUrl = null;

  if (word) {
    try {
      const session = await auth();
      const userId = session?.user?.id || "system";
      
      const cleanWord = word.trim();
      const speechText = exampleSentence.trim() 
        ? `${cleanWord}. ${cleanWord}. ${exampleSentence} ${cleanWord}.`
        : `${cleanWord}. ${cleanWord}. ${cleanWord}.`;

      let speed = 1.0;
      if (categoryName) {
        const cat = categoryName.toLowerCase();
        if (cat.includes("kindergarten") || cat.includes("< 6") || cat.includes("under 6")) {
          speed = 0.8;
        }
      }

      console.log(`Generating auto TTS for server action card: ${cleanWord} with speed ${speed}`);
      const ttsRes = await generateTTSHelper(speechText, "Aoede", speed, userId, "flashcard");
      if (ttsRes && ttsRes.url) {
        audioUrl = ttsRes.url;

        // Try to split vocabulary audio
        try {
          console.log(`Splitting vocabulary audio for card: ${cleanWord}`);
          const splitBuffer = await splitWavFileAdaptive(audioUrl);
          if (splitBuffer) {
            const fileNameAudio = `tts-split-${cleanWord.replace(/\s+/g, '_')}-${Date.now()}.wav`;
            audioWordUrl = await uploadBufferToR2(splitBuffer, fileNameAudio, "audio/wav");
            console.log(`Uploaded word audio to R2: ${audioWordUrl}`);
          }
        } catch (splitErr) {
          console.error(`Error splitting audio for word: ${cleanWord}`, splitErr);
        }
      }
    } catch (ttsError) {
      console.error("Error generating auto TTS for word", word, ttsError);
    }
  }
  return { success: true, audioUrl, audioWordUrl };
}

