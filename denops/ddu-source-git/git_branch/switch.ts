import { dispatchCommand } from "../runner/main.ts";

export async function switchLocalBranch(
  repoDir: string,
  branchName: string,
): Promise<void> {
  return await dispatchCommand("git", ["switch", branchName], repoDir);
}

export async function switchRemoteBranch(
  repoDir: string,
  refName: string,
) {
  return await dispatchCommand(
    "git",
    ["switch", "--detach", refName],
    repoDir,
  );
}
