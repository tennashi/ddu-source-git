import { dispatchCommand, runListCommand } from "../../runner/main.ts";

export type State = "pushable" | "pullable" | "equal" | "pushableAndPullable";

function parseState(raw: string): State {
  switch (raw) {
    case ">":
      return "pushable";
    case "<":
      return "pullable";
    case "=":
      return "equal";
    case "<>":
      return "pushableAndPullable";
    default:
      return "equal";
  }
}

export class Cache {
  #states: Record<string, State> = {};

  getState(branch: string, repoDir: string): State {
    this.fetchRemote(repoDir);
    return this.#states[branch];
  }

  private async fetchRemote(repoDir: string) {
    await dispatchCommand("git", ["fetch"], repoDir);
    const result = await runListCommand("git", [
      "branch",
      "--format=%(refname:short) %(upstream:trackshort)",
    ], repoDir);
    result.forEach((line) => {
      const branchName = line.slice(0, line.indexOf(" "));
      const state = line.slice(line.indexOf(" ") + 1);

      this.#states[branchName] = parseState(state);
    });
  }
}
