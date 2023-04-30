import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { GatherArguments } from "https://deno.land/x/ddu_vim@v2.5.0/base/source.ts";

import { ActionData } from "../ddu-source-git/git_status/main.ts";

type Params = Record<never, never>;

export class Source extends BaseSource<Params> {
  kind = "git_index";

  gather(args: GatherArguments<Params>): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const items = await args.denops.dispatch(
          "ddu-source-git",
          "gitStatus",
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
