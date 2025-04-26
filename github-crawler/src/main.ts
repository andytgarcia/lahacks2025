import { context, getOctokit }    from '@actions/github';

async function main() {
  const octokit = getOctokit(process.env.GITHUB_TOKEN!);
  const { owner, repo } = context.repo;
  const pr = context.payload.pull_request!;

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pr.number,
    body: `🤖 Gemini review says:\n> Testing permissions`,
  });
//   // 1. Build a prompt from the PR title/body
//   const pr = context.payload.pull_request!;
//   const prompt = `
// You are an automated code reviewer.
// PR #${pr.number}:
// Title: ${pr.title}
// Description: ${pr.body || '<no description>'}

// Please evaluate whether this PR:
// – has sufficient tests
// – follows naming conventions
// – is ready to merge

// Respond in one sentence.
// `;

//   // 2. Call Gemini (Vertex AI)
//   // const model = new TextGenerationModel({
//   //   projectId: process.env.GCP_PROJECT_ID!,
//   //   location: 'us-central1',
//   // });

//   // const [response] = await model.generate({
//   //   instances: [{ content: prompt }],
//   //   parameters: { temperature: 0.2, maxOutputTokens: 256 },
//   // });

//   // const text = response.generations?.[0]?.content?.trim() || '';
//   // console.log('Gemini replied:', text);

//   // 3. Check your condition
//   // e.g. if Gemini says "Looks good", we comment :-)
//   if (/looks good/i.test(text)) {
//     const octokit = getOctokit(process.env.GITHUB_TOKEN!);
//     const { owner, repo } = context.repo;

//     await octokit.rest.issues.createComment({
//       owner,
//       repo,
//       issue_number: pr.number,
//       body: `🤖 Gemini review says:\n> ${text}`,
//     });

//     console.log('✅ Comment posted');
//   } else {
//     console.log('ℹ️ Condition not met; no comment posted');
//   }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});