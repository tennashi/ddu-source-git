import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { GatherArguments } from "https://deno.land/x/ddu_vim@v2.5.0/base/source.ts";
import { ActionData } from "../ddu-source-git/git_ref/main.ts";

type Params = {
  disableRemote: boolean;
  disableTag: boolean;
};

export class Source extends BaseSource<Params> {
  kind = "git_branch";

  gather(args: GatherArguments<Params>): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const items = await args.denops.call(
          "denops#request",
          "ddu-source-git",
          "gitRef",
          [],
        ) as Item<ActionData>[];

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
