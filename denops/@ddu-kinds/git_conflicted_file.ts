import {
  ActionArguments,
  ActionFlags,
} from "https://deno.land/x/ddu_vim@v2.3.0/types.ts";
import { Kind as WorkingTreeKind } from "./git_working_tree.ts";

export type ActionData = {
  path: string;
};

type Params = Record<never, never>;

const decoder = new TextDecoder();

export class Kind extends WorkingTreeKind {
  constructor() {
    super();

    this.actions = {
      ginChaperon: (args: ActionArguments<Params>): Promise<ActionFlags> => {
        for (const item of args.items) {
          const action = item?.action as ActionData;

          args.denops.cmd(`:GinChaperon ${action.path}`);
        }

        return Promise.resolve(ActionFlags.None);
      },
      ...this.actions,
    };
  }

  params(): Params {
    return {};
  }
}
