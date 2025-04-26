"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
  const searchParams = useSearchParams();
 
  const repo = searchParams.get('repo');
  const pr = searchParams.get('pr');

  useEffect(() => {
    console.log("Search params object:", searchParams);
    console.log("Repo param:", repo);
    console.log("PR param:", pr);
  }, [searchParams, repo, pr]);

  return (
    <div>
      <h1>Chat</h1>
      <p>Repo: {repo || 'Not found'}</p>
      <p>PR: {pr || 'Not found'}</p>
    </div>
  )
}