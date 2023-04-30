import {
  BaseFilter,
  DduItem,
} from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { FilterArguments } from "https://deno.land/x/ddu_vim@v2.5.0/base/filter.ts";
import { ActionData as GitBranchActionData } from "../@ddu-kinds/git_branch.ts";
import { State } from "../ddu-source-git/cache/git_remote/main.ts";

type Params = Record<never, never>;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function byteLength(input: string): number {
  return encoder.encode(input).length;
}

function remoteStateMarker(state: State): string {
  switch (state) {
    case "pushable":
      return "↑";
    case "pullable":
      return "↓";
    case "pushableAndPullable":
      return "↑↓";
    case "equal":
      return "=";
  }
}

export class Filter extends BaseFilter<Params> {
  async filter(args: FilterArguments<Params>): Promise<DduItem[]> {
    const getCwdResult = await args.denops.call("getcwd");
    const cwd = getCwdResult as string;

    return args.items.map((item: DduItem): DduItem => {
      const kind = item.kind || "git_branch";
      switch (kind) {
        case "git_branch": {
          const action = item.action as GitBranchActionData;
          if (!action.isRemote) {
            if (!action.remoteState) {
              return item;
            }

            const stateMarker = remoteStateMarker(action.remoteState);

            item.display = `${item.display} [${stateMarker}]`;
          }
          break;
        }
        default:
          break;
      }

      return item;
    });
  }

  params(): Params {
    return {};
  }
}
