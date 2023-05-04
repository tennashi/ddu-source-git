import { dispatchCommand } from "../runner/main.ts";

export function createTag(
  repoDir: string,
  tagName: string,
  branchName: string,
): Promise<void> {
  return dispatchCommand("git", ["tag", tagName, branchName], repoDir);
}
