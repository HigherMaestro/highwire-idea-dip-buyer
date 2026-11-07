import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { HOME, ROOT, SLUG } from "./env.mjs";

// `npm run service -- install|uninstall|status`: runs `npm start` in the background on a Mac, through launchd, so it
// starts at login and restarts if it stops. The Mac has to be awake for it to run; its log is agent.log next to the
// wallet. On Linux or Windows, run `npm start` under your own process manager (systemd, pm2) instead.

const LABEL = `fun.highwire.${SLUG}`;
const PLIST = join(homedir(), "Library", "LaunchAgents", `${LABEL}.plist`);
const LOG = join(HOME, "agent.log");
const domain = `gui/${process.getuid?.()}`;
const launchctl = (...args) => spawnSync("launchctl", args, { encoding: "utf8" });
const xml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

if (process.platform !== "darwin") {
  console.error("This sets up a launchd service, which only macOS has. Run `npm start` under your own process manager.");
  process.exit(1);
}

const command = process.argv[2];
if (command === "install") {
  if (!existsSync(join(HOME, "wallet.json"))) {
    console.error("Run `npm run setup` first: there's no wallet to run for yet.");
    process.exit(1);
  }
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xml(join(ROOT, "node_modules", ".bin", "tsx"))}</string>
    <string>${xml(join(ROOT, "src", "start.ts"))}</string>
  </array>
  <key>WorkingDirectory</key><string>${xml(ROOT)}</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>${xml(`${join(process.execPath, "..")}:/usr/bin:/bin`)}</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>60</integer>
  <key>StandardOutPath</key><string>${xml(LOG)}</string>
  <key>StandardErrorPath</key><string>${xml(LOG)}</string>
</dict>
</plist>
`;
  mkdirSync(join(homedir(), "Library", "LaunchAgents"), { recursive: true });
  launchctl("bootout", `${domain}/${LABEL}`);
  writeFileSync(PLIST, plist);
  const r = launchctl("bootstrap", domain, PLIST);
  if (r.status !== 0) {
    console.error(`launchctl couldn't start it: ${r.stderr.trim()}`);
    process.exit(1);
  }
  console.log(`Running in the background, and at every login. Log: ${LOG}`);
  console.log(`It follows the policy in ${join(HOME, "policy.json")}: a dry run until you set "live": true.`);
} else if (command === "uninstall") {
  launchctl("bootout", `${domain}/${LABEL}`);
  if (existsSync(PLIST)) rmSync(PLIST);
  console.log("Stopped, and it won't start at login any more.");
} else if (command === "status") {
  const r = launchctl("print", `${domain}/${LABEL}`);
  console.log(r.status === 0 ? `Installed. ${/state = (\w+)/.exec(r.stdout)?.[0] ?? ""}. Log: ${LOG}` : "Not installed.");
} else {
  console.error("Usage: npm run service -- install | uninstall | status");
  process.exit(2);
}
