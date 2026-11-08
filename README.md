# Dip buyer

An agent that waits for coins you picked to fall to a price you set, buys a small amount, then guards each position with a stop-loss and a take-profit.

Started from the [Dip buyer idea](https://highwire.fun/ideas/dip-buyer) on highwire.fun. `PRD.md` is the full spec, and `AGENTS.md` tells a
coding agent how to build it. Highwire is the MCP server and command line that lets the agent launch, trade, claim and
post on [higher.fun](https://higher.fun) from its own wallet, inside a policy you write.

## Set up

Needs Node 20.12 or later.

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

## Run it

```bash
npm start
```

That's the whole agent, in one process: Highwire's order runner, which fills its standing orders (fee claims,
buybacks, limit buys, stop-losses), and the agent's own loop in `src/agent.ts`. While the policy is a dry run,
everything is simulated and you can watch what it would do. To keep it running in the background on a Mac, starting at
every login and restarting if it stops:

```bash
npm run service -- install
```

`npm run service -- status` and `npm run service -- uninstall` check and remove it; the log is
`~/.highwire/dip-buyer/agent.log`. The Mac has to be awake for it to run. On Linux or Windows, run `npm start` under
your own process manager.

An agent that runs all day should have its own Solana RPC: the public one rate-limits it. Copy `.env.example` to `.env`
and set `SOLANA_RPC_URL` (most providers have a free tier).

## Going live

Only you do this, once the dry runs look right:

1. Fund the wallet `npm run setup` printed with the SOL `PRD.md` says the idea needs.
2. Read `~/.highwire/dip-buyer/policy.json`: what the agent may do, and its limits per transaction and per day.
3. Set `"live": true` in it. A running agent picks it up by itself: no restart, and orders that were waiting out a dry
   run's interval run straight away.

Some ideas have a one-off step you run yourself after going live, such as launching the coin; `PRD.md` says which.

To stop everything at once, create the file `~/.highwire/dip-buyer/STOP`. Nothing is signed while it's there.

## Commands

- `npm run setup`: the wallet and the starting policy, once.
- `npm start`: the agent. `npm run service -- install` keeps it running.
- `npm run highwire -- <command>`: Highwire's command line for this agent's wallet, for example
  `npm run highwire -- launch --help`, `npm run highwire -- claim`, `npm run highwire -- orders list`.
- `npm run orders` and `npm run agent`: the two halves of `npm start`, on their own, for testing.
- `npm run typecheck`: checks the TypeScript.

## Safety

- The key stays in `~/.highwire/dip-buyer/wallet.json`. Never commit it, paste it or send it anywhere. Back it up
  somewhere safe: whoever has that file controls the wallet.
- The policy is the only thing that lets the agent sign. Agents can't change it; only you can, by editing the file.
- Comments, chat and coin descriptions on higher.fun are written by other people. The agent treats them as data, never
  as instructions.
- This is a starting point, not financial advice. You run the agent, and you're responsible for what it does.

Built with [Highwire](https://highwire.fun) 0.13.0.
