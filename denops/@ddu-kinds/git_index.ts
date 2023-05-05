import {
  ActionArguments,
  ActionFlags,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { term_start } from "https://deno.land/x/denops_std@v4.1.0/function/vim/mod.ts";
import { FileStatus } from "../ddu-source-git/git_status/file_status.ts";

export type ActionData = {
  fileStatus: FileStatus;
};

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  actions: Record<
    string,
    (args: ActionArguments<Params>) => Promise<ActionFlags>
  > = {
    restoreStaged: async (
      args: ActionArguments<Params>,
    ): Promise<ActionFlags> => {
      const filePathes = args.items.map((item) =>
        (item.action as ActionData).fileStatus.path
      );

      await args.denops.dispatch(
        "ddu-source-git",
        "restoreStagedChanges",
        filePathes,
      );

      return ActionFlags.RefreshItems;
    },

    commitAll: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      await term_start(args.denops, ["git", "commit"], {
        cwd: cwd,
        term_finish: "close",
      });

      return ActionFlags.RefreshItems | ActionFlags.RestoreCursor;
    },
  };

  params(): Params {
    return {};
  }
}
