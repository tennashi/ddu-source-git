import { Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";

import { runListCommand } from "../runner/main.ts";
import { Cache as GitRemoteCache } from "../cache/git_remote/main.ts";
import { ActionData as GitBranchActionData } from "../../@ddu-kinds/git_branch.ts";
import { ActionData as GitTagActionData } from "../../@ddu-kinds/git_tag.ts";

export type ActionData = GitBranchActionData | GitTagActionData;

export async function collectItems(
  repoDir: string,
  cache: GitRemoteCache,
): Promise<Item<ActionData>[]> {
  const result = await runListCommand("git", ["show-ref"], repoDir);

  return result.map((line) => {
    const gitRef = line.slice(line.indexOf(" ") + 1);
    const item = parseGitRef(gitRef);
    if (
      item.kind === "git_branch" &&
      item.action && "isRemote" in item.action && !item.action.isRemote
    ) {
      const remoteState = cache.getState(item.action.branch);
      item.action.remoteState = remoteState;
    }
    return item;
  });
}

function parseGitRef(gitRef: string): Item<ActionData> {
  if (gitRef.startsWith("refs/heads/")) {
    const branch = gitRef.slice("refs/heads/".length);

    return {
      word: gitRef,
      display: branch,
      kind: "git_branch",
      action: { branch: branch, isRemote: false },
    };
  }

  if (gitRef.startsWith("refs/remotes/")) {
    const branch = gitRef.slice("refs/remotes/".length);

    return {
      word: gitRef,
      display: branch,
      kind: "git_branch",
      action: { branch: branch, isRemote: true },
    };
  }

  if (gitRef.startsWith("refs/tags/")) {
    const tag = gitRef.slice("refs/tags/".length);

    return {
      word: gitRef,
      display: tag,
      kind: "git_tag",
      action: { tag: tag },
    };
  }

  return {
    word: gitRef,
  };
}
