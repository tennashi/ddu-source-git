import {
  BaseFilter,
  DduItem,
  ItemHighlight,
} from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { FilterArguments } from "https://deno.land/x/ddu_vim@v2.5.0/base/filter.ts";

import { ActionData as GitWorkingTreeActionData } from "../@ddu-kinds/git_working_tree.ts";
import { ActionData as GitIndexActionData } from "../@ddu-kinds/git_index.ts";
import { ActionData as GitConflictedFileActionData } from "../@ddu-kinds/git_conflicted_file.ts";
import { FileStatus } from "../ddu-source-git/git_status/file_status.ts";

type Params = Record<never, never>;

const encoder = new TextEncoder();

function byteLength(input: string): number {
  return encoder.encode(input).length;
}

function toWorkingTreeHighlight(
  fileStatus: FileStatus,
): ItemHighlight | undefined {
  switch (fileStatus.workingTreeState) {
    case "unmodified":
    case "updatedButUnmerged":
      return;
    case "untracked":
      return {
        name: "working_tree_untracked",
        hl_group: "DduSourceGitWorkingTreeUntracked",
        col: 1,
        width: byteLength(fileStatus.path),
      };
    case "added":
      return {
        name: "working_tree_added",
        hl_group: "DduSourceGitWorkingTreeAdded",
        col: 1,
        width: byteLength(fileStatus.path),
      };
    case "deleted":
      return {
        name: "working_tree_deleted",
        hl_group: "DduSourceGitWorkingTreeDeleted",
        col: 1,
        width: byteLength(fileStatus.path),
      };
    case "renamed":
    case "copied":
      return {
        name: "working_tree_changed",
        hl_group: "DduSourceGitWorkingTreeChanged",
        col: 1,
        width: byteLength(fileStatus.path),
      };
    default:
      return {
        name: "working_tree_changed",
        hl_group: "DduSourceGitWorkingTreeChanged",
        col: 1,
        width: byteLength(fileStatus.path),
      };
  }
}

function toIndexHighlight(fileStatus: FileStatus): ItemHighlight | undefined {
  switch (fileStatus.indexState) {
    case "unmodified":
    case "untracked":
    case "updatedButUnmerged":
      return;
    case "added":
      return {
        name: "index_added",
        hl_group: "DduSourceGitIndexAdded",
        col: 1,
        width: byteLength(fileStatus.path),
      };
    case "deleted":
      return {
        name: "index_deleted",
        hl_group: "DduSourceGitIndexDeleted",
        col: 1,
        width: byteLength(fileStatus.path),
      };
    case "renamed":
    case "copied":
      return {
        name: "index_changed",
        hl_group: "DduSourceGitIndexChanged",
        col: 1,
        width: byteLength(fileStatus.path),
      };
    default:
      return {
        name: "index_changed",
        hl_group: "DduSourceGitIndexChanged",
        col: 1,
        width: byteLength(fileStatus.path),
      };
  }
}

function toConflictedFileHighlight(
  fileStatus: FileStatus,
): ItemHighlight | undefined {
  if (
    fileStatus.workingTreeState === "updatedButUnmerged" &&
    fileStatus.indexState === "updatedButUnmerged"
  ) {
    return {
      name: "conflicted",
      hl_group: "DduSourceGitConflicted",
      col: 1,
      width: byteLength(fileStatus.path),
    };
  }
}
export class Filter extends BaseFilter<Params> {
  filter(args: FilterArguments<Params>): Promise<DduItem[]> {
    return Promise.resolve(args.items.map((item: DduItem): DduItem => {
      const kind = item.kind || "git_index";
      switch (kind) {
        case "git_working_tree": {
          const action = item.action as GitWorkingTreeActionData;
          const highlight = toWorkingTreeHighlight(action.fileStatus);
          if (highlight) {
            item.highlights = [highlight];
          }
          break;
        }
        case "git_index": {
          const action = item.action as GitIndexActionData;
          const highlight = toIndexHighlight(action.fileStatus);
          if (highlight) {
            item.highlights = [highlight];
          }
          break;
        }
        case "git_conflicted_file": {
          const action = item.action as GitConflictedFileActionData;
          const highlight = toConflictedFileHighlight(action.fileStatus);
          if (highlight) {
            item.highlights = [highlight];
          }
          break;
        }
        default:
          break;
      }

      return item;
    }));
  }

  params(): Params {
    return {};
  }
}
