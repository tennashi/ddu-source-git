const decoder = new TextDecoder();

export async function runListCommand(
  cmd: string,
  args: string[],
  cwd: string,
  env?: Record<string, string>,
): Promise<string[]> {
  return await new Deno.Command(cmd, {
    args: args,
    cwd: cwd,
    env: env,
  }).output().then((result) =>
    decoder.decode(result.stdout).split(/\r?\n/).filter((line) =>
      line.length > 0
    )
  );
}

export async function runGetCommand(
  cmd: string,
  args: string[],
  cwd: string,
  env?: Record<string, string>,
): Promise<string> {
  return await new Deno.Command(cmd, { args: args, cwd: cwd, env: env })
    .output()
    .then((result) => decoder.decode(result.stdout));
}

export async function dispatchCommand(
  cmd: string,
  args: string[],
  cwd: string,
  env?: Record<string, string>,
): Promise<void> {
  return await new Deno.Command(cmd, {
    args: args,
    cwd: cwd,
    env: env,
  }).output().then();
}
