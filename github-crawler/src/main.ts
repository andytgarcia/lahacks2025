import { context, getOctokit }    from '@actions/github';
import {
  GoogleGenAI,
} from '@google/genai';


async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
  });
  const config = {
    responseMimeType: 'text/plain',
  };
  const model = 'gemini-2.5-flash-preview-04-17';

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Please review the code I'm going to give you and tell me if it could be better. I want you to really teach me and help me learn.

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

  let entireResponse = '';

  for await (const chunk of response) {
    entireResponse += chunk.text;
  }

  const octokit = getOctokit(process.env.GITHUB_TOKEN!);
  const { owner, repo } = context.repo;
  const pr = context.payload.pull_request!;

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pr.number,
    body: `🤖 ${entireResponse}`,
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});