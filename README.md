# Community Music Band

React + TypeScript + Vite site for the Community Music Band, with a Stripe-powered donation flow.

- **Front end:** React 19, Vite, Tailwind CSS v4 (utility-first), React Router
- **Donation API:** a small Express server in `server/` that creates Stripe PaymentIntents
- **Design:** "Golden Hour at the Bandstand" — see `design-system/community-music-band/MASTER.md`

## Getting started

```bash
npm install
cd server && npm install && cd ..   # one-time: installs the donation API deps

cp .env.example .env                # then paste your Stripe *test* publishable key
cp server/.env.example server/.env  # then paste your Stripe *test* secret key

npm run dev                         # site on :5173, API on :4242
```

Both keys come from <https://dashboard.stripe.com/test/apikeys>. They must belong to the same
Stripe account, and test cards (e.g. `4242 4242 4242 4242`) only work in test mode.

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite (web) **and** the donation API together |
| `npm run dev:web` | Vite only |
| `npm run dev:api` | Donation API only |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over `src/`, `server/` and `scripts/` |
| `npm test` | Vitest (runs once) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run format` | Prettier, write |
| `npm run format:check` | Prettier, check only (what CI runs) |
| `npm run ledger` | Print a summary of recorded donations |

CI (`.github/workflows/ci.yml`) runs format check → lint → type-check → tests → build on every
push and pull request.

### Environment variables

| Variable | File | Purpose |
| --- | --- | --- |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `.env` | Stripe publishable key (`pk_test_...` or `pk_live_...`) used by the browser |
| `VITE_API_URL` | `.env` | Optional. Donation API base URL. Defaults to `http://localhost:4242` |
| `STRIPE_SECRET_KEY` | `server/.env` | Stripe secret key (`sk_test_...` or `sk_live_...`) used by the API — never expose this one |
| `STRIPE_WEBHOOK_SECRET` | `server/.env` | Optional. Signing secret for `/stripe-webhook`. Without it the API still takes donations, it just cannot record them |
| `PORT` | `server/.env` | Optional. API port. Defaults to `4242` |
| `CORS_ORIGINS` | `server/.env` | Optional. Extra comma-separated origins allowed to call the API |
| `TRUST_PROXY` | `server/.env` | Optional. How many proxy hops to believe, e.g. `1` behind nginx. Without it the API only ever sees the proxy's address, so every donor shares one rate-limit bucket |
| `DONATIONS_FILE` | `server/.env` | Optional. Where the donation ledger is written. Defaults to `server/data/donations.jsonl` |
| `GMAIL_USER` | `server/.env` | Optional. Google account that sends the donation alerts |
| `GMAIL_APP_PASSWORD` | `server/.env` | Optional. 16-character App Password for that account. Requires 2-Step Verification |
| `DONATION_NOTIFY_TO` | `server/.env` | Optional. Where alerts are sent. Defaults to `GMAIL_USER` |
| `SMTP_FALLBACK_HOST` | `server/.env` | Optional. A second free SMTP relay tried when Gmail fails. Setting this turns the fallback on |
| `SMTP_FALLBACK_PORT` | `server/.env` | Optional. Relay port. Defaults to `587` |
| `SMTP_FALLBACK_USER` / `SMTP_FALLBACK_PASSWORD` | `server/.env` | Optional. Relay credentials. Brevo's Login is a dedicated value like `9f3a2b1c@smtp-brevo.com`, not your account email; the password is the SMTP key |
| `SMTP_FALLBACK_FROM` | `server/.env` | Optional. Verified sender for the relay. Defaults to `GMAIL_USER` |
| `SMTP_FALLBACK_SECURE` | `server/.env` | Optional. `true` for port 465. Defaults to `false` (STARTTLS on 587) |
| `PENDING_ALERTS_FILE` | `server/.env` | Optional. Where undelivered alerts wait. Defaults to `server/data/pending-alerts.jsonl` |

Every `.env` file is git-ignored; copy the matching `.env.example` to create them.

The API accepts any `localhost`/`127.0.0.1` origin on any port, so donations keep working when Vite
falls back to `5174` because `5173` was already taken.

## How donations work

1. The browser posts an amount in cents to `POST /create-payment-intent` with an
   `Idempotency-Key` header derived from the donor's details, so a double-click or a retry cannot
   charge twice.
2. The API validates the amount (`$1`–`$1000`) and creates the PaymentIntent with Stripe. Card
   details go straight from the browser to Stripe — they never reach this server.
