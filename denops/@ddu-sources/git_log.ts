import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.2.7/types.ts";
import { GatherArguments } from "https://deno.land/x/ddu_vim@v3.2.7/base/source.ts";
import { ActionData } from "../@ddu-kinds/git_commit.ts";

type Params = Record<never, never>;

export class Source extends BaseSource<Params> {
  kind = "git_commit";

  gather(args: GatherArguments<Params>): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const items = await args.denops.dispatch(
          "ddu-source-git",
          "gitLog",
          [],
        ) as Item<ActionData>[];

        controller.enqueue(items);

        controller.close();
      },
    });
  }

  params(): Params {
    return {};
  }
}
