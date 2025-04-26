const PROJECT_BASE_URL = "localhost:3000";

export const getChatWebUrl = (repo: string, pr: number) => {
  return `${PROJECT_BASE_URL}/chat?repo=${repo}&pr=${pr}`;
};
