import { dispatchCommand } from "../runner/main.ts";

export async function gitSwitch(
  repoDir: string,
  branchName: string,
): Promise<void> {
  return await dispatchCommand("git", ["switch", branchName], repoDir);
}

export async function gitSwitchDetach(repoDir: string, refName: string) {
  return await dispatchCommand(
    "git",
    ["switch", "--dispatch", refName],
    repoDir,
  );
}
