import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v2.3.0/types.ts";
import { GatherArguments } from "https://deno.land/x/ddu_vim@v2.3.0/base/source.ts";
import { ActionData as GitBranchActionData } from "../@ddu-kinds/git_branch.ts";
import { ActionData as GitTagActionData } from "../@ddu-kinds/git_tag.ts";

type Params = Record<never, never>;

type ActionData = GitBranchActionData | GitTagActionData

const encoder = new TextEncoder();

function charposToBytepos(input: string, pos: number): number {
  return byteLength(input.slice(0, pos));
}

function byteLength(input: string): number {
  return encoder.encode(input).length
}

export class Source extends BaseSource<Params> {
  kind = ""

  gather(args: GatherArguments<Params>): ReadableStream<Item<ActionData>[]> {
    const decoder = new TextDecoder()

    return new ReadableStream({
      async start(controller) {
        const getCwdResult = await args.denops.call("getcwd")
        const cwd = getCwdResult as string

        const cmd = new Deno.Command("git", { args: ["show-ref"], cwd: cwd });
        const result = cmd.outputSync();
        const stdout = decoder.decode(result.stdout);

        const items: Item<ActionData>[] = [];
        const itemLoaders: Promise<Item<ActionData>>[] = [];
        stdout.split(/\r?\n/).forEach((line) => {
          if (line == "") {
            return;
          }

          const gitRef = line.slice(line.indexOf(" ")+1);

          if (gitRef.startsWith("refs/heads/")) {
            const branch = gitRef.slice("refs/heads/".length)

            itemLoaders.push(
              new Promise((resolve) => {
                const cmd = new Deno.Command("git", { args: ["rev-parse", "--abbrev-ref", `${branch}@{upstream}`], cwd: cwd });
                const result = cmd.outputSync();
                const stdout = decoder.decode(result.stdout);
                const upstreamBranch = stdout.trim();

                if (upstreamBranch === "") {
                  resolve({
                    word: gitRef,
                    display: branch,
                    kind: "git_branch",
                    action: { branch: branch },
                  })
                } else {
                  resolve({
                    word: gitRef,
                    display: `${branch} -> ${upstreamBranch}`,
                    kind: "git_branch",
                    action: { branch: branch },
                    highlights: [
                      { name: "remote", hl_group: "Identifier", col: byteLength(`${branch} -> `) + 1, width: byteLength(upstreamBranch) },
                    ],
                  })
                }
              })
            )

            return;
          }

          if (gitRef.startsWith("refs/remotes/")) {
            const branch = gitRef.slice("refs/remotes/".length)
            items.push({
              word: gitRef,
              display: branch,
              kind: "git_branch",
              action: { branch: branch, isRemote: true },
              highlights: [
                { name: "remote", hl_group: "Identifier", col: 1, width: branch.length }
              ],
            })

            return;
          }

          if (gitRef.startsWith("refs/tags/")) {
            const tag = gitRef.slice("refs/tags/".length)
            items.push({
              word: gitRef,
              display: tag,
              kind: "git_tag",
              action: { tag: tag },
              highlights: [
                { name: "tag", hl_group: "Tag", col: 1, width: tag.length }
              ],
            })

            return;
          }
        })

        controller.enqueue(items);

        const lazyItems = await Promise.all(itemLoaders);
        controller.enqueue(lazyItems);

        controller.close();
      }
    })
  }

  params(): Params {
    return {};
  }
}
