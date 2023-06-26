import { Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";

import { ActionData } from "./main.ts";

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
      action: { fileStatus: fileStatus },
    };
  }
}

export function toWorkingTreeItem(
  fileStatus: FileStatus,
): Item<ActionData> | undefined {
  const item: Item<ActionData> = {
    word: fileStatus.path,
    kind: "git_working_tree",
    action: { fileStatus: fileStatus },
  };

  switch (fileStatus.workingTreeState) {
    case "unmodified":
    case "updatedButUnmerged":
      return;
    case "copied":
      item.display = `${fileStatus.path} <- ${fileStatus.origPath}`;
      break;
    default:
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
    action: { fileStatus: fileStatus },
  };

  switch (fileStatus.indexState) {
    case "unmodified":
    case "untracked":
    case "updatedButUnmerged":
      return;
    case "copied":
      item.display = `${fileStatus.path} <- ${fileStatus.origPath}`;
      break;
    default:
      break;
  }

  return item;
}
