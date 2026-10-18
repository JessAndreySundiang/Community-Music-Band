import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * How long to wait before each retry sweep. The last value repeats, so a queue
 * left behind by a misconfiguration keeps retrying slowly until it is fixed
 * rather than giving up on somebody's gift.
 */
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000, 3_600_000, 21_600_000];

/**
 * Durable retry queue for donation alerts.
 *
 * By the time an alert is attempted the gift is already safe in the ledger, so
 * the alert is the only thing that can be lost. Anything that fails to send is
 * appended to a JSONL file and retried on a backoff instead of being dropped,
 * and start() sweeps whatever is still on disk after a restart. The queue drains
 * by itself once the underlying cause is fixed.
 */
export function createAlertQueue({
  file,
  deliver,
  logger = console,
  retryDelaysMs = RETRY_DELAYS_MS,
} = {}) {
  if (!file) throw new Error("createAlertQueue() needs a file path.");
  if (typeof deliver !== "function")
    throw new Error("createAlertQueue() needs a deliver function.");

  let waiting = [];
  let loaded = false;
  let timer = null;
  let round = 0;
  // Serialises rewrites so two alerts arriving together cannot interleave.
  let queue = Promise.resolve();

  async function load() {
    if (loaded) return;
    loaded = true;

    try {
      const text = await readFile(file, "utf8");
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          waiting.push(JSON.parse(trimmed));
        } catch {
          // A partially written trailing line is not fatal; skip it.
        }
      }
    } catch (err) {
      if (err.code !== "ENOENT") {
        logger.warn(`Could not read the pending-alert queue: ${err.message}`);
      }
    }
  }

  function save() {
    const run = queue.then(async () => {
      if (!waiting.length) {
        await rm(file, { force: true });
        return;
      }
      await mkdir(path.dirname(file), { recursive: true });
      // Write beside the target and rename, so a crash mid-write cannot destroy
      // alerts that are still waiting.
      const temp = `${file}.tmp`;
      await writeFile(
        temp,
        `${waiting.map((alert) => JSON.stringify(alert)).join("\n")}\n`,
        "utf8",
      );
      await rename(temp, file);
    });

    // Keep the chain alive even if this write fails.
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async function sweep() {
    if (!waiting.length) return 0;

    const stillWaiting = [];
    for (const alert of waiting) {
      try {
        await deliver(alert.entry, alert.options);
        logger.log(`Delivered the queued donation alert for ${alert.entry?.paymentIntentId}.`);
      } catch (err) {
        logger.warn(
          `Queued alert for ${alert.entry?.paymentIntentId} is still failing: ${err.message}`,
        );
        stillWaiting.push({
          ...alert,
          attempts: (alert.attempts ?? 0) + 1,
          lastError: err.message,
        });
      }
    }

    waiting = stillWaiting;
    await save();
    return waiting.length;
  }

  return {
    file,
    /** Alerts written to disk and not yet delivered. */
    get pending() {
      return waiting.length;
    },

    load,

    /** Delivers the alert now, or keeps it for a later retry. Never throws. */
    async notify(entry, options = {}) {
      await load();

      try {
        await deliver(entry, options);
        return true;
      } catch (err) {
        logger.error(
          `Could not email the donation alert for ${entry?.paymentIntentId}: ${err.message}`,
        );
        waiting.push({
          queuedAt: new Date().toISOString(),
          attempts: 0,
          lastError: err.message,
          entry,
          options,
        });
        try {
          await save();
          logger.warn(`Queued the alert for ${entry?.paymentIntentId}; ${waiting.length} waiting.`);
        } catch (saveErr) {
          logger.error(`Could not write the pending-alert queue: ${saveErr.message}`);
        }
        return false;
      }
    },

    /** Retries everything still waiting. Resolves to how many remain. */
    async retryPending() {
      await load();
      return sweep();
    },

    /** Loads the queue and keeps retrying on a backoff. Resolves once loaded. */
    async start() {
      await load();
      if (timer) return;

      const tick = async () => {
        const remaining = await sweep().catch((err) => {
          logger.error(`Pending-alert sweep failed: ${err.message}`);
          return 0;
        });
        const delay = retryDelaysMs[Math.min(round, retryDelaysMs.length - 1)];
        round = remaining > 0 ? round + 1 : 0;

        if (!timer) return; // stop() ran while this sweep was in flight.
        timer = setTimeout(tick, delay);
        timer.unref?.();
      };

      // Sweep as soon as the process is up, so a restart does not wait a minute.
      timer = setTimeout(tick, 0);
      timer.unref?.();
    },

    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}
