import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { CLI, HOME, POLICY, ROOT, highwireEnv } from "./env.mjs";

// `npm run setup`: the agent's wallet and its starting policy, outside the repository. It never prints a key, never
// replaces a wallet or a policy that's already there, and refuses to run next to a keypair file in the repository.

/** Solana CLI keypair files: a JSON array of 64 bytes. */
function isKeypair(path) {
  try {
    if (statSync(path).size > 4096) return false;
    const v = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(v) && v.length === 64 && v.every((n) => Number.isInteger(n) && n >= 0 && n <= 255);
  } catch {
    return false;
  }
}

function keypairsIn(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) found.push(...keypairsIn(path));
    else if (name.endsWith(".json") && isKeypair(path)) found.push(path);
  }
  return found;
}

const inRepo = (p) => {
  const r = relative(ROOT, resolve(p));
  return r === "" || (!r.startsWith("..") && !r.startsWith(sep) && !/^[A-Za-z]:/.test(r));
};

if (inRepo(HOME)) {
  console.error(`HIGHWIRE_HOME (${HOME}) is inside this repository. Keep the wallet outside it, so it can never be committed.`);
  process.exit(1);
}
const keys = keypairsIn(ROOT);
if (keys.length) {
  console.error("Found what looks like a wallet key inside this repository, so setup stopped:");
  for (const k of keys) console.error(`  ${relative(ROOT, k)}`);
  console.error("Move it out of the repository (and out of its history, if it was ever committed), then run setup again.");
  process.exit(1);
}
if (!existsSync(CLI)) {
  console.error("Highwire isn't installed here yet: run `npm install` first.");
  process.exit(1);
}

mkdirSync(HOME, { recursive: true, mode: 0o700 });
const wallet = spawnSync(process.execPath, [CLI, "wallet", "new"], { stdio: "inherit", env: highwireEnv() });
if (wallet.status !== 0) process.exit(wallet.status ?? 1);

if (existsSync(POLICY)) {
  console.log(`Kept the policy already at ${POLICY}.`);
} else {
  copyFileSync(join(ROOT, "policy.example.json"), POLICY);
  console.log(`Wrote the starting policy to ${POLICY}: a dry run, so nothing is signed or sent until you set "live": true.`);
}
console.log(`
Next: open this repository in your coding agent and ask it to read PRD.md and build milestone 1.
The wallet, policy and audit log are in ${HOME}. Creating ${join(HOME, "STOP")} stops everything.`);
