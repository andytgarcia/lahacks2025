import { GoogleGenAI } from "@google/genai";

const key = process.env.GEMINI_KEY;

const ai = new GoogleGenAI({ apiKey: key });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

main();