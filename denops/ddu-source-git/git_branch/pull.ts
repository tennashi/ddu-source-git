import { dispatchCommand } from "../runner/main.ts";

export async function pullRemoteBranches(
  repoDir: string,
  remoteName: string,
  branchNames: string[],
): Promise<void> {
  return await dispatchCommand(
    "git",
    ["pull", remoteName, branchNames].flat(),
    repoDir,
  );
}
