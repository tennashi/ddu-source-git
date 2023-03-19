import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { GatherArguments } from "https://deno.land/x/ddu_vim@v2.5.0/base/source.ts";
import { getcwd } from "https://deno.land/x/denops_std@v4.1.0/function/mod.ts";
import { ensureString } from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import { ActionData as GitBranchActionData } from "../@ddu-kinds/git_branch.ts";
import { ActionData as GitTagActionData } from "../@ddu-kinds/git_tag.ts";

type Params = Record<never, never>;

type ActionData = GitBranchActionData | GitTagActionData;

export class Source extends BaseSource<Params> {
  kind = "";

  gather(args: GatherArguments<Params>): ReadableStream<Item<ActionData>[]> {
    const decoder = new TextDecoder();

    return new ReadableStream({
      async start(controller) {
        const cwd = ensureString(await getcwd(args.denops));

        const cmd = new Deno.Command("git", { args: ["show-ref"], cwd: cwd });
        const result = cmd.outputSync();
        const stdout = decoder.decode(result.stdout);

        const items: Item<ActionData>[] = [];
        stdout.split(/\r?\n/).forEach((line) => {
          if (line == "") {
            return;
          }

          const gitRef = line.slice(line.indexOf(" ") + 1);

          if (gitRef.startsWith("refs/heads/")) {
            const branch = gitRef.slice("refs/heads/".length);
            items.push({
              word: gitRef,
              display: branch,
              kind: "git_branch",
              action: { branch: branch },
            });

            return;
          }

          if (gitRef.startsWith("refs/remotes/")) {
            const branch = gitRef.slice("refs/remotes/".length);
            items.push({
              word: gitRef,
              display: branch,
              kind: "git_branch",
              action: { branch: branch, isRemote: true },
            });

            return;
          }

          if (gitRef.startsWith("refs/tags/")) {
            const tag = gitRef.slice("refs/tags/".length);
            items.push({
              word: gitRef,
              display: tag,
              kind: "git_tag",
              action: { tag: tag },
            });

            return;
          }
        });

        controller.enqueue(items);

        controller.close();
      },
    });
  }

  params(): Params {
    return {};
  }
}
