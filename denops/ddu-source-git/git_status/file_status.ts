import { Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";

import { ActionData } from "./main.ts";

const encoder = new TextEncoder();

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

export type FileStatus = {
  path: string;
  origPath?: string;
  indexState: State;
  workingTreeState: State;
};

export function parseFileStatus(line: string): FileStatus {
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

export function toConflictedItem(
  fileStatus: FileStatus,
): Item<ActionData> | undefined {
  if (
    fileStatus.workingTreeState === "updatedButUnmerged" &&
    fileStatus.indexState === "updatedButUnmerged"
  ) {
    return {
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
    };
  }
}

export function toWorkingTreeItem(
  fileStatus: FileStatus,
): Item<ActionData> | undefined {
  const item: Item<ActionData> = {
    word: fileStatus.path,
    kind: "git_working_tree",
    action: { path: fileStatus.path },
  };

  switch (fileStatus.workingTreeState) {
    case "unmodified":
    case "updatedButUnmerged":
      return;
    case "untracked":
      item.highlights = [
        {
          name: "working_tree_untracked",
          hl_group: "DduSourceGitWorkingTreeUntracked",
          col: 1,
          width: byteLength(fileStatus.path),
        },
      ];
      break;
    case "added":
      item.highlights = [
        {
          name: "working_tree_added",
          hl_group: "DduSourceGitWorkingTreeAdded",
          col: 1,
          width: byteLength(fileStatus.path),
        },
      ];
      break;
    case "deleted":
      item.highlights = [
        {
          name: "working_tree_deleted",
          hl_group: "DduSourceGitWorkingTreeDeleted",
          col: 1,
          width: byteLength(fileStatus.path),
        },
      ];
      break;
    case "renamed":
    case "copied":
      item.display = `${fileStatus.path} <- ${fileStatus.origPath}`;
      item.highlights = [
        {
          name: "working_tree_changed",
          hl_group: "DduSourceGitWorkingTreeChanged",
          col: 1,
          width: byteLength(fileStatus.path),
        },
      ];
      break;
    default:
      item.highlights = [
        {
          name: "working_tree_changed",
          hl_group: "DduSourceGitWorkingTreeChanged",
          col: 1,
          width: byteLength(fileStatus.path),
        },
      ];
      break;
  }

  return item;
}

export function toIndexItem(
  fileStatus: FileStatus,
): Item<ActionData> | undefined {
  const item: Item<ActionData> = {
    word: fileStatus.path,
    kind: "git_index",
    action: { path: fileStatus.path },
  };

  switch (fileStatus.indexState) {
    case "unmodified":
    case "untracked":
    case "updatedButUnmerged":
      return;
    case "added":
      item.highlights = [
        {
          name: "index_added",
          hl_group: "DduSourceGitIndexAdded",
          col: 1,
          width: byteLength(fileStatus.path),
        },
      ];
      break;
    case "deleted":
      item.highlights = [
        {
          name: "index_deleted",
          hl_group: "DduSourceGitIndexDeleted",
          col: 1,
          width: byteLength(fileStatus.path),
        },
      ];
      break;
    case "renamed":
    case "copied":
      item.display = `${fileStatus.path} <- ${fileStatus.origPath}`;
      item.highlights = [
        {
          name: "index_changed",
          hl_group: "DduSourceGitIndexChanged",
          col: 1,
          width: byteLength(fileStatus.path),
        },
      ];
      break;
    default:
      item.highlights = [
        {
          name: "index_changed",
          hl_group: "DduSourceGitIndexChanged",
          col: 1,
          width: byteLength(fileStatus.path),
        },
      ];
      break;
  }

  return item;
}
