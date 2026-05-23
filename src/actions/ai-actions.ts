"use server";

import openai from "@/lib/openai";

export async function generateVocabularyDetails(word: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { error: "Missing OPENAI_API_KEY. Please set it in .env file." };
  }

  try {
    const prompt = `Provide detailed vocabulary information for the English word or phrase: "${word}". 
    The definitions should be professional, accurate, and easy to understand for Grade 10-12 students. 
    The meaningVi should be the most common and accurate translation in Vietnamese. 
    The meaningTh should be the most common and accurate translation in Thai. 
    The meaningId should be the most common and accurate translation in Indonesian. 
    The explanationEn should be a clear, simple English definition (CEFR B1-B2 level). 
    Provide exactly 2-3 illustrative, high-quality example sentences. 
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

export async function generateDalleImage(prompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { error: "Missing OPENAI_API_KEY. Please set it in .env file." };
  }
  
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = openai.baseURL || "https://api.openai.com/v1";
  
  // Try models in order of availability / preference
  const models = ["gpt-image-2", "dall-e-3", "dall-e-2"];
  let lastError = "";
  
  for (const model of models) {
    try {
      console.log(`Attempting image generation with model: ${model}`);
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
          size: model === "dall-e-2" ? "512x512" : "1024x1024"
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

