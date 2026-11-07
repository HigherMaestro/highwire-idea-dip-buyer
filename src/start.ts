import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { HOME } from "./highwire.ts";

// `npm start`: the whole agent, in one process. It runs Highwire's order runner, which fills the standing orders
// (fee claims, buybacks, limit buys, stop-losses), and the agent's own loop, `src/agent.ts --loop`. If either stops,
// both stop, so `npm run service` (or any process manager) restarts them together. The policy decides what's real:
// while it's a dry run everything is simulated, and once the user sets "live": true the same process acts, with a
// dry run's timed orders running straight away. Nothing here writes the policy.

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const POLICY = join(HOME, "policy.json");
const log = (s: string) => console.log(`${new Date().toISOString().slice(0, 19)}Z  ${s}`);

if (!existsSync(join(HOME, "wallet.json")) || !existsSync(POLICY)) {
  log(`No wallet or policy in ${HOME} yet: run \`npm run setup\` first.`);
  process.exit(1);
}
let live = false;
try {
  live = (JSON.parse(readFileSync(POLICY, "utf8")) as { live?: boolean }).live === true;
} catch {
  // Highwire's own commands say what's wrong with the policy.
}
log(live ? "The policy is live: orders fill and the agent acts." : `The policy is a dry run: everything is simulated until you set "live": true in ${POLICY}.`);
if (!process.env.SOLANA_RPC_URL) log("Using Solana's public RPC, which rate-limits busy agents. Put SOLANA_RPC_URL in .env for a steadier one.");

const children: ChildProcess[] = [
  spawn(process.execPath, [join(ROOT, "scripts/highwire.mjs"), "orders", "run"], { cwd: ROOT, stdio: "inherit" }),
  spawn(join(ROOT, "node_modules/.bin/tsx"), [join(ROOT, "src/agent.ts"), "--loop"], { cwd: ROOT, stdio: "inherit" }),
];
for (const c of children) {
  c.on("exit", (code) => {
    for (const other of children) if (other !== c && other.exitCode === null) other.kill("SIGTERM");
    process.exitCode = code ?? 1;
  });
}
for (const s of ["SIGINT", "SIGTERM"] as const) process.on(s, () => children.forEach((c) => c.kill(s)));
