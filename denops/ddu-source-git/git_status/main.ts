import { Item } from "https://deno.land/x/ddu_vim@v3.2.7/types.ts";

import { runListCommand } from "../runner/main.ts";
import {
  parseFileStatus,
  toConflictedItem,
  toIndexItem,
  toWorkingTreeItem,
} from "./file_status.ts";

import { ActionData as GitWorkingTreeActionData } from "../../@ddu-kinds/git_working_tree.ts";
import { ActionData as GitIndexActionData } from "../../@ddu-kinds/git_index.ts";
import { ActionData as GitConflictedFileActionData } from "../../@ddu-kinds/git_conflicted_file.ts";

export type ActionData =
  | GitWorkingTreeActionData
  | GitIndexActionData
  | GitConflictedFileActionData;

export async function collectItems(
  repoDir: string,
): Promise<Item<ActionData>[]> {
  const result = await runListCommand(
    "git",
    ["status", "--porcelain"],
    repoDir,
  );

  const items: Item<ActionData>[] = [];
  result.forEach((line) => {
    const fileStatus = parseFileStatus(line);

    const conflictedItem = toConflictedItem(fileStatus);
    if (conflictedItem) {
      items.push(conflictedItem);
    }

    const workingTreeItem = toWorkingTreeItem(fileStatus);
    if (workingTreeItem) {
      items.push(workingTreeItem);
    }

    const indexItem = toIndexItem(fileStatus);
    if (indexItem) {
      items.push(indexItem);
    }
  });

  return items;
}
