// Runs the Vite dev server (web), the Stripe donation API, and the Stripe CLI
// forwarder together, so the donate form always has something listening on
// http://localhost:4242 AND a completed donation can actually reach the API.
//
// Usage: npm run dev
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Locates the Stripe CLI, using the same plain spawn that starts it below so a
 * successful probe really does mean a successful start. Returns null when the
 * CLI is not installed, because the site, the API and the donate form all work
 * without it — only recording a donation and emailing the band need it.
 */
function findStripeCli() {
  try {
    const probe = spawnSync("stripe", ["--version"], { encoding: "utf8" });
    return probe.status === 0 ? "stripe" : null;
  } catch {
    return null;
  }
}

const targets = [
  {
    label: "web",
    color: "\x1b[36m",
    command: process.execPath,
    args: ["node_modules/vite/bin/vite.js"],
  },
  { label: "api", color: "\x1b[35m", command: process.execPath, args: ["server/server.js"] },
];

const stripeCli = findStripeCli();

if (stripeCli) {
  // Stripe never calls the API directly in development: the CLI forwards each
  // event. Without this a donation succeeds at Stripe, but the API never hears
  // about it, so nothing is recorded and the band gets no email.
  targets.push({
    label: "stripe",
    color: "\x1b[33m",
    command: stripeCli,
    args: [
      "listen",
      "--forward-to",
      "localhost:4242/stripe-webhook",
      "--events",
      "payment_intent.succeeded",
    ],
    // A missing login or an expired CLI must not take the whole dev run down.
    optional: true,
  });
} else {
  const prefix = "\x1b[33m[stripe]\x1b[0m";
  console.log(`${prefix} The Stripe CLI was not found, so donations will not be recorded`);
  console.log(`${prefix} and no donation email will be sent. Install it, then restart:`);
  console.log(
    `${prefix}   stripe listen --forward-to localhost:4242/stripe-webhook --events payment_intent.succeeded`,
  );
}

// Exit code 1 from server/server.js means it rejected its configuration.
const CONFIG_ERROR = 1;

const alive = new Set();
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of alive) child.kill();
  process.exit(code);
}

for (const { label, color, command, args, optional } of targets) {
  const child = spawn(command, args, { cwd: root, env: process.env });
  alive.add(child);

  const prefix = (line) => `${color}[${label}]\x1b[0m ${line}`;

  for (const stream of [child.stdout, child.stderr]) {
    let buffer = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) console.log(prefix(line));
    });
  }

  child.on("error", (err) => {
    console.log(prefix(`could not start: ${err.message}`));
  });

  child.on("exit", (code) => {
    alive.delete(child);

    // Stopping on purpose (Ctrl+C or a sibling shutting down) is not a failure.
    // A killed process reports -1, which must not be mistaken for exit code 1.
    if (shuttingDown) return;

    if (code === 0) {
      console.log(prefix("stopped"));
    } else {
      console.log(prefix(`stopped unexpectedly (exit code ${code ?? "unknown"})`));
    }

    if (label === "api") {
      console.log(
        prefix(
          code === CONFIG_ERROR
            ? "The API could not start: check STRIPE_SECRET_KEY in server/.env (sk_test_... or sk_live_...)."
            : "The donation form will not work until the API is listening on port 4242 again.",
        ),
      );
    }

    if (optional) {
      console.log(
        prefix(
          "Donations will still go through at Stripe, but they will not be recorded and no email will be sent.",
        ),
      );
      console.log(prefix("Try: stripe login   then restart npm run dev."));
    }

    if (alive.size === 0) shutdown(code ?? 0);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
