import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v2.4.0/types.ts";
import { GatherArguments } from "https://deno.land/x/ddu_vim@v2.4.0/base/source.ts";
import { ActionData } from "../@ddu-kinds/git_commit.ts";

type Params = Record<never, never>;

export class Source extends BaseSource<Params> {
  kind = "git_commit"

  gather(args: GatherArguments<Params>): ReadableStream<Item<ActionData>[]> {
    const decoder = new TextDecoder()

    return new ReadableStream({
      async start(controller) {
        const getCwdResult = await args.denops.call("getcwd")
        const cwd = getCwdResult as string

        const cmd = new Deno.Command("git", { args: ["log", "--oneline"], cwd: cwd });
        const result = cmd.outputSync();
        const stdout = decoder.decode(result.stdout);

        const items: Item<ActionData>[] = [];
        stdout.split(/\r?\n/).forEach((line) => {
          if (line == "") {
            return;
          }

          const commitHash = line.slice(0, line.indexOf(" "));
          const subject = line.slice(line.indexOf(" ")+1);

          items.push({
            word: commitHash,
            display: line,
            action: { commitHash: commitHash, subject: subject },
          });
        });

        controller.enqueue(items);

        controller.close();
      }
    })
  }

  params(): Params {
    return {};
  }
}
