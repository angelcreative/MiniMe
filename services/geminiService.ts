import { GoogleGenAI } from "@google/genai";
import { ChildGender } from "../types";

const getApiKey = (): string | undefined => {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
  return key && key.trim() ? key.trim() : undefined;
};

/** Placeholder PNG when GEMINI_API_KEY is missing (local / demo). */
const mockChildImage = (gender: ChildGender): string => {
  const label = gender === "boy" ? "MiniMe Boy" : "MiniMe Girl";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#99f6e4"/>
        <stop offset="100%" stop-color="#a5b4fc"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#g)"/>
    <circle cx="256" cy="200" r="88" fill="#fde68a" stroke="#f59e0b" stroke-width="4"/>
    <circle cx="224" cy="188" r="8" fill="#334155"/>
    <circle cx="288" cy="188" r="8" fill="#334155"/>
    <path d="M220 230 Q256 258 292 230" fill="none" stroke="#334155" stroke-width="6" stroke-linecap="round"/>
    <text x="256" y="360" text-anchor="middle" font-family="Quicksand,sans-serif" font-size="28" font-weight="700" fill="#334155">${label}</text>
    <text x="256" y="400" text-anchor="middle" font-family="Quicksand,sans-serif" font-size="16" fill="#64748b">Demo mode — set GEMINI_API_KEY</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const getClient = () => {
  const apiKey = getApiKey();
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
  if (!getApiKey()) {
    // Allow local UI testing without a Gemini key
    await new Promise((r) => setTimeout(r, 600));
    return mockChildImage(gender);
  }

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
            text: `
GENETIC INHERITANCE MODE ACTIVE  
Do NOT blend the two faces directly.  
Analyze each parent face independently and generate a child that follows REAL GENETIC HEREDITY RULES.

---------------------------------------
GENETIC INHERITANCE RULES TO APPLY
---------------------------------------

1. EYE COLOR
- Dark dominant over green, green dominant over blue.
- If parents have different colors, compute realistic probabilities.
- If both dark: child usually dark.
- If one light: intermediate (hazel/green) possible.
- Preserve parental eye shape tendencies (spacing, eyelid).

2. SKIN TONE
- Child skin tone must be the midpoint between both parents (+/- 10% natural variation).
- DO NOT average pixel color; generate realistic inherited tone.

3. FACE SHAPE
- Follow shared or intermediate morphology.
- Prioritize biologically plausible shapes (oval, round, square, long).
- If parents differ strongly, produce soft-blended hereditary shape.

4. NOSE STRUCTURE
- Nose inheritance prioritizes dominant shared morphology.
- If one has narrow and the other wide, produce a realistic midpoint.
- Keep natural symmetry for a child.

5. LIPS
- Thickness = averaged inheritance with ±15% natural variance.
- Preserve proportionality and human realism.

6. HAIR
- Dark > intermediate > blonde unless both recessive.
- Curl pattern = additive (halfway between parents unless both straight/curly).
- Density = midpoint.

7. CHEEKBONES & JAWLINE
- Additive inheritance: slightly favor the parent with stronger bone definition.
- Child jawline softer than adults but genetically consistent.

8. EYEBROWS
- Shape follows dominant parent tendency.
- If both similar: keep that style.

9. AGE SETTINGS
- Generate a child approx 5-6 years old.
- Keep expression neutral and natural, slightly cheerful.

---------------------------------------
OUTPUT INSTRUCTIONS
---------------------------------------

Generate the MOST GENETICALLY PROBABLE biological child of the two people shown in the images.

DO NOT:
- copy the parents' faces directly
- overlay or blend features poorly
- distort or age-up/down incorrectly

DO:
- Apply genetic probabilities above
- Produce a realistic, natural face of a child
- Ensure resemblance to *both* parents
- Maintain human proportions and coherence

---------------------------------------
CHILD OUTPUT SETTINGS
---------------------------------------
- Child age: 5 years old
- Gender: ${gender}
- Ethnicity: Determined by genetic combination of both parents
- Style: Ultra-realistic, photographic, high detail, studio soft lighting

---------------------------------------
NOW USE THE IMAGES ABOVE (Image 1 = Father, Image 2 = Mother)
`
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