3. The browser confirms the card with Stripe and shows a receipt built from the amount **Stripe
   confirmed**, not the amount that was typed in.
4. Stripe calls `POST /stripe-webhook` on completion. The signature is verified against
   `STRIPE_WEBHOOK_SECRET` before anything is written to an append-only JSONL ledger at
   `server/data/donations.jsonl`, deduplicated by PaymentIntent id so Stripe's retries cannot
   double-count a gift.
5. If Gmail alerts are configured, that same verified webhook emails the band. The ledger's
   dedupe is what keeps it to one alert per gift, and anything the mailer cannot deliver is
   queued and retried rather than dropped.

### Recording donations locally

```bash
stripe listen --forward-to localhost:4242/stripe-webhook --events payment_intent.succeeded
```

Recent Stripe CLI versions refuse to start without an explicit event list (`--events`, or
`--all-snapshot`/`--all-thin` for everything). `payment_intent.succeeded` is the only event this API
records, so listing it keeps the output readable. The listener must stay running for gifts to be
recorded — the signing secret only lets the API verify deliveries, it does not pull them in.

Copy the `whsec_...` value it prints into `server/.env` as `STRIPE_WEBHOOK_SECRET` and restart the
API. `GET /health` reports `"webhooks": true` once it is wired up. Then:

```bash
npm run ledger
```

The API also exposes `GET /health` (shows the configured currency, limits, and whether the ledger
and webhook are active), logs every request, and rate-limits donation attempts per IP.

### Emailing the band when a gift lands

Optional. The API can email you whenever a donation is confirmed — sandbox gifts included, because
the API sends the mail itself rather than Stripe.

