import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { HOME } from "./highwire.ts";

// Every Highwire tool, from code: the same MCP server a coding agent uses, started for this project's wallet. Execute
// tools (execute_trade, execute_claim, post_comment …) still pass the policy, and are dry runs until it's live.

const CLI = fileURLToPath(new URL("../node_modules/highwire-mcp/dist/cli.js", import.meta.url));

export interface ToolResult<T> {
  ok: boolean;
  /** The tool's JSON. On failure: `{error, code, next_step}`. */
  body: T;
}

export class Highwire {
  private constructor(private readonly client: Client) {}

  static async connect(): Promise<Highwire> {
    const wallet = join(HOME, "wallet.json");
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) if (v !== undefined) env[k] = v;
    env.HIGHWIRE_HOME = HOME;
    if (existsSync(wallet)) env.HIGHWIRE_KEYPAIR_PATH = wallet;
    const client = new Client({ name: "dip-buyer", version: "0" });
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [CLI], env, stderr: "ignore" }));
    return new Highwire(client);
  }

  /** Calls one tool. A refusal or error comes back with `ok: false`, never as a throw. */
  async call<T = Record<string, unknown>>(name: string, args: Record<string, unknown> = {}): Promise<ToolResult<T>> {
    const res = await this.client.callTool({ name, arguments: args });
    const text = (res.content as Array<{ type: string; text?: string }>)[0]?.text ?? "{}";
    return { ok: !res.isError, body: JSON.parse(text) as T };
  }

  close(): Promise<void> {
    return this.client.close();
  }
}
