import { BaseKind, ActionArguments, ActionFlags } from "https://deno.land/x/ddu_vim@v2.3.0/types.ts";
import { input } from "https://deno.land/x/denops_std@v4.0.0/helper/mod.ts";

export type ActionData = {
  branch: string;
  isRemote?: boolean;
};

type Params = Record<never, never>;

const decoder = new TextDecoder();

export class Kind extends BaseKind<Params> {
  actions: Record<string, (args: ActionArguments<Params>) => Promise<ActionFlags>> = {
    switch: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const getCwdResult = await args.denops.call("getcwd")
      const cwd = getCwdResult as string

      for (const item of args.items) {
        const action = item?.action as ActionData;

        let cmd: Deno.Command
        if (action?.isRemote) {
          cmd = new Deno.Command("git", { args: ["switch", "--detach", action.branch], cwd: cwd });
        } else {
          cmd = new Deno.Command("git", { args: ["switch", action.branch], cwd: cwd });
        }

        const result = cmd.outputSync();

        if (!result.success) {
          console.log(decoder.decode(result.stderr));
        }
      }

      return ActionFlags.None;
    },

    create: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const branchName = await input(args.denops, {
        prompt: "(branch name)> ",
      });

      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      if (!branchName) {
        return ActionFlags.Persist
      }

      const cmd = new Deno.Command("git", { args: ["branch", branchName], cwd: cwd });
      const result = cmd.outputSync();

      if (!result.success) {
        console.log(decoder.decode(result.stderr));
      }

      return ActionFlags.RefreshItems;
    },
  }

  params(): Params {
    return {};
  }
}
