import {
  ActionArguments,
  ActionFlags,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.2.7/types.ts";

import { FileStatus } from "../ddu-source-git/git_status/file_status.ts";

export type ActionData = {
  fileStatus: FileStatus;
};

type Params = Record<never, never>;

const decoder = new TextDecoder();

export class Kind extends BaseKind<Params> {
  actions: Record<
    string,
    (args: ActionArguments<Params>) => Promise<ActionFlags>
  > = {
    add: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      for (const item of args.items) {
        const action = item?.action as ActionData;

        const cmd = new Deno.Command("git", {
          args: ["add", action.fileStatus.path],
          cwd: cwd,
        });
        const result = cmd.outputSync();

        if (!result.success) {
          console.log(decoder.decode(result.stderr));
        }
      }

      return ActionFlags.RefreshItems;
    },
    restore: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      for (const item of args.items) {
        const action = item?.action as ActionData;

        const cmd = new Deno.Command("git", {
          args: ["restore", action.fileStatus.path],
          cwd: cwd,
        });
        const result = cmd.outputSync();

        if (!result.success) {
          console.log(decoder.decode(result.stderr));
        }
      }

      return ActionFlags.RefreshItems;
    },
  };

  params(): Params {
    return {};
  }
}
