"use server";

import openai from "@/lib/openai";

export async function generateVocabularyDetails(word: string, categoryName?: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { error: "Missing OPENAI_API_KEY. Please set it in .env file." };
  }

  try {
    // Determine age-appropriate guidelines
    let explanationGuideline = "a very clear, simple English definition using easy words (A1-A2 level)";
    let examplesGuideline = "exactly 2-3 extremely simple, short, and easy-to-understand English example sentences (A1 level, using only basic vocabulary with very few new words)";

    if (categoryName) {
      const cat = categoryName.toLowerCase();
      if (cat.includes("kindergarten") || cat.includes("< 6") || cat.includes("under 6")) {
        explanationGuideline = "an extremely simple, child-friendly English definition using basic words suitable for children under 6 years old (e.g., 'a sweet red fruit' for apple)";
        examplesGuideline = "exactly 2-3 extremely short and simple English example sentences (Pre-A1 level, 3-6 words each, using only basic vocabulary, e.g., 'The apple is red.')";
      } else if (cat.includes("kid")) {
        explanationGuideline = "a simple, clear English definition (A1-A2 level) using easy-to-understand language";
        examplesGuideline = "exactly 2-3 simple English example sentences (A1 level, e.g., 'This is a clean towel.', 'The giraffe has a long neck.')";
      } else if (cat.includes("teen")) {
        explanationGuideline = "a clear English definition at CEFR A2-B1 level";
        examplesGuideline = "exactly 2-3 natural English example sentences (A2-B1 level, e.g., 'I gave some sour tamarind to my mother after school.')";
      }
    }

    const prompt = `Provide detailed vocabulary information for the English word or phrase: "${word}". 
    The meaningVi should be a SHORT, direct translation in Vietnamese (1-3 words max, e.g. "Quả chuối", NOT a definition). 
    The meaningTh should be a SHORT, direct translation in Thai (1-3 words max). 
    The meaningId should be a SHORT, direct translation in Indonesian (1-3 words max). 
    The explanationEn should be: ${explanationGuideline}. 
    The examples should be: ${examplesGuideline}. 
    Provide 2-3 very descriptive English keywords for an image search that perfectly represents the word's meaning (e.g. for "dilemma", use "confused person at crossroads").
    
    Return the result in JSON format matching this structure:
    {
      "word": "string",
      "pronunciation": "string",
      "meaningVi": "string",
      "meaningTh": "string",
      "meaningId": "string",
      "explanationEn": "string",
      "examples": ["string"],
      "imageSearchKeywords": "string"
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful educational content creator." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0].message.content;
    if (!text) {
      throw new Error("Empty response from OpenAI");
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return { error: "Không thể lấy thông tin từ AI. Vui lòng thử lại sau." };
  }
}

export async function searchVocabularyImages(query: string) {
  try {
    // Search Wikimedia Commons namespace 6 (Files) for drawings, illustrations, and images
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=9&format=json&origin=*`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) throw new Error("Failed to search Wikimedia");
    const data = await res.json();
    const searchResults = data.query?.search || [];
    
    if (searchResults.length === 0) return [];
    
    const titles = searchResults.map((r: any) => r.title).join('|');
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|thumbmime&iiurlwidth=400&format=json&origin=*`;
    const infoRes = await fetch(infoUrl);
    if (!infoRes.ok) throw new Error("Failed to fetch Wikimedia image details");
    const infoData = await infoRes.json();
    const pages = infoData.query?.pages || {};
    
    return Object.values(pages).map((page: any) => {
      const info = page.imageinfo?.[0];
      return {
        id: String(page.pageid),
        thumb: info?.thumburl || info?.url,
        full: info?.url,
        alt: page.title.replace('File:', '')
      };
    }).filter(img => img.full);
  } catch (error) {
    console.error("Wikimedia Image Search Error:", error);
    return [];
  }
}

export async function fetchImageAsBase64(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch image");
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("fetchImageAsBase64 Error:", error);
    return null;
  }
}

export async function generateDalleImage(prompt: string, size: string = "1024x1024") {
  if (process.env.DEEPINFRA_API_KEY) {
    try {
      console.log(`Generating image using DeepInfra FLUX.1 Schnell: "${prompt.substring(0, 60)}..."`);
      const res = await fetch(`https://api.deepinfra.com/v1/openai/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPINFRA_API_KEY}`
        },
        body: JSON.stringify({
          model: "black-forest-labs/FLUX-1-schnell",
          prompt: prompt,
          n: 1,
          size: size === "1792x1024" ? "1024x1024" : size,
          response_format: "b64_json"
        })
      });
      
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = responseData.error?.message || `HTTP error! status: ${res.status}`;
        throw new Error(errMsg);
      }
      
      const b64 = responseData.data?.[0]?.b64_json;
      if (!b64) throw new Error("Empty b64_json image data from DeepInfra");
      
      return { base64: `data:image/png;base64,${b64}` };
    } catch (error: any) {
      console.error(`Error with DeepInfra FLUX:`, error);
      // Fallback to OpenAI if it's configured
      if (!process.env.OPENAI_API_KEY) {
        return { error: `Không thể vẽ ảnh bằng FLUX: ${error.message}` };
      }
      console.log("DeepInfra failed, falling back to OpenAI DALL-E...");
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return { error: "Missing OPENAI_API_KEY or DEEPINFRA_API_KEY. Please set it in .env file." };
  }
  
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = openai.baseURL || "https://api.openai.com/v1";
  
  // Try models in order of availability / preference
  const models = ["gpt-image-2", "dall-e-3", "dall-e-2"];
  let lastError = "";
  
  for (const model of models) {
    try {
      console.log(`Attempting image generation with model: ${model}`);
      const requestedSize = model === "dall-e-2" 
        ? "512x512" 
        : model === "gpt-image-2" 
          ? "1024x1024" 
          : size;

      const res = await fetch(`${baseURL}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          n: 1,
          size: requestedSize
        })
      });
      
      const responseData = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errMsg = responseData.error?.message || `HTTP error! status: ${res.status}`;
        console.warn(`Model ${model} failed: ${errMsg}`);
        lastError = errMsg;
        
        // If the error indicates the model doesn't exist, try the next one
        if (errMsg.includes("does not exist") || errMsg.includes("invalid_value") || res.status === 404) {
          continue;
        }
        throw new Error(errMsg);
      }
      
      const imgData = responseData.data?.[0];
      if (!imgData) throw new Error("Empty image data response from OpenAI");
      
      let base64 = "";
      if (imgData.b64_json) {
        base64 = `data:image/png;base64,${imgData.b64_json}`;
      } else if (imgData.url) {
        const downloaded = await fetchImageAsBase64(imgData.url);
        if (!downloaded) throw new Error("Failed to convert generated image to base64");
        base64 = downloaded;
      } else {
        throw new Error("No image URL or base64 data returned from OpenAI");
      }
      
      return { base64 };
    } catch (error: any) {
      console.error(`Error with model ${model}:`, error);
      lastError = error.message;
    }
  }
  
  return { error: `Không thể vẽ ảnh bằng AI: ${lastError}` };
}

export async function generateExampleSentence(word: string, categoryNameOrIsKid: string | boolean, currentSentence?: string) {
  try {
    let levelInstruction = "Use A1 or A2 level English vocabulary. Keep the sentence simple, clear, and easy to understand for beginners.";
    
    if (typeof categoryNameOrIsKid === "boolean") {
      if (categoryNameOrIsKid) {
        levelInstruction = "Use ONLY A1 level English vocabulary. Keep the sentence extremely simple, short, and easy for young children (2-5 years old) to understand. Do not use complex grammar.";
      }
    } else if (categoryNameOrIsKid) {
      const cat = categoryNameOrIsKid.toLowerCase();
      if (cat.includes("kindergarten") || cat.includes("< 6") || cat.includes("under 6")) {
        levelInstruction = "Use ONLY Pre-A1 level English vocabulary. Keep the sentence extremely simple, very short (3-6 words), and easy for very young children (under 6 years old) to understand. Do not use complex grammar (e.g., 'The apple is red.', 'I see a dog.').";
      } else if (cat.includes("kid")) {
        levelInstruction = "Use ONLY A1 level English vocabulary. Keep the sentence simple, short, and easy for young children (6-10 years old) to understand (e.g., 'This is a clean towel.', 'The giraffe has a long neck.').";
      } else if (cat.includes("teen")) {
        levelInstruction = "Use A2 or B1 level English vocabulary. Keep the sentence natural and clear for teenagers (11-16 years old), allowing slightly more advanced words or compound structures (e.g., 'I gave some sour tamarind to my mother after school.').";
      } else {
        // Learner / Adult
        levelInstruction = "Use B1 or B2 level English vocabulary. Keep the sentence natural, realistic, and high-quality for adult learners, allowing compound or complex structures (e.g., 'He faced a difficult dilemma when choosing between two career paths.').";
      }
    }

    const avoidInstruction = currentSentence 
      ? `\nIMPORTANT: The user already has this sentence: "${currentSentence}". You MUST generate a completely DIFFERENT sentence with a different meaning or context.` 
      : "";

    const prompt = `Generate a single English example sentence for the word "${word}".
${levelInstruction}${avoidInstruction}
Return ONLY the sentence itself without quotes, without any explanation, and no markdown formatting.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 50,
    });

    const sentence = response.choices[0]?.message?.content?.trim() || "";
    if (!sentence) {
      return { error: "AI trả về kết quả rỗng." };
    }

    return { sentence };
  } catch (error: any) {
    console.error("Error generating example sentence:", error);
    return { error: error.message || "Lỗi khi gọi AI." };
  }
}
