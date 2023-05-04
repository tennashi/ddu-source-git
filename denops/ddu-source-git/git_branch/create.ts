import { dispatchCommand } from "../runner/main.ts";

export function createBranch(
  repoDir: string,
  branchName: string,
): Promise<void> {
  return dispatchCommand("git", ["branch", branchName], repoDir);
}
