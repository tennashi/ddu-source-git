import { dispatchCommand } from "../runner/main.ts";

export function gitDeleteBranches(
  repoDir: string,
  branchNames: string[],
): Promise<void> {
  return dispatchCommand(
    "git",
    ["branch", "--delete", branchNames].flat(),
    repoDir,
  );
}
