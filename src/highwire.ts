import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Highwire's command line, for the agent's own code: every command runs for this project's wallet, inside its policy.

// The project's .env, if there is one (SOLANA_RPC_URL, say): every command the agent runs inherits it.
const ENV_FILE = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

export const HOME = process.env.HIGHWIRE_HOME || join(homedir(), ".highwire", "dip-buyer");
const CLI = fileURLToPath(new URL("../node_modules/highwire-mcp/dist/cli.js", import.meta.url));

export interface Result {
  ok: boolean;
  /** The command's output: its JSON when it was asked for (`--json`), otherwise its text. */
  out: string;
  err: string;
}

/** Runs `highwire <args>`. Never throws for a refusal: `ok` is false and `err` says why. */
export function highwire(args: string[]): Promise<Result> {
  const wallet = join(HOME, "wallet.json");
  const env = { ...process.env, HIGHWIRE_HOME: HOME, ...(existsSync(wallet) ? { HIGHWIRE_KEYPAIR_PATH: wallet } : {}) };
  return new Promise((resolve) => {
    execFile(process.execPath, [CLI, ...args], { env, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ ok: !error, out: stdout.trim(), err: stderr.trim() });
    });
  });
}

/** Runs a command that takes `--json` and parses its result. */
export async function highwireJson<T = Record<string, unknown>>(args: string[]): Promise<{ ok: boolean; body: T | null; err: string }> {
  const r = await highwire([...args, "--json"]);
  let body: T | null = null;
  try {
    body = JSON.parse(r.out) as T;
  } catch {
    body = null;
  }
  return { ok: r.ok, body, err: r.err };
}
