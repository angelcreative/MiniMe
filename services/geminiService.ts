
import { GoogleGenAI } from "@google/genai";
import { ChildGender } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure process.env.API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateChildFace = async (
  dadBase64: string,
  dadMimeType: string,
  momBase64: string,
  momMimeType: string,
  gender: ChildGender
): Promise<string> => {
  const ai = getClient();
  
  // Clean base64 strings if they contain headers
  const cleanDadBase64 = dadBase64.split(',')[1] || dadBase64;
  const cleanMomBase64 = momBase64.split(',')[1] || momBase64;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: dadMimeType,
              data: cleanDadBase64,
            },
          },
          {
            inlineData: {
              mimeType: momMimeType,
              data: cleanMomBase64,
            },
          },
          {
            text: `Analyze these two images of a father and a mother. Generate a high-quality, photorealistic portrait of a 5-year-old ${gender} that shares physical traits from both parents. The image should be a professional studio portrait with soft lighting, similar to the style of the input images. Focus on facial features, skin tone, and hair texture.`
          },
        ],
      },
    });

    // Parse response for image
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data found in the response.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
