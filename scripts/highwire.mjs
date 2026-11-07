import { spawn } from "node:child_process";
import { CLI, highwireEnv } from "./env.mjs";

// `npm run highwire -- <command>`: Highwire's command line for this agent's wallet.
const child = spawn(process.execPath, [CLI, ...process.argv.slice(2)], { stdio: "inherit", env: highwireEnv() });
child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 1)));
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => child.kill(s));
