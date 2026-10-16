---
name: ui-ux-pro-max
description: "Use when designing, building, or refining this React community music band website's frontend, including page layouts, responsive design, accessibility, visual polish, and UI/UX reviews."
argument-hint: "Describe the page, component, or user experience to design or improve."
user-invocable: true
---

# UI/UX Pro Max

Design and implement clear, distinctive, accessible frontend experiences for the Community Music Band website. Prefer the site's established visual language and real user needs over generic layouts or decorative polish without purpose.

## Project Context

- The site is a React 19, TypeScript, and Vite app with React Router. Inspect its current files before assuming routes, dependencies, or patterns.
- The organization is a volunteer community band. Core visitor goals include understanding the band, finding programs and events, joining a rehearsal, and making a donation.
- The existing visual identity uses Archivo Black for display headings, Public Sans for body text, and design tokens in `src/index.css`: ink/navy, paper, brass, plume red, cards, borders, shadows, and a dark theme. Preserve these choices unless the requested design explicitly calls for a change.
- The app's styles may be split between global CSS and page/component styles. Check which styles are actually imported before editing; avoid styling the Vite starter shell if it is no longer used.

## Design Principles

- Start with the user's primary task and the content hierarchy. Make the next meaningful action easy to find without adding explanatory marketing copy or unnecessary sections.
- Make the experience feel musical, local, welcoming, and trustworthy. Use strong type, rhythm-inspired details, real relevant imagery where it serves the content, and restrained accent colors; avoid generic SaaS dashboards and template-like card piles.
- Keep page sections unframed and content-led. Use compact, consistent framing only for individual repeated items or genuinely separate tools such as the donation form.
- Reuse existing color, typography, spacing, radius, and shadow tokens. Prefer a page-scoped stylesheet for page-specific rules; add global tokens only when multiple components need them.
- Do not add dependencies, remote assets, or a new design system for a small visual improvement. Follow the repository's React and CSS patterns.

## Accessibility and Responsive Behavior

- Use semantic headings, landmarks, links, buttons, lists, labels, and form controls. Keep heading order logical and ensure every interactive control has an accessible name.
- Preserve visible keyboard focus, keyboard operation, readable contrast in both themes, and meaningful validation and status messages. Use live regions when asynchronous feedback needs to be announced.
- Ensure layouts reflow without horizontal scrolling on narrow screens. Check long text, navigation, forms, images, and card/grid items at mobile and desktop widths.
- Respect `prefers-reduced-motion`; animation must not carry essential information or delay interaction.
- Keep controls large and stable enough to use. Use familiar control types for actions, choices, and numeric input instead of decorative text pills.

## Workflow

1. Inspect the target route/component and its nearest styles, shared tokens, and existing interaction patterns. State the small set of files that need to change.
2. Implement the smallest coherent improvement that meets the user's request. Preserve unrelated edits and existing behavior; do not refactor neighboring pages just for consistency.
3. For forms, loading states, navigation, and other interactive features, account for disabled, error, success, focus, and empty states as appropriate.
4. Run a focused build, lint, or test after editing. For visible layout changes, inspect the page in a browser at desktop and mobile widths when those tools are available; correct overflow, overlap, unreadable contrast, or awkward wrapping.
5. Report what changed and which checks actually passed. Do not claim a visual or functional check was performed unless it was.

## Stripe and Donation UI

- Keep payment-provider UI usable with the current Stripe Elements integration. Preserve secure server/client boundaries and never expose secret keys or request real card data.
- Clearly communicate the selected amount, processing state, validation/payment errors, and confirmed test or payment status without presenting an unverified client redirect as settled fulfillment.
- Avoid changing payment logic while making a purely visual adjustment unless the user asks for the behavior change; test the checkout flow after any payment-related edit.