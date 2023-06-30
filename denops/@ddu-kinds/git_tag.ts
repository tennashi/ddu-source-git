import {
  ActionArguments,
  ActionFlags,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.2.7/types.ts";
import { input } from "https://deno.land/x/denops_std@v5.0.1/helper/mod.ts";

export type ActionData = {
  tag: string;
};

type Params = Record<never, never>;

const decoder = new TextDecoder();

export class Kind extends BaseKind<Params> {
  actions: Record<
    string,
    (args: ActionArguments<Params>) => Promise<ActionFlags>
  > = {
    switch: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      for (const item of args.items) {
        const action = item?.action as ActionData;

        const cmd = new Deno.Command("git", {
          args: ["switch", "--detach", action.tag],
          cwd: cwd,
        });
        const result = cmd.outputSync();

        if (!result.success) {
          console.log(decoder.decode(result.stderr));
        }
      }

      return ActionFlags.None;
    },

    create: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const tagName = await input(args.denops, {
        prompt: "(tag name)> ",
      });

      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      if (!tagName) {
        return ActionFlags.Persist;
      }

      const cmd = new Deno.Command("git", { args: ["tag", tagName], cwd: cwd });
      const result = cmd.outputSync();

      if (!result.success) {
        console.log(decoder.decode(result.stderr));
      }

      return ActionFlags.RefreshItems;
    },

    delete: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      const targetTags = args.items.map((item) => {
        const action = item.action as ActionData;
        return action.tag;
      });

      const cmd = new Deno.Command("git", {
        args: ["tag", "--delete", ...targetTags],
        cwd: cwd,
      });
      const result = cmd.outputSync();

      if (!result.success) {
        console.log(decoder.decode(result.stderr));
      }

      return ActionFlags.RefreshItems;
    },
  };

  params(): Params {
    return {};
  }
}
