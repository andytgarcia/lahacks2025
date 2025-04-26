import { Octokit } from "@octokit/rest";

const PROJECT_BASE_URL = "localhost:3000";

export const getChatWebUrl = (owner: string, repo: string, pr: number) => {
  return `${PROJECT_BASE_URL}/chat?owner=${owner}&repo=${repo}&pr=${pr}`;
};

export interface PRFile {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed" | "copied" | "changed" | "unchanged";
  previousContent: string | null;
  newContent: string | null;
}


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