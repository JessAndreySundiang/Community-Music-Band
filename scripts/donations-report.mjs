// Summarises the donation ledger that the Stripe webhook writes.
//
//   npm run ledger
//
// Nothing here is exposed over HTTP: donor names and emails stay on the machine
// that runs the donation API.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = process.env.DONATIONS_FILE || path.join(root, "server", "data", "donations.jsonl");

let text;
try {
  text = await readFile(file, "utf8");
} catch (err) {
  if (err.code === "ENOENT") {
    console.log(`No ledger yet at ${file}`);
    console.log(
      "Completed gifts are written there by the Stripe webhook, which needs STRIPE_WEBHOOK_SECRET.",
    );
    process.exit(0);
  }
  throw err;
}

const entries = [];
for (const line of text.split("\n")) {
  if (!line.trim()) continue;
  try {
    entries.push(JSON.parse(line));
  } catch {
    // Ignore a torn final line from an interrupted write.
  }
}

const amountOf = (entry) =>
  Number.isFinite(Number(entry.amountUsd)) ? Number(entry.amountUsd) : 0;

// Totalled per currency rather than in whichever currency happened to be on the
// first line, so a mixed ledger shows two figures instead of one wrong one.
const byCurrency = new Map();
const byDonor = new Map();
for (const entry of entries) {
  const currency = String(entry.currency ?? "usd").toUpperCase();
  byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + amountOf(entry));

  // Grouped case-insensitively: Gmail treats Communitymusicband@ and
  // CommunityMusicBand@ as the same inbox, so one donor typing it twice is one
  // donor. The ledger itself keeps what was written; only this report merges.
  const who = entry.email || entry.donorName || "Unknown";
  const donorKey = who.toLowerCase();
  const donor = byDonor.get(donorKey);
  byDonor.set(donorKey, {
    who: donor?.who ?? who,
    amount: (donor?.amount ?? 0) + amountOf(entry),
  });
}

const totals = [...byCurrency].map(([currency, amount]) => `$${amount.toFixed(2)} ${currency}`);
console.log(`${entries.length} donation(s) totalling ${totals.join(" + ")}`);
console.log(`Ledger: ${file}\n`);

if (byDonor.size > 0) {
  console.log("By donor:");
  for (const { who, amount } of [...byDonor.values()].sort((a, b) => b.amount - a.amount)) {
    console.log(`  $${amount.toFixed(2)}  ${who}`);
  }
  console.log("\nMost recent:");
  for (const entry of entries.slice(-5).reverse()) {
    console.log(
      `  ${entry.recordedAt ?? "?"}  $${amountOf(entry).toFixed(2)}  ${entry.donorName ?? "Anonymous"}  ${entry.paymentIntentId ?? "?"}`,
    );
  }
}
