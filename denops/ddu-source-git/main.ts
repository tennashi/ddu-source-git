import { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import { Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { getcwd } from "https://deno.land/x/denops_std@v4.0.0/function/mod.ts";

import {
  ActionData as GitStatusActionData,
  collectItems as collectGitStatusItems,
} from "./git_status/main.ts";
import {
  ActionData as GitRefActionData,
  collectItems as collectGitRefItems,
} from "./git_ref/main.ts";
import {
  ActionData as GitLogActionData,
  collectItems as collectGitLogItems,
} from "./git_log/main.ts";

import { Cache as GitRemoteCache } from "./cache/git_remote/main.ts";

export function main(denops: Denops): Promise<void> {
  const gitRemoteCache = new GitRemoteCache();

  denops.dispatcher = {
    async gitStatus(): Promise<Item<GitStatusActionData>[]> {
      const getCwdResult = await getcwd(denops);
      const cwd = getCwdResult as string;
      return collectGitStatusItems(cwd);
    },
    async gitRef(): Promise<Item<GitRefActionData>[]> {
      const getCwdResult = await getcwd(denops);
      const cwd = getCwdResult as string;
      return collectGitRefItems(cwd, gitRemoteCache);
    },
    async gitLog(): Promise<Item<GitLogActionData>[]> {
      const getCwdResult = await getcwd(denops);
      const cwd = getCwdResult as string;
      return collectGitLogItems(cwd);
    },
  };

  return Promise.resolve();
}
