import { BaseKind, ActionArguments, ActionFlags } from "https://deno.land/x/ddu_vim@v2.3.0/types.ts";

export type ActionData = {
  branch: string;
  isRemote?: boolean;
};

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  actions: Record<string, (args: ActionArguments<Params>) => Promise<ActionFlags>> = {
    switch: (args: ActionArguments<Params>) => {
      const decoder = new TextDecoder();

      for (const item of args.items) {
        const action = item?.action as ActionData;

        let cmd: Deno.Command
        if (action?.isRemote) {
          cmd = new Deno.Command("git", { args: ["switch", "--detach", action.branch] });
        } else {
          cmd = new Deno.Command("git", { args: ["switch", action.branch] });
        }

        const result = cmd.outputSync();

        if (!result.success) {
          console.log(decoder.decode(result.stderr));
        }
      }

      return Promise.resolve(ActionFlags.None);
    },
  }

  params(): Params {
    return {};
  }
}
