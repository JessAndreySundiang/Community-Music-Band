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
| `VITE_STRIPE_PUBLISHABLE_KEY` | `.env` | Stripe publishable key (`pk_test_...`) used by the browser |
| `VITE_API_URL` | `.env` | Optional. Donation API base URL. Defaults to `http://localhost:4242` |
| `STRIPE_SECRET_KEY` | `server/.env` | Stripe secret key (`sk_test_...`) used by the API — never expose this one |
| `STRIPE_WEBHOOK_SECRET` | `server/.env` | Optional. Signing secret for `/stripe-webhook`. Without it the API still takes donations, it just cannot record them |
| `PORT` | `server/.env` | Optional. API port. Defaults to `4242` |
| `CORS_ORIGINS` | `server/.env` | Optional. Extra comma-separated origins allowed to call the API |
| `DONATIONS_FILE` | `server/.env` | Optional. Where the donation ledger is written. Defaults to `server/data/donations.jsonl` |

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

## Testing

```bash
npm test
```

Vitest runs two suites with no extra test dependencies: server tests that boot the real app on an
ephemeral port and drive it over HTTP (amount parsing, rate limiting, CORS, the webhook with a real
Stripe signature, and the ledger), and unit tests for the client-side amount formatting and
idempotency key.

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
  Stripe requires HTTPS for live payments.
- Serve the site over HTTPS — Stripe.js refuses live keys on plain HTTP.

## Accessibility

The UI targets WCAG 2.1 AA: token-driven light/dark themes with verified contrast, visible focus
outlines everywhere, a skip link, keyboard-only operation (including the mobile menu, which is
removed from the tab order with `inert` when closed), and `prefers-reduced-motion` support. The
donation form's success message is announced through an `aria-live` region.
