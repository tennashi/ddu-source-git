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

const decoder = new TextDecoder();

function getMessageBody(cwd: string, commitHash: string): string {
  const cmd = new Deno.Command("git", {
    args: ["show", "--no-patch", "--format=%b", commitHash],
    cwd: cwd,
  });
  const result = cmd.outputSync();
  if (!result.success) {
    console.log(decoder.decode(result.stderr));
  }
  return decoder.decode(result.stdout).trimEnd();
}

function setMessage(cwd: string, paragraphs: string[]) {
  const cmd = new Deno.Command("git", {
    args: ["commit", "--allow-empty"].concat(
      paragraphs.flatMap((paragraph) => ["-m", paragraph]),
    ),
    cwd: cwd,
  });

  const result = cmd.outputSync();
  if (!result.success) {
    console.log(decoder.decode(result.stderr));
  }
}

function autosquash(cwd: string, commitHash: string) {
  const cmd = new Deno.Command("git", {
    args: ["rebase", "-i", "--autosquash", `${commitHash}~1`],
    cwd: cwd,
    env: { GIT_SEQUENCE_EDITOR: "true" },
  });

  const result = cmd.outputSync();
  if (!result.success) {
    console.log(decoder.decode(result.stderr));
  }
}

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
      const getCwdResult = await args.denops.call("getcwd");
      const cwd = getCwdResult as string;

      const targetCommit = await input(args.denops, {
        prompt: "(commit hash)> ",
        completion: (
          _arglead: string,
          _cmdline: string,
          _cursorpos: number,
        ): string[] | Promise<string[]> => {
          const cmd = new Deno.Command("git", {
            args: ["log", "--oneline"],
            cwd: cwd,
          });

          const result = cmd.outputSync();
          if (!result.success) {
            console.log(decoder.decode(result.stderr));
          }

          return decoder.decode(result.stdout).split(/\r?\n/);
        },
      }) as string;
      const targetHash = targetCommit.slice(0, targetCommit.indexOf(" "));

      for (const item of args.items) {
        const action = item?.action as ActionData;
        setMessage(cwd, [
          `amend! ${action.commitHash}`,
          `fixup! ${targetHash}`,
        ]);
        autosquash(cwd, action.commitHash);
      }

      autosquash(cwd, targetHash);

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
