import {
  ActionArguments,
  ActionFlags,
} from "https://deno.land/x/ddu_vim@v3.2.7/types.ts";
import { Kind as WorkingTreeKind } from "./git_working_tree.ts";
import { FileStatus } from "../ddu-source-git/git_status/file_status.ts";

export type ActionData = {
  fileStatus: FileStatus;
};

type Params = Record<never, never>;

export class Kind extends WorkingTreeKind {
  constructor() {
    super();

    this.actions = {
      ginChaperon: (args: ActionArguments<Params>): Promise<ActionFlags> => {
        for (const item of args.items) {
          const action = item?.action as ActionData;

          args.denops.cmd(`:GinChaperon ${action.fileStatus.path}`);
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
