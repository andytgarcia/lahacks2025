// filepath: /Users/andytgarcia/CodeProjects/PiCar/lahacks2025/web-app/src/app/api/users/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { Octokit } from "@octokit/rest";
import { console } from "inspector";

// Define types for our PR file structure
export interface PRFile {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed" | "copied" | "changed" | "unchanged";
  previousContent: string | null;
  newContent: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const key = process.env.GEMINI_KEY;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!key || !githubToken) {
      console.error("GEMINI_KEY or GITHUB_TOKEN is not configured");
      return Response.json({ error: "API key or Github token not configured" }, { status: 500 });
    }

    const { message, repo, prNumber, owner } = await request.json();
    if (!message || !repo || !prNumber || !owner) {
      return Response.json({ error: "Message, repo, and prNumber are required" }, { status: 400 });
    }

    const prCode = await getPRCodeAsString(owner, repo, prNumber, githubToken);

    const formattedPRCode = formatPRCodeForGemini(prCode.files);

    console.log("Formatted PR Code:", formattedPRCode);
    
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

export async function getPRCodeAsString(owner: string, repo: string, prNumber: string, token: string) {
  const octokit = new Octokit({ auth: token });

  // Get PR details to find base and head references
  const { data: pullRequest } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: parseInt(prNumber),
  });

  const baseRef = pullRequest.base.sha;
  const headRef = pullRequest.head.sha;

  // Get PR files (changed files)
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: parseInt(prNumber),
  });

  console.log("Files:", files);

  const fileContents: PRFile[] = await Promise.all(
    files.map(async (file) => {
      // Default structure
      const result: PRFile = {
        filename: file.filename,
        status: file.status,
        previousContent: null,
        newContent: null
      };

      try {
        // If file was added, only get new content
        if (file.status === 'added') {
          const { data: content } = await octokit.repos.getContent({
            owner,
            repo,
            path: file.filename,
            ref: headRef
          });

          if ('content' in content) {
            result.newContent = Buffer.from(content.content, 'base64').toString('utf-8');
          }
        }
        // If file was removed, only get previous content
        else if (file.status === 'removed') {
          const { data: content } = await octokit.repos.getContent({
            owner,
            repo,
            path: file.filename,
            ref: baseRef
          });

          if ('content' in content) {
            result.previousContent = Buffer.from(content.content, 'base64').toString('utf-8');
          }
        }
        // If file was modified, get both previous and new content
        else if (file.status === 'modified') {
          // Get previous content
          try {
            const { data: prevContent } = await octokit.repos.getContent({
              owner,
              repo,
              path: file.filename,
              ref: baseRef
            });

            if ('content' in prevContent) {
              result.previousContent = Buffer.from(prevContent.content, 'base64').toString('utf-8');
            }
          } catch (error) {
            console.error(`Error fetching previous content for ${file.filename}:`, error);
          }

          // Get new content
          try {
            const { data: newContent } = await octokit.repos.getContent({
              owner,
              repo,
              path: file.filename,
              ref: headRef
            });

            if ('content' in newContent) {
              result.newContent = Buffer.from(newContent.content, 'base64').toString('utf-8');
            }
          } catch (error) {
            console.error(`Error fetching new content for ${file.filename}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file.filename}:`, error);
      }

      return result;
    })
  );
  
  return {
    files: fileContents,
    summary: {
      totalFiles: files.length,
      additions: files.reduce((sum, file) => sum + file.additions, 0),
      deletions: files.reduce((sum, file) => sum + file.deletions, 0),
    },
  };
}

export function formatPRCodeForGemini(prCode: PRFile[]) {
  return prCode.map((file) => {
    return `File: ${file.filename}\nStatus: ${file.status}\nPrevious Content: ${file.previousContent}\nNew Content: ${file.newContent}`;
  }).join("\n");
}