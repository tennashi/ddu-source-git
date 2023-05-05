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
import { switchLocalBranch, switchRemoteBranch } from "./git_branch/switch.ts";
import { pushBranches } from "./git_branch/push.ts";
import { pullRemoteBranches } from "./git_branch/pull.ts";
import { createBranch } from "./git_branch/create.ts";
import { deleteBranches } from "./git_branch/delete.ts";
import { createTag } from "./git_tag/create.ts";
import {
  getCommitMessageBody,
  setCommitMessage,
} from "./git_commit/message.ts";
import { fixupCommitsTo } from "./git_commit/fixup_to.ts";
import { listCommitLog } from "./git_commit/list_log.ts";
import { restoreStagedChanges } from "./git_staged_file/restore.ts";

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

  switchBranch(branchName: string, isRemote: boolean): Promise<void> {
    if (isRemote) {
      return switchRemoteBranch(this.#repoDir, branchName);
    } else {
      return switchLocalBranch(this.#repoDir, branchName);
    }
  }

  async pushBranches(remoteName: string, branchNames: string[]): Promise<void> {
    await pushBranches(this.#repoDir, remoteName, branchNames);
    this.#gitRemoteCache.fetchRemote();
  }

  async pullRemoteBranches(
    remoteName: string,
    branchNames: string[],
  ): Promise<void> {
    await pullRemoteBranches(this.#repoDir, remoteName, branchNames);
    this.#gitRemoteCache.fetchRemote();
  }

  createBranch(branchName: string): Promise<void> {
    return createBranch(this.#repoDir, branchName);
  }

  deleteBranches(branchNames: string[]): Promise<void> {
    return deleteBranches(this.#repoDir, branchNames);
  }

  createTag(tagName: string, branchName: string): Promise<void> {
    return createTag(this.#repoDir, tagName, branchName);
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

  restoreStagedChanges(filePathes: string[]): Promise<void> {
    return restoreStagedChanges(this.#repoDir, filePathes);
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
    switchBranch(branchName: unknown, isRemote: unknown): Promise<void> {
      assertString(branchName);
      assertBoolean(isRemote);

      return currentRepository.switchBranch(branchName, isRemote);
    },
    pushBranches(remoteName: unknown, branchNames: unknown): Promise<void> {
      assertString(remoteName);
      assertArray(branchNames, isString);

      return currentRepository.pushBranches(remoteName, branchNames);
    },
    pullRemoteBranches(
      remoteName: unknown,
      branchNames: unknown,
    ): Promise<void> {
      assertString(remoteName);
      assertArray(branchNames, isString);

      return currentRepository.pullRemoteBranches(remoteName, branchNames);
    },
    createBranch(branchName: unknown): Promise<void> {
      assertString(branchName);

      return currentRepository.createBranch(branchName);
    },
    createTag(tagName: unknown, branchName: unknown): Promise<void> {
      assertString(tagName);
      assertString(branchName);

      return currentRepository.createTag(tagName, branchName);
    },
    deleteBranches(branchNames: unknown): Promise<void> {
      assertArray(branchNames, isString);

      return currentRepository.deleteBranches(branchNames);
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
    restoreStagedChanges(filePathes: unknown): Promise<void> {
      assertArray(filePathes, isString);

      return currentRepository.restoreStagedChanges(filePathes);
    },
  };

  return;
}
