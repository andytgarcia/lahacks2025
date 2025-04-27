import { context, getOctokit } from "@actions/github";
import { GoogleGenAI, Type } from "@google/genai";
import { formatPRCodeForGemini, getChatWebUrl, getPRCodeAsString } from "./shared.types";
import { default_system_instruction } from "./prompts-copy";

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
  });
  const model = "gemini-2.0-flash";

  const prCode = await getPRCodeAsString(context.repo.owner, context.repo.repo, context.payload.pull_request!.number.toString(), process.env.GITHUB_TOKEN!);

  const formattedPRCode = formatPRCodeForGemini(prCode.files);

  const chatConfig = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ["hasErrors"],
      properties: {
        hasErrors: {
          type: Type.BOOLEAN,
        },
      },
    },
  };

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `$default_system_instruction}
          \n\n
          If there is an error found for any of the error types, just tell me if there is an error. I don't care which which it is. Just return the structured data field hasErrors as true if there is an error.`
        },
      ],
    },
    {
      role: "user",
      parts: [
        {
          text: formattedPRCode
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config: chatConfig,
    contents,
  });

  let entireResponse = "";

  for await (const chunk of response) {
    console.log(chunk);
    entireResponse += chunk.text;
  }

  const hasErrors = JSON.parse(entireResponse).hasErrors;

  const octokit = getOctokit(process.env.GITHUB_TOKEN!);
  const { owner, repo } = context.repo;
  const pr = context.payload.pull_request!;

  const chatUrl = getChatWebUrl(owner, repo, pr.number);

  let body = ''

  if (hasErrors) {
    body = `## PR Review Results 🔍
    
We found some issues that could be improved with this PR.

[View Detailed PR Analysis](${chatUrl})`
  } else {
    body = `## PR Review Results ✅
    
No issues found! Your code looks great.`
  }

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pr.number,
    body: body,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


  const { text, codeSuggestions } = response.data;
  const hasErrors = response.data.hasErrors;

  // Log the response
  console.log("Response:", text);
  console.log("Code Suggestions:", codeSuggestions);
  console.log("Has Errors:", hasErrors);

  // Send the response back to the client
  return Response.json({ text, codeSuggestions, hasErrors });
}
//   } catch (error) {
//     console.error("Error:", error);
//     return Response.json({ error: "An error occurred while processing your request" }, { status: 500 });
//   }
// }
//
// function extractCodeBlocks(text: string): string[] {