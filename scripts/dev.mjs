// Runs the Vite dev server (web) and the Stripe donation API together, so the
// donate form always has something listening on http://localhost:4242.
//
// Usage: npm run dev
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const targets = [
  { label: "web", color: "\x1b[36m", script: "node_modules/vite/bin/vite.js" },
  { label: "api", color: "\x1b[35m", script: "server/server.js" },
];

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

for (const { label, color, script } of targets) {
  const child = spawn(process.execPath, [script], { cwd: root, env: process.env });
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
            ? "The API could not start: check STRIPE_SECRET_KEY in server/.env (sk_test_...)."
            : "The donation form will not work until the API is listening on port 4242 again.",
        ),
      );
    }

    if (alive.size === 0) shutdown(code ?? 0);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
