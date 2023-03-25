const decoder = new TextDecoder();

export function runListCommand(
  cmd: string,
  args: string[],
  cwd: string,
): Promise<string[]> {
  return new Deno.Command(cmd, {
    args: args,
    cwd: cwd,
  }).output().then((result) =>
    decoder.decode(result.stdout).split(/\r?\n/).filter((line) =>
      line.length > 0
    )
  );
}
