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
  #repoDir: string;
  #onUpdated = () => {};

  constructor(repoDir: string, onUpdated: () => void) {
    this.#repoDir = repoDir;
    this.#onUpdated = onUpdated;
    this.fetchRemote();
  }

  getState(branch: string): State {
    return this.#states[branch];
  }

  async fetchRemote() {
    await dispatchCommand("git", ["fetch"], this.#repoDir);
    const result = await runListCommand("git", [
      "branch",
      "--format=%(refname:short) %(upstream:trackshort)",
    ], this.#repoDir);
    result.forEach((line) => {
      const branchName = line.slice(0, line.indexOf(" "));
      const state = line.slice(line.indexOf(" ") + 1);

      this.#states[branchName] = parseState(state);
    });

    this.#onUpdated();
  }
}
