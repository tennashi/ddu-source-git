import { setCommitMessage } from "./message.ts";
import { dispatchCommand } from "../runner/main.ts";

export async function fixupCommitsTo(
  repoDir: string,
  targetCommitHash: string,
  commits: string[],
): Promise<void> {
  commits.forEach(async (commit) => {
    await setCommitMessage(repoDir, commit, [`fixup! ${targetCommitHash}`]);
  });

  await dispatchCommand(
    "git",
    [
      "rebase",
      "-i",
      "--autosquash",
      "--autostash",
      `${targetCommitHash}~1`,
    ],
    repoDir,
    { GIT_SEQUENCE_EDITOR: "true" },
  );
}
