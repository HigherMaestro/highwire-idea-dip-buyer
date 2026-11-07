import { highwire } from "./highwire.ts";

// The agent's own loop: the parts standing orders can't do. PRD.md's milestones say what goes here; until then it
// only checks that Highwire runs for this project's wallet.

const EVERY_HOURS = Number(process.env.AGENT_EVERY_HOURS ?? 6);

async function once(): Promise<void> {
  const r = await highwire(["wallet", "address"]);
  console.log(r.ok ? `Running for ${r.out}.` : `Highwire couldn't find the wallet: ${r.err || "run npm run setup first"}`);
}

async function main(): Promise<void> {
  const loop = process.argv.includes("--loop");
  do {
    await once();
    if (loop) await new Promise((done) => setTimeout(done, EVERY_HOURS * 3_600_000));
  } while (loop);
}

await main();
