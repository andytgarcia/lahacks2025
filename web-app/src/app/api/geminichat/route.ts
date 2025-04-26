// filepath: /Users/andytgarcia/CodeProjects/PiCar/lahacks2025/web-app/src/app/api/users/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const key = process.env.GEMINI_KEY;
    if (!key) {
      console.error("GEMINI_KEY is not configured");
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    const { message } = await request.json();
    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }
    
    const ai = new GoogleGenAI({apiKey: key});
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: message,
    });

    // Log the response structure for debugging
    console.log("Gemini Response:", JSON.stringify(response, null, 2));
    
    // Extract the text from the response
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error("No text in response:", response);
      return Response.json({ error: "No response from Gemini" }, { status: 500 });
    }
    
    return Response.json({ result: { text } });
  } catch (error) {
    console.error("Detailed Error:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Remove the automatic main() call as it causes issues with Next.js API routes