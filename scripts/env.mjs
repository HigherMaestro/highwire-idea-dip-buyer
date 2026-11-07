import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Where this agent's wallet, policy, audit log and orders live: outside the repository, one folder per project.
export const SLUG = "dip-buyer";
export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const HOME = process.env.HIGHWIRE_HOME || join(homedir(), ".highwire", SLUG);
export const WALLET = join(HOME, "wallet.json");
export const POLICY = join(HOME, "policy.json");

/** Highwire's command line, from this project's own install. */
export const CLI = fileURLToPath(new URL("../node_modules/highwire-mcp/dist/cli.js", import.meta.url));

/** The environment Highwire runs with: this agent's home, and its wallet once it exists. */
export function highwireEnv() {
  return { ...process.env, HIGHWIRE_HOME: HOME, ...(existsSync(WALLET) ? { HIGHWIRE_KEYPAIR_PATH: WALLET } : {}) };
}
