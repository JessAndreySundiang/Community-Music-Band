import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Append-only donation ledger.
 *
 * One JSON object per line (JSON Lines) keeps this dependency-free, human
 * readable, and safe to append from a single process. Stripe retries failed
 * webhooks, so an already-seen PaymentIntent id is never written twice.
 */
export function createDonationStore({ file, logger = console } = {}) {
  if (!file) throw new Error("createDonationStore() needs a file path.");

  const seen = new Set();
  let loaded = null;
  // Serialises writes so two webhooks arriving together cannot interleave.
  let queue = Promise.resolve();

  async function loadIds() {
    try {
      const text = await readFile(file, "utf8");
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const entry = JSON.parse(trimmed);
          if (entry?.paymentIntentId) seen.add(entry.paymentIntentId);
        } catch {
          // A partially written trailing line is not fatal; skip it.
        }
      }
    } catch (err) {
      if (err.code !== "ENOENT") {
        logger.warn(`Could not read the donation ledger: ${err.message}`);
      }
    }
  }

  async function write(entry) {
    loaded ??= loadIds();
    await loaded;

    if (entry.paymentIntentId && seen.has(entry.paymentIntentId)) return false;

    await mkdir(path.dirname(file), { recursive: true });
    await appendFile(file, `${JSON.stringify(entry)}\n`, "utf8");
    if (entry.paymentIntentId) seen.add(entry.paymentIntentId);
    return true;
  }

  return {
    file,
    /** Appends a donation. Resolves false when it was already recorded. */
    record(entry) {
      const run = queue.then(() => write(entry));
      // Keep the queue alive even if this write fails.
      queue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  };
}
