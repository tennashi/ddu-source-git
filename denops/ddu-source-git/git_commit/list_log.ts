import { runListCommand } from "../runner/main.ts";

export function listCommitLog(repoDir: string): Promise<string[]> {
  return runListCommand("git", ["log", "--oneline"], repoDir);
}
