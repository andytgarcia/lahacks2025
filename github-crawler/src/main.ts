import { context, getOctokit } from "@actions/github";
import { GoogleGenAI } from "@google/genai";
import { formatPRCodeForGemini, getChatWebUrl, getPRCodeAsString } from "./shared.types";

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
  });
  const config = {
    responseMimeType: "text/plain",
  };
  const model = "gemini-2.0-flash";

  const prCode = await getPRCodeAsString(context.repo.owner, context.repo.repo, context.payload.pull_request!.number.toString(), process.env.GITHUB_TOKEN!);

  const formattedPRCode = formatPRCodeForGemini(prCode.files);

  console.log("Formatted PR Code:", formattedPRCode);

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `Please review the code I'm going to give you and tell me if it could be better. I want you to really teach me and help me learn. Please make it much more concise. Maybe like a couple of sentences.

Code:
print("Hello, world!")`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });

  let entireResponse = "";

  for await (const chunk of response) {
    entireResponse += chunk.text;
  }

  const octokit = getOctokit(process.env.GITHUB_TOKEN!);
  const { owner, repo } = context.repo;
  const pr = context.payload.pull_request!;

  const chatUrl = getChatWebUrl(owner, repo, pr.number);

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pr.number,
    body: `🤖 ${formattedPRCode}`,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
