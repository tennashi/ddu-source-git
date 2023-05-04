import { dispatchCommand } from "../runner/main.ts";

export async function pushBranches(
  repoDir: string,
  remoteName: string,
  branchNames: string[],
): Promise<void> {
  return await dispatchCommand(
    "git",
    ["push", remoteName, branchNames].flat(),
    repoDir,
  );
}
