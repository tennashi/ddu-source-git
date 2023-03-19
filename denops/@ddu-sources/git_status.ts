import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { GatherArguments } from "https://deno.land/x/ddu_vim@v2.5.0/base/source.ts";
import { ActionData as GitWorkingTreeActionData } from "../@ddu-kinds/git_working_tree.ts";
import { ActionData as GitIndexActionData } from "../@ddu-kinds/git_index.ts";
import { ActionData as GitConflictedFileActionData } from "../@ddu-kinds/git_conflicted_file.ts";

type Params = Record<never, never>;

type ActionData =
  | GitWorkingTreeActionData
  | GitIndexActionData
  | GitConflictedFileActionData;

const encoder = new TextEncoder();

function charposToBytepos(input: string, pos: number): number {
  return byteLength(input.slice(0, pos));
}

function byteLength(input: string): number {
  return encoder.encode(input).length;
}

type State =
  | "unmodified"
  | "modified"
  | "fileTypeChanged"
  | "added"
  | "deleted"
  | "renamed"
  | "copied"
  | "updatedButUnmerged"
  | "untracked"
  | "ignored";

type FileStatus = {
  path: string;
  origPath?: string;
  indexState: State;
  workingTreeState: State;
};

function parseState(state: string): State {
  switch (state) {
    case " ":
      return "unmodified";
    case "M":
      return "modified";
    case "T":
      return "fileTypeChanged";
    case "A":
      return "added";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    case "C":
      return "copied";
    case "U":
      return "updatedButUnmerged";
    case "?":
      return "untracked";
    case "!":
      return "ignored";
    default:
      return "unmodified";
  }
}

function parseFileStatus(line: string): FileStatus {
  const stateField = line.slice(0, 2);
  const indexState = parseState(stateField[0]);
  const workingTreeState = parseState(stateField[1]);

  if (line.includes("->")) {
    return {
      path: line.slice(line.indexOf("->") + "->".length + 1),
      origPath: line.slice(3, line.indexOf("->") - 1),
      indexState: indexState,
      workingTreeState: workingTreeState,
    };
  }

  return {
    path: line.slice(3),
    indexState: indexState,
    workingTreeState: workingTreeState,
  };
}

export class Source extends BaseSource<Params> {
  kind = "git_index";

  gather(args: GatherArguments<Params>): ReadableStream<Item<ActionData>[]> {
    const decoder = new TextDecoder();

    return new ReadableStream({
      async start(controller) {
        const getCwdResult = await args.denops.call("getcwd");
        const cwd = getCwdResult as string;

        const cmd = new Deno.Command("git", {
          args: ["status", "--porcelain"],
          cwd: cwd,
        });
        const result = cmd.outputSync();
        const stdout = decoder.decode(result.stdout);

        const items: Item<ActionData>[] = [];
        stdout.split(/\r?\n/).forEach((line) => {
          if (line == "") {
            return;
          }

          const fileStatus = parseFileStatus(line);

          switch (fileStatus.workingTreeState) {
            case "unmodified":
              break;
            case "untracked":
              items.push({
                word: fileStatus.path,
                kind: "git_working_tree",
                action: { path: fileStatus.path },
                highlights: [
                  {
                    name: "working_tree_untracked",
                    hl_group: "DduSourceGitWorkingTreeUntracked",
                    col: 1,
                    width: byteLength(fileStatus.path),
                  },
                ],
              });
              break;
            case "added":
              items.push({
                word: fileStatus.path,
                kind: "git_working_tree",
                action: { path: fileStatus.path },
                highlights: [
                  {
                    name: "working_tree_added",
                    hl_group: "DduSourceGitWorkingTreeAdded",
                    col: 1,
                    width: byteLength(fileStatus.path),
                  },
                ],
              });
              break;
            case "deleted":
              items.push({
                word: fileStatus.path,
                kind: "git_working_tree",
                action: { path: fileStatus.path },
                highlights: [
                  {
                    name: "working_tree_deleted",
                    hl_group: "DduSourceGitWorkingTreeDeleted",
                    col: 1,
                    width: byteLength(fileStatus.path),
                  },
                ],
              });
              break;
            case "renamed":
            case "copied":
              items.push({
                word: fileStatus.path,
                display: `${fileStatus.path} <- ${fileStatus.origPath}`,
                kind: "git_working_tree",
                action: { path: fileStatus.path },
                highlights: [
                  {
                    name: "working_tree_changed",
                    hl_group: "DduSourceGitWorkingTreeChanged",
                    col: 1,
                    width: byteLength(fileStatus.path),
                  },
                ],
              });
              break;
            case "updatedButUnmerged":
              if (fileStatus.indexState === "updatedButUnmerged") {
                items.push({
                  word: fileStatus.path,
                  kind: "git_conflicted_file",
                  action: { path: fileStatus.path },
                  highlights: [
                    {
                      name: "conflicted",
                      hl_group: "DduSourceGitConflicted",
                      col: 1,
                      width: byteLength(fileStatus.path),
                    },
                  ],
                });
                break;
              }
              /* falls through */
            default:
              items.push({
                word: fileStatus.path,
                kind: "git_working_tree",
                action: { path: fileStatus.path },
                highlights: [
                  {
                    name: "working_tree_changed",
                    hl_group: "DduSourceGitWorkingTreeChanged",
                    col: 1,
                    width: byteLength(fileStatus.path),
                  },
                ],
              });
              break;
          }

          switch (fileStatus.indexState) {
            case "unmodified":
            case "untracked":
              break;
            case "added":
              items.push({
                word: fileStatus.path,
                kind: "git_index",
                action: { path: fileStatus.path },
                highlights: [
                  {
                    name: "index_added",
                    hl_group: "DduSourceGitIndexAdded",
                    col: 1,
                    width: byteLength(fileStatus.path),
                  },
                ],
              });
              break;
            case "deleted":
              items.push({
                word: fileStatus.path,
                kind: "git_index",
                action: { path: fileStatus.path },
                highlights: [
                  {
                    name: "index_deleted",
                    hl_group: "DduSourceGitIndexDeleted",
                    col: 1,
                    width: byteLength(fileStatus.path),
                  },
                ],
              });
              break;
            case "renamed":
            case "copied":
              items.push({
                word: fileStatus.path,
                kind: "git_index",
                display: `${fileStatus.path} <- ${fileStatus.origPath}`,
                action: { path: fileStatus.path },
                highlights: [
                  {
                    name: "index_changed",
                    hl_group: "DduSourceGitIndexChanged",
                    col: 1,
                    width: byteLength(fileStatus.path),
                  },
                ],
              });
              break;
            case "updatedButUnmerged":
              break;
            default:
              items.push({
                word: fileStatus.path,
                kind: "git_index",
                action: { path: fileStatus.path },
                highlights: [
                  {
                    name: "index_changed",
                    hl_group: "DduSourceGitIndexChanged",
                    col: 1,
                    width: byteLength(fileStatus.path),
                  },
                ],
              });
          }
        });

        controller.enqueue(items);

        controller.close();
      },
    });
  }

  params(): Params {
    return {};
  }
}
