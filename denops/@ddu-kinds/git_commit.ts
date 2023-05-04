import {
  ActionArguments,
  ActionFlags,
  BaseKind,
  Previewer,
} from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v2.5.0/base/kind.ts";
import { input } from "https://deno.land/x/denops_std@v4.1.0/helper/mod.ts";

export type ActionData = {
  commitHash: string;
  subject: string;
};

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  actions: Record<
    string,
    (args: ActionArguments<Params>) => Promise<ActionFlags>
  > = {
    editSubject: async (
      args: ActionArguments<Params>,
    ): Promise<ActionFlags> => {
      if (args.items.length !== 1) {
        console.warn(
          "Multiple items were selected. Edit subject for the first item.",
        );
      }

      const commitSubject = await input(args.denops, {
        prompt: "(commit subject)> ",
      }) as string;

      if (commitSubject.length === 0) {
        console.warn(
          "The subject must not be empty. ",
        );
        return ActionFlags.Persist;
      }

      const targetItem = args.items[0];
      const action = targetItem.action as ActionData;

      await args.denops.dispatch(
        "ddu-source-git",
        "editCommitMessageSubject",
        action.commitHash,
        commitSubject,
      );

      return ActionFlags.RefreshItems;
    },
    fixupTo: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const targetCommit = await input(args.denops, {
        prompt: "(commit hash)> ",
        completion: async (
          _arglead: string,
          _cmdline: string,
          _cursorpos: number,
        ): Promise<string[]> => {
          return await args.denops.dispatch(
            "ddu-source-git",
            "listCommitLog",
          ) as string[];
        },
      }) as string;
      const targetHash = targetCommit.slice(0, targetCommit.indexOf(" "));

      const commits = args.items.map((item) =>
        (item.action as ActionData).commitHash
      );

      await args.denops.dispatch(
        "ddu-source-git",
        "fixupCommitsTo",
        targetHash,
        commits,
      );

      return ActionFlags.RefreshItems;
    },
  };

  getPreviewer(args: GetPreviewerArguments): Promise<Previewer | undefined> {
    const action = args.item.action as ActionData;
    return Promise.resolve({
      kind: "terminal",
      cmds: ["git", "show", action.commitHash],
    });
  }

  params(): Params {
    return {};
  }
}
