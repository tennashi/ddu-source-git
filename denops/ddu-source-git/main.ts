import { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import { Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { getcwd } from "https://deno.land/x/denops_std@v4.0.0/function/mod.ts";
import { group } from "https://deno.land/x/denops_std@v4.0.0/autocmd/mod.ts";
import {
  assertArray,
  assertBoolean,
  assertString,
  isString,
} from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";

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
import { gitSwitch, gitSwitchDetach } from "./git_branch/switch.ts";
import { gitPush } from "./git_branch/push.ts";
import { gitPull } from "./git_branch/pull.ts";
import { gitCreateBranch } from "./git_branch/create.ts";
import { gitDeleteBranches } from "./git_branch/delete.ts";
import { gitCreateTag } from "./git_tag/create.ts";
import {
  getCommitMessageBody,
  setCommitMessage,
} from "./git_commit/message.ts";
import { fixupCommitsTo } from "./git_commit/fixup_to.ts";
import { listCommitLog } from "./git_commit/list_log.ts";

import { Cache as GitRemoteCache } from "./cache/git_remote/main.ts";

class GitRepository {
  #repoDir: string;
  #gitRemoteCache: GitRemoteCache;

  constructor(denops: Denops, repoDir: string) {
    this.#repoDir = repoDir;
    this.#gitRemoteCache = new GitRemoteCache(
      repoDir,
      () => {
        denops.dispatch("ddu-source-git", "redrawCurrentDdu");
      },
    );
  }

  updateGitRemoteCache(): Promise<void> {
    return this.#gitRemoteCache.fetchRemote();
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

  gitSwitch(branchName: string, isDetach: boolean): Promise<void> {
    if (isDetach) {
      return gitSwitchDetach(this.#repoDir, branchName);
    } else {
      return gitSwitch(this.#repoDir, branchName);
    }
  }

  async gitPush(remoteName: string, branchNames: string[]): Promise<void> {
    await gitPush(this.#repoDir, remoteName, branchNames);
    this.#gitRemoteCache.fetchRemote();
  }

  async gitPull(remoteName: string, branchNames: string[]): Promise<void> {
    await gitPull(this.#repoDir, remoteName, branchNames);
    this.#gitRemoteCache.fetchRemote();
  }

  gitCreateBranch(branchName: string): Promise<void> {
    return gitCreateBranch(this.#repoDir, branchName);
  }

  gitDeleteBranches(branchNames: string[]): Promise<void> {
    return gitDeleteBranches(this.#repoDir, branchNames);
  }

  gitCreateTag(tagName: string, branchName: string): Promise<void> {
    return gitCreateTag(this.#repoDir, tagName, branchName);
  }

  async editCommitMessageSubject(
    commitHash: string,
    subject: string,
  ): Promise<void> {
    const currentBody = await getCommitMessageBody(this.#repoDir, commitHash);
    const commitMessage = [subject, currentBody];
    await setCommitMessage(this.#repoDir, commitHash, commitMessage);
  }

  fixupCommitsTo(
    targetCommitHash: string,
    commits: string[],
  ): Promise<void> {
    return fixupCommitsTo(this.#repoDir, targetCommitHash, commits);
  }

  listCommitLog(): Promise<string[]> {
    return listCommitLog(this.#repoDir);
  }
}

export async function main(denops: Denops): Promise<void> {
  const gitRepositoryStore: Record<string, GitRepository> = {};

  const getCwdResult = await getcwd(denops);
  const cwd = getCwdResult as string;
  gitRepositoryStore[cwd] = new GitRepository(denops, cwd);

  let currentRepository = gitRepositoryStore[cwd];

  await group(denops, "DduSourceGit", (helper) => {
    helper.define(
      "DirChanged",
      "*",
      "call denops#notify('ddu-source-git', 'setCurrentRepository', [expand('<afile>')])",
    );
  });

  let currentDduName = "";

  denops.dispatcher = {
    updateGitRemoteCache(): Promise<void> {
      return currentRepository.updateGitRemoteCache();
    },
    setCurrentRepository(cwd: unknown): Promise<void> {
      currentRepository = gitRepositoryStore[cwd as string];
      if (!currentRepository) {
        currentRepository = new GitRepository(denops, cwd as string);
        gitRepositoryStore[cwd as string] = currentRepository;
      }
      return Promise.resolve();
    },
    setDduName(name: unknown): Promise<void> {
      currentDduName = name as string;
      return Promise.resolve();
    },
    redrawCurrentDdu(): Promise<void> {
      if (currentDduName === "") {
        return Promise.resolve();
      }
      denops.dispatch("ddu", "redraw", currentDduName, { refreshItems: true });
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
    gitSwitch(branchName: unknown, isDetach: unknown): Promise<void> {
      assertString(branchName);
      assertBoolean(isDetach);

      return currentRepository.gitSwitch(branchName, isDetach);
    },
    gitPush(remoteName: unknown, branchNames: unknown): Promise<void> {
      assertString(remoteName);
      assertArray(branchNames, isString);

      return currentRepository.gitPush(remoteName, branchNames);
    },
    gitPull(remoteName: unknown, branchNames: unknown): Promise<void> {
      assertString(remoteName);
      assertArray(branchNames, isString);

      return currentRepository.gitPull(remoteName, branchNames);
    },
    gitCreateBranch(branchName: unknown): Promise<void> {
      assertString(branchName);

      return currentRepository.gitCreateBranch(branchName);
    },
    gitCreateTag(tagName: unknown, branchName: unknown): Promise<void> {
      assertString(tagName);
      assertString(branchName);

      return currentRepository.gitCreateTag(tagName, branchName);
    },
    gitDeleteBranches(branchNames: unknown): Promise<void> {
      assertArray(branchNames, isString);

      return currentRepository.gitDeleteBranches(branchNames);
    },
    editCommitMessageSubject(
      commitHash: unknown,
      subject: unknown,
    ): Promise<void> {
      assertString(commitHash);
      assertString(subject);

      return currentRepository.editCommitMessageSubject(commitHash, subject);
    },
    fixupCommitsTo(targetCommitHash: unknown, commits: unknown): Promise<void> {
      assertString(targetCommitHash);
      assertArray(commits, isString);

      return currentRepository.fixupCommitsTo(targetCommitHash, commits);
    },
    listCommitLog(): Promise<string[]> {
      return currentRepository.listCommitLog();
    },
  };

  return;
}
