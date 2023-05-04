import { dispatchCommand, runGetCommand } from "../runner/main.ts";

export function getCommitMessageBody(
  repoDir: string,
  commitHash: string,
): Promise<string> {
  return runGetCommand(
    "git",
    ["show", "--no-patch", "--format=%b", commitHash],
    repoDir,
  );
}

export async function setCommitMessage(
  repoDir: string,
  commitHash: string,
  paragraphs: string[],
): Promise<void> {
  await dispatchCommand(
    "git",
    ["commit", "--allow-empty"].concat(
      [`amend! ${commitHash}`].concat(paragraphs).flatMap((
        paragraph,
      ) => ["-m", paragraph]),
    ),
    repoDir,
  );

  await dispatchCommand(
    "git",
    [
      "rebase",
      "-i",
      "--autosquash",
      "--autostash",
      `${commitHash}~1`,
    ],
    repoDir,
    { GIT_SEQUENCE_EDITOR: "true" },
  );
}
