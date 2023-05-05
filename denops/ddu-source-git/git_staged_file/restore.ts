import { dispatchCommand } from "../runner/main.ts";

export function restoreStagedChanges(
  repoDir: string,
  filePathes: string[],
): Promise<void> {
  return dispatchCommand(
    "git",
    ["restore", "--staged", filePathes].flat(),
    repoDir,
  );
}
