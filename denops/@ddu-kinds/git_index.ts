import {
  ActionArguments,
  ActionFlags,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v2.3.1/types.ts";
import { term_start } from "https://deno.land/x/denops_std@v4.0.0/function/vim/mod.ts";

export type ActionData = {
  path: string;
};

type Params = Record<never, never>;

const decoder = new TextDecoder();

function getRepositoryRoot(cwd: string): string {
  const cmd = new Deno.Command("git", {
    args: ["rev-parse", "--show-toplevel"],
    cwd: cwd,
  });

  const result = cmd.outputSync();
  return decoder.decode(result.stdout).trim();
}

export class Kind extends BaseKind<Params> {
  actions: Record<
    string,
    (args: ActionArguments<Params>) => Promise<ActionFlags>
  > = {
    restoreStaged: async (
      args: ActionArguments<Params>,
    ): Promise<ActionFlags> => {
      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      for (const item of args.items) {
        const action = item?.action as ActionData;

        const cmd = new Deno.Command("git", {
          args: ["restore", "--staged", action.path],
          cwd: cwd,
        });
        const result = cmd.outputSync();

        if (!result.success) {
          console.log(decoder.decode(result.stderr));
        }
      }

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
