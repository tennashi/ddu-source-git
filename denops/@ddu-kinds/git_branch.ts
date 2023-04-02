import {
  ActionArguments,
  ActionFlags,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { input } from "https://deno.land/x/denops_std@v4.1.0/helper/mod.ts";
import { executable } from "https://deno.land/x/denops_std@v4.1.0/function/mod.ts";

import { State } from "../ddu-source-git/cache/git_remote/main.ts";

export type ActionData = {
  branch: string;
  isRemote: boolean;
  remoteState?: State;
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

        let cmd: Deno.Command;
        if (action?.isRemote) {
          cmd = new Deno.Command("git", {
            args: ["switch", "--detach", action.branch],
            cwd: cwd,
          });
        } else {
          cmd = new Deno.Command("git", {
            args: ["switch", action.branch],
            cwd: cwd,
          });
        }

        const result = cmd.outputSync();

        if (!result.success) {
          console.log(decoder.decode(result.stderr));
        }
      }

      return ActionFlags.None;
    },

    push: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      for (const item of args.items) {
        const action = item?.action as ActionData;

        let remoteName = await input(args.denops, {
          prompt: "(remote name)> ",
          text: "origin",
        });

        if (!remoteName) {
          remoteName = "origin";
        }

        const cmd = new Deno.Command("git", {
          args: ["push", "--set-upstream", remoteName, action.branch],
          cwd: cwd,
        });
        const result = cmd.outputSync();

        if (!result.success) {
          console.log(decoder.decode(result.stderr));
        }
      }

      return ActionFlags.RefreshItems;
    },

    pull: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      for (const item of args.items) {
        const action = item?.action as ActionData;

        let remoteName = await input(args.denops, {
          prompt: "(remote name)> ",
          text: "origin",
        });

        if (!remoteName) {
          remoteName = "origin";
        }

        const cmd = new Deno.Command("git", {
          args: ["pull", remoteName, action.branch],
          cwd: cwd,
        });
        const result = cmd.outputSync();

        if (!result.success) {
          console.log(decoder.decode(result.stderr));
        }
      }

      return ActionFlags.RefreshItems;
    },

    create: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const branchName = await input(args.denops, {
        prompt: "(branch name)> ",
      });

      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      if (!branchName) {
        return ActionFlags.Persist;
      }

      const cmd = new Deno.Command("git", {
        args: ["branch", branchName],
        cwd: cwd,
      });
      const result = cmd.outputSync();

      if (!result.success) {
        console.log(decoder.decode(result.stderr));
      }

      return ActionFlags.RefreshItems;
    },

    tag: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const tagName = await input(args.denops, {
        prompt: "(tag name)> ",
      });

      if (!tagName) {
        return ActionFlags.Persist;
      }

      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      if (args.items.length > 1) {
        console.log("don't support multiple items");
      }

      const action = args.items[0]?.action as ActionData;
      const cmd = new Deno.Command("git", {
        args: ["tag", tagName, action.branch],
        cwd: cwd,
      });

      const result = cmd.outputSync();

      if (!result.success) {
        console.log(decoder.decode(result.stderr));
      }

      return ActionFlags.RefreshItems;
    },

    delete: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      const targetBranches = args.items.map((item) => {
        const action = item.action as ActionData;
        return action.branch;
      });

      const cmd = new Deno.Command("git", {
        args: ["branch", "--delete", ...targetBranches],
        cwd: cwd,
      });
      const result = cmd.outputSync();

      if (!result.success) {
        console.log(decoder.decode(result.stderr));
      }

      return ActionFlags.RefreshItems;
    },

    create_pr: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const hasGitHubCli = await executable(args.denops, "gh") as boolean;
      if (!hasGitHubCli) {
        console.log("create_pr action requires `gh` command.");
        return ActionFlags.Persist;
      }

      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      for (const item of args.items) {
        const action = item?.action as ActionData;

        const cmd = new Deno.Command("gh", {
          args: ["pr", "create", "--head", action.branch, "--fill"],
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
