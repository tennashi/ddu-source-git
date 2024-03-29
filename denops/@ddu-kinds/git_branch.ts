import {
  ActionArguments,
  ActionFlags,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.2.7/types.ts";
import { input } from "https://deno.land/x/denops_std@v5.0.1/helper/mod.ts";
import { executable } from "https://deno.land/x/denops_std@v5.0.1/function/mod.ts";

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
      if (args.items.length !== 1) {
        console.warn(
          "Multiple items were selected. Switch for the first item.",
        );
      }

      const targetItem = args.items[0];
      const action = targetItem.action as ActionData;

      await args.denops.dispatch(
        "ddu-source-git",
        "switchBranch",
        action.branch,
        action.isRemote,
      );

      return ActionFlags.None;
    },

    push: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      let remoteName = await input(args.denops, {
        prompt: "(remote name)> ",
        text: "origin",
      });

      if (!remoteName) {
        remoteName = "origin";
      }

      const branches = args.items.filter((item) =>
        !(item.action as ActionData).isRemote
      ).map((item) => (item.action as ActionData).branch);

      await args.denops.dispatch(
        "ddu-source-git",
        "pushBranches",
        remoteName,
        branches,
      );

      return ActionFlags.RefreshItems;
    },

    pull: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      let remoteName = await input(args.denops, {
        prompt: "(remote name)> ",
        text: "origin",
      });

      if (!remoteName) {
        remoteName = "origin";
      }

      const branches = args.items.filter((item) =>
        !(item.action as ActionData).isRemote
      ).map((item) => (item.action as ActionData).branch);

      await args.denops.dispatch(
        "ddu-source-git",
        "pullRemoteBranches",
        remoteName,
        branches,
      );

      return ActionFlags.RefreshItems;
    },

    create: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const branchName = await input(args.denops, {
        prompt: "(branch name)> ",
      });

      if (!branchName) {
        return ActionFlags.Persist;
      }

      await args.denops.dispatch(
        "ddu-source-git",
        "createBranch",
        branchName,
      );

      return ActionFlags.RefreshItems;
    },

    tag: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      if (args.items.length !== 1) {
        console.warn(
          "Multiple items were selected. Tag for the first item.",
        );
      }

      const tagName = await input(args.denops, {
        prompt: "(tag name)> ",
      });

      if (!tagName) {
        return ActionFlags.Persist;
      }

      const targetItem = args.items[0];
      const action = targetItem.action as ActionData;
      await args.denops.dispatch(
        "ddu-source-git",
        "createTag",
        tagName,
        action.branch,
      );

      return ActionFlags.RefreshItems;
    },

    delete: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const branches = args.items.map((item) => {
        const action = item.action as ActionData;
        return action.branch;
      });

      await args.denops.dispatch(
        "ddu-source-git",
        "deleteBranches",
        branches,
      );

      return ActionFlags.RefreshItems;
    },

    create_pr: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const hasGitHubCli = await executable(args.denops, "gh") == 1;
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
