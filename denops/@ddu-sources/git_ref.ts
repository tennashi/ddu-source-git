import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { GatherArguments } from "https://deno.land/x/ddu_vim@v2.5.0/base/source.ts";
import { getcwd } from "https://deno.land/x/denops_std@v4.1.0/function/mod.ts";
import { ensureString } from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import { ActionData as GitBranchActionData } from "../@ddu-kinds/git_branch.ts";
import { ActionData as GitTagActionData } from "../@ddu-kinds/git_tag.ts";

type Params = {
  disableRemote: boolean;
  disableTag: boolean;
};

type ActionData = GitBranchActionData | GitTagActionData;

type GitRef = "tag" | "branch" | "remote_branch";

function parseGitRef(gitRef: string): Item<ActionData> {
  if (gitRef.startsWith("refs/heads/")) {
    const branch = gitRef.slice("refs/heads/".length);

    return {
      word: gitRef,
      display: branch,
      kind: "git_branch",
      action: { branch: branch },
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

export class Source extends BaseSource<Params> {
  kind = "git_branch";

  gather(args: GatherArguments<Params>): ReadableStream<Item<ActionData>[]> {
    const decoder = new TextDecoder();

    return new ReadableStream({
      async start(controller) {
        const cwd = ensureString(await getcwd(args.denops));

        const cmd = new Deno.Command("git", { args: ["show-ref"], cwd: cwd });
        const result = cmd.outputSync();
        const stdout = decoder.decode(result.stdout).trim();

        const items = stdout.split(/\r?\n/).map((line) => {
          const gitRef = line.slice(line.indexOf(" ") + 1);
          return parseGitRef(gitRef);
        });

        controller.enqueue(items);

        controller.close();
      },
    });
  }

  params(): Params {
    return {
      disableRemote: false,
      disableTag: false,
    };
  }
}
