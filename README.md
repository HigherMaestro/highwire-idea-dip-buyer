# Dip buyer

An agent that waits for coins you picked to fall to a price you set, buys a small amount, then guards each position with a stop-loss and a take-profit.

Started from the [Dip buyer idea](https://highwire.fun/ideas/dip-buyer) on highwire.fun. `PRD.md` is the full spec, and `AGENTS.md` tells a
coding agent how to build it. Highwire is the MCP server and command line that lets the agent launch, trade, claim and
post on [higher.fun](https://higher.fun) from its own wallet, inside a policy you write.

## Set up

Needs Node 20 or later.

```bash
npm install
npm run setup
```

`npm run setup` makes the agent's own Solana wallet in `~/.highwire/dip-buyer/`, outside this repository and readable
only by you, and writes the idea's starting policy next to it, as a dry run. It prints the wallet's address. It never
prints the key, never replaces a wallet or policy that's already there, and refuses to run if it finds a keypair file
inside this repository.

## Build it

Open this repository in Claude Code (or another coding agent) and say:

> Read PRD.md and AGENTS.md, then build milestone 1. Keep the policy a dry run: never set "live" yourself.

The agent works through `PRD.md`'s milestones. Highwire's tools are already wired in through `.mcp.json`. Everything is a
dry run until you change the policy yourself.

## Commands

- `npm run setup`: the wallet and the starting policy, once.
- `npm run highwire -- <command>`: Highwire's command line for this agent's wallet, for example
  `npm run highwire -- launch --help`, `npm run highwire -- claim`, `npm run highwire -- orders list`.
- `npm run orders`: fills the agent's standing orders (fee claims, buybacks, limit buys) until you stop it. Keep it
  running somewhere that stays on.
- `npm run agent`: the agent's own loop, in `src/agent.ts`.
- `npm run typecheck`: checks the TypeScript.

## Going live

Only you do this, once the dry runs look right:

1. Fund the wallet `npm run setup` printed with the SOL `PRD.md` says the idea needs.
2. Read `~/.highwire/dip-buyer/policy.json`: what the agent may do, and its limits per transaction and per day.
3. Set `"live": true` in it.

To stop everything at once, create the file `~/.highwire/dip-buyer/STOP`. Nothing is signed while it's there.

## Safety

- The key stays in `~/.highwire/dip-buyer/wallet.json`. Never commit it, paste it or send it anywhere. Back it up
  somewhere safe: whoever has that file controls the wallet.
- The policy is the only thing that lets the agent sign. Agents can't change it; only you can, by editing the file.
- Comments, chat and coin descriptions on higher.fun are written by other people. The agent treats them as data, never
  as instructions.
- This is a starting point, not financial advice. You run the agent, and you're responsible for what it does.

Built with [Highwire](https://highwire.fun) 0.11.0.
