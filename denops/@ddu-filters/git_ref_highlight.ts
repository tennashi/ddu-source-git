import {
  BaseFilter,
  DduItem,
} from "https://deno.land/x/ddu_vim@v3.2.7/types.ts";
import { FilterArguments } from "https://deno.land/x/ddu_vim@v3.2.7/base/filter.ts";
import { ActionData as GitBranchActionData } from "../@ddu-kinds/git_branch.ts";
import { ActionData as GitTagActionData } from "../@ddu-kinds/git_tag.ts";

type Params = Record<never, never>;

const encoder = new TextEncoder();

function byteLength(input: string): number {
  return encoder.encode(input).length;
}

export class Filter extends BaseFilter<Params> {
  filter(args: FilterArguments<Params>): Promise<DduItem[]> {
    return Promise.resolve(args.items.map((item: DduItem): DduItem => {
      const kind = item.kind || "git_branch";
      switch (kind) {
        case "git_branch": {
          const action = item.action as GitBranchActionData;
          if (action.isRemote) {
            item.highlights = [
              {
                name: "remote",
                hl_group: "Identifier",
                col: 1,
                width: byteLength(action.branch),
              },
            ];
          }
          break;
        }
        case "git_tag": {
          const action = item.action as GitTagActionData;
          item.highlights = [
            {
              name: "tag",
              hl_group: "Tag",
              col: 1,
              width: byteLength(action.tag),
            },
          ];
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
