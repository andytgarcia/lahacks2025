import { context, getOctokit } from "@actions/github";
import { GoogleGenAI } from "@google/genai";
import { getChatWebUrl } from "./shared.types";

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
  });
  const config = {
    responseMimeType: "text/plain",
  };
  const model = "gemini-2.5-flash-preview-04-17";

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

  const chatUrl = getChatWebUrl(repo, pr.number);

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pr.number,
    body: `🤖 ${entireResponse}\n\n[See how you can improve this PR!](${chatUrl})`,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
