import { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import { Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { getcwd } from "https://deno.land/x/denops_std@v4.0.0/function/mod.ts";
import { group } from "https://deno.land/x/denops_std@v4.0.0/autocmd/mod.ts";

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

class GitRepository {
  #repoDir: string;
  #gitRemoteCache: GitRemoteCache;

  constructor(repoDir: string) {
    this.#repoDir = repoDir;
    this.#gitRemoteCache = new GitRemoteCache(repoDir);
  }

  collectGitStatusItems(): Promise<Item<GitStatusActionData>[]> {
    return collectGitStatusItems(this.#repoDir);
  }

  collectGitRefItems(): Promise<Item<GitRefActionData>[]> {
    return collectGitRefItems(this.#repoDir, this.#gitRemoteCache);
  }

  collectGitLogItems(): Promise<Item<GitLogActionData>[]> {
    return collectGitLogItems(this.#repoDir);
  }
}

export async function main(denops: Denops): Promise<void> {
  const gitRepositoryStore: Record<string, GitRepository> = {};

  const getCwdResult = await getcwd(denops);
  const cwd = getCwdResult as string;
  gitRepositoryStore[cwd] = new GitRepository(cwd);

  let currentRepository = gitRepositoryStore[cwd];

  await group(denops, "DduSourceGit", (helper) => {
    helper.define(
      "DirChanged",
      "*",
      "call denops#notify('ddu-source-git', 'setCurrentRepository', [expand('<afile>')])",
    );
  });

  denops.dispatcher = {
    setCurrentRepository(cwd: unknown): Promise<void> {
      currentRepository = gitRepositoryStore[cwd as string];
      if (!currentRepository) {
        currentRepository = new GitRepository(cwd as string);
        gitRepositoryStore[cwd as string] = currentRepository;
      }
      return Promise.resolve();
    },
    gitStatus(): Promise<Item<GitStatusActionData>[]> {
      return currentRepository.collectGitStatusItems();
    },
    gitRef(): Promise<Item<GitRefActionData>[]> {
      return currentRepository.collectGitRefItems();
    },
    gitLog(): Promise<Item<GitLogActionData>[]> {
      return currentRepository.collectGitLogItems();
    },
  };

  return;
}
