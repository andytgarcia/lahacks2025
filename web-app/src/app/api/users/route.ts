// filepath: /Users/andytgarcia/CodeProjects/PiCar/lahacks2025/web-app/src/app/api/users/route.ts
import { GoogleGenAI } from "@google/genai";

export async function GET() {
  try {
    const key = process.env.GEMINI_KEY;
    if (!key) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({apiKey: key});
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Help me decide between UC San Diego and UC Riverside. I want to study computer science and I like the beach.",
    });
    
    console.log(response); // This will show up in your terminal
    return Response.json({ result: response });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Remove the automatic main() call as it causes issues with Next.js API routes