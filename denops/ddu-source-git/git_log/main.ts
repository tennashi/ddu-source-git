import { Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";

import { runListCommand } from "../runner/main.ts";
import { ActionData as GitCommitActionData } from "../../@ddu-kinds/git_commit.ts";

export type ActionData = GitCommitActionData;

export async function collectItems(
  repoDir: string,
): Promise<Item<ActionData>[]> {
  const result = await runListCommand("git", ["log", "--oneline"], repoDir);

  return result.map((line) => {
    const commitHash = line.slice(0, line.indexOf(" "));
    const subject = line.slice(line.indexOf(" ") + 1);

    return {
      word: commitHash,
      display: line,
      action: { commitHash: commitHash, subject: subject },
    };
  });
}
