import {
  BaseFilter,
  DduItem,
} from "https://deno.land/x/ddu_vim@v2.4.0/types.ts";
import { FilterArguments } from "https://deno.land/x/ddu_vim@v2.4.0/base/filter.ts";
import { ActionData as GitBranchActionData } from "../@ddu-kinds/git_branch.ts";

type Params = Record<never, never>;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function byteLength(input: string): number {
  return encoder.encode(input).length;
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
            const cmd = new Deno.Command("git", {
              args: [
                "rev-parse",
                "--abbrev-ref",
                `${action.branch}@{upstream}`,
              ],
              cwd: cwd,
            });

            const result = cmd.outputSync();
            const stdout = decoder.decode(result.stdout);
            const upstreamBranch = stdout.trim();

            if (upstreamBranch !== "") {
              item.display = `${action.branch} -> ${upstreamBranch}`;
              item.highlights = [
                {
                  name: "upstream",
                  hl_group: "Identifier",
                  col: byteLength(`${action.branch} -> `) + 1,
                  width: byteLength(upstreamBranch),
                },
              ];
            }
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
