import { contact } from "./landing";

/**
 * Plain-language policy pages. Written to describe what this site actually
 * does — update them if the donation flow or the data we keep ever changes.
 */
type LegalDoc = {
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
};

export const legalDocs: LegalDoc[] = [
  {
    slug: "privacy",
    eyebrow: "Privacy",
    title: "What we do with your information.",
    intro:
      "The short version: we keep only what you type into the donation form, and your card details never reach our server.",
    updated: "Last reviewed October 2026",
    sections: [
      {
        heading: "What we collect",
        body: [
          "When you donate we ask for your name, an optional email address, and your postal code. The card number, expiry date, and security code are typed straight into Stripe's secure form — they are never sent to us and never stored by us.",
          "If you call or email us, we keep that message so that we can reply to you.",
        ],
      },
      {
        heading: "Why we collect it",
        body: [
          "Your name and email let us send a receipt and thank you properly. Your postal code is used by your bank to verify the payment.",
          "We use your email address only to talk to you about your donation. We do not sell, rent, or trade personal information, and this site runs no advertising trackers.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Donation records are kept for as long as we are required to keep financial records. You can ask us to remove your name and email at any time by calling the number below.",
        ],
      },
      {
        heading: "Who else is involved",
        body: [
          "Payments are processed by Stripe, and their privacy policy explains how they handle card data. Completed donations are recorded in a ledger on a server the band controls.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    eyebrow: "Terms",
    title: "The ground rules, in plain language.",
    intro: "We keep this short, because nobody reads long terms. This is what matters.",
    updated: "Last reviewed October 2026",
    sections: [
      {
        heading: "Donations",
        body: [
          "Donations are voluntary gifts that pay for free music lessons, instruments, and concerts. They are not payment for goods or services.",
          `If you are charged in error, or charged twice, call ${contact.phoneLabel} and we will arrange a refund through Stripe.`,
        ],
      },
      {
        heading: "Using this site",
        body: [
          "You are welcome to read, link to, and share anything on these pages. Please do not republish our photographs or recordings as your own, or use our contact details to send unlawful or abusive messages.",
        ],
      },
      {
        heading: "Concerts and rehearsals",
        body: [
          "Our events are free and open to everyone. Times and venues can change at short notice, so please check this site or call ahead before travelling a long way.",
        ],
      },
      {
        heading: "Changes",
        body: ["If we change these terms we will update the review date at the top of this page."],
      },
    ],
  },
  {
    slug: "accessibility",
    eyebrow: "Accessibility",
    title: "Everyone should be able to take part.",
    intro:
      "We want this site to work for every visitor, whatever device or ability they bring to it.",
    updated: "Last reviewed October 2026",
    sections: [
      {
        heading: "What we have done",
        body: [
          "Every page is built to meet WCAG 2.1 level AA: readable colour contrast in both light and dark mode, a visible focus outline on every control, real headings and page landmarks, labels on every form field, and respect for your reduced-motion setting.",
          "The whole site can be used with a keyboard alone. Press Tab to move through the page and Enter to follow a link.",
        ],
      },
      {
        heading: "Known limitations",
        body: [
          `The card form is provided by Stripe and we cannot change its internal markup. If it gives you trouble, call ${contact.phoneLabel} and a volunteer can take your donation over the phone instead.`,
        ],
      },
      {
        heading: "Telling us about a problem",
        body: [
          `If anything here blocks you, call ${contact.phoneLabel} or speak to a volunteer at a rehearsal. We will fix what we can, and find another way to help you in the meantime.`,
        ],
      },
    ],
  },
];
