import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.2.7/types.ts";
import {
  GatherArguments,
  OnInitArguments,
} from "https://deno.land/x/ddu_vim@v3.2.7/base/source.ts";
import { ActionData } from "../ddu-source-git/git_ref/main.ts";

type Params = {
  disableRemote: boolean;
  disableTag: boolean;
};

export class Source extends BaseSource<Params> {
  kind = "git_branch";

  onInit(args: OnInitArguments<Params>): Promise<void> {
    args.denops.dispatch("ddu-source-git", "updateGitRemoteCache");
    return Promise.resolve();
  }

  gather(args: GatherArguments<Params>): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        await args.denops.dispatch(
          "ddu-source-git",
          "setDduName",
          args.options.name,
        );

        const items = await args.denops.dispatch(
          "ddu-source-git",
          "gitRef",
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