1. Turn on **2-Step Verification** for the Google account (<https://myaccount.google.com/security>).
   Google will not issue an App Password without it.
2. Create an **App Password** at <https://myaccount.google.com/apppasswords> and copy the 16
   characters.
3. Add to `server/.env`, then restart the API:

   ```
   GMAIL_USER=you@gmail.com
   GMAIL_APP_PASSWORD=thesixteenchars     # paste it without spaces
   DONATION_NOTIFY_TO=you@gmail.com       # optional, defaults to GMAIL_USER
   ```

`GET /health` reports `"mail": true` once it is wired up, `"pendingAlerts": 0` while nothing is
waiting, and the boot log prints `Donation alerts: Gmail -> you@gmail.com` (never the password).
To test the setup without waiting for a donation, run `npm run check-mail` inside `server/` — it
prints what is configured, asks each transport to log in without sending anything, and reports the
provider's own words when one refuses. `npm run check-mail -- --send` delivers a real test alert.

The alert is driven by the webhook, so it needs `stripe listen` running locally, or a registered
endpoint in production — the signing secret alone does not deliver anything. A retried event never
sends a second email, because the alert is tied to the ledger's first-time record. If the mailer
cannot send, the alert is queued and retried rather than dropped, and the webhook still answers
`200`: answering with an error would only make Stripe replay an event that the dedupe then skips,
losing the alert for good.

Each alert comes from the sending account — `GMAIL_USER`, or `SMTP_FALLBACK_FROM` when a relay is
doing the sending — with `Reply-To` set to the donor, so replying thanks them directly. Sandbox
donations are prefixed `[TEST]` in the subject, since Stripe marks every test object with
`livemode: false`. Note that a personal Gmail account allows roughly 500 messages a day, and that mail
sent to donors from a personal address is more likely to be filed as promotions than mail sent from
your own address to yourself.

#### When the mail cannot go out

A gift is already safe in the ledger before an alert is attempted, so the alert is the only thing
that could be lost. Two layers stop that happening, and both are free.

**1. The retry queue — no setup at all.** Anything the mailer cannot deliver is written to
`server/data/pending-alerts.jsonl` and retried on a backoff: 1 minute, 5, 15, 1 hour, then every
6 hours. Each entry counts its attempts and keeps the last error, the queue is swept again on every
start, and it drains by itself once the cause is fixed. So a network blip, Gmail throttling, a
timeout or a restart mid-send delays an alert instead of losing it. `GET /health` shows the depth as
`pendingAlerts`, and the boot log names how many it is retrying. A queue that never drains means the
credentials are wrong — which is exactly the signal worth having.

**2. A relay — one free account, and it can be the only sender.** Any plain SMTP relay works; if no
Gmail account is configured at all, the relay simply becomes the sender:

| Provider | Free allowance | SMTP settings |
| --- | --- | --- |
| Brevo | 300/day, no time limit, no card | `smtp-relay.brevo.com`, port `587`, `SMTP_FALLBACK_SECURE=false` |
| Mailjet | 200/day (6,000/month) | `in-v3.mailjet.com`, port `587`, `SMTP_FALLBACK_SECURE=false` |

Brevo is what this project runs on, and three things there catch people out:

- **Use the Login shown on the SMTP page, not your account email.** Brevo issues a dedicated login such
  as `9f3a2b1c@smtp-brevo.com`, and the wrong value is refused with a generic `535 Authentication
  failed` — which deliberately hides whether the login or the key was at fault.
- **Mind the IP allowlist.** Brevo blocks unknown IP addresses by default on accounts created after
  16 May 2024, answering `525 5.7.1 Unauthorized IP address`. Authorise the sending machine under
  Settings → Security → Authorized IPs, or turn the blocking off. A deployed server has a different
  outbound IP and needs the same treatment, or alerts stop while quietly waiting in the queue.
- **The key is the SMTP key** (Settings → SMTP & API → SMTP) — not the API key, not the account
  password — and the sender address must be verified under Senders.

Gmail SMTP needs an App Password, which Google withholds or makes awkward on some new accounts, so a
relay-only setup is often the calmer choice. Confirm whichever you pick with `npm run check-mail`
inside `server/`: it prints what is configured, asks every transport to log in without sending
anything, and `npm run check-mail -- --send` delivers a real test alert.

Neither layer can invent a working channel: if every transport fails *and* nothing is configured,
the alert waits on disk instead of arriving. The honest summary is that the queue removes transient
failures as a concern, and the relay removes a Gmail outage as a concern.

## Testing

```bash
npm test
```

Vitest runs two suites with no extra test dependencies: server tests that boot the real app on an
ephemeral port and drive it over HTTP (amount parsing, rate limiting, CORS, the webhook with a real
Stripe signature, the ledger, the donation alert, its retry queue and its transport failover), and
unit tests for the client-side amount formatting and idempotency key.

The webhook tests inject a fake alert pipeline and the alert message is built as plain data, so the
suite needs no Gmail credentials and never opens an SMTP connection.

## Project layout

```
src/            React app (pages, components, theme tokens, typed data)
server/         Express + Stripe donation API (port 4242)
scripts/        dev server runner and the donation report
public/         static assets (favicon, social card, robots.txt, sitemap.xml)
design-system/  the design system the UI follows
```

## Before you deploy

- **Set your real domain.** `communitymusicband.example` is a placeholder in `index.html`
  (canonical, Open Graph, JSON-LD), `public/robots.txt` and `public/sitemap.xml`. Replace it in all
  three, then swap `og-image.jpg` for a fresh card if the tagline changes.
- **Add the real social URLs.** `src/data/landing.ts` currently points the footer icons at each
  platform's home page.
- Build with `npm run build` and serve `dist/`. Because this is a single-page app, configure your
  host to fall back to `index.html` for unknown paths, or refresh on `/about` will 404.
- Set `CORS_ORIGINS` to your live origin and use **live** Stripe keys (`pk_live_`/`sk_live_`).
  Stripe requires HTTPS for live payments. Both key kinds are accepted: with a live key the API
  prints a warning instead of refusing to start, and alert subjects lose their `[TEST]` prefix.
- **Set `TRUST_PROXY` if anything sits in front of the API.** Behind nginx, Apache or a platform
  router, `req.ip` is the proxy's address, so the donation rate limit would count every donor as
  one client and one busy visitor could throttle everybody. `TRUST_PROXY=1` means one hop.
- **Donation alerts** need a real webhook endpoint in the Stripe dashboard instead of
  `stripe listen`. Keep `GMAIL_APP_PASSWORD` out of the repo: GitHub's push protection does not
  recognise a 16-character Google App Password, so `.gitignore` is the only thing keeping it out.
- Serve the site over HTTPS — Stripe.js refuses live keys on plain HTTP.

## Accessibility

The UI targets WCAG 2.1 AA: token-driven light/dark themes with verified contrast, visible focus
outlines everywhere, a skip link, keyboard-only operation (including the mobile menu, which is
removed from the tab order with `inert` when closed), and `prefers-reduced-motion` support. The
donation form's success message is announced through an `aria-live` region.
