import type { ComponentType, SVGProps } from "react";
import {
  IconCalendar,
  IconCap,
  IconFacebook,
  IconHeart,
  IconInstagram,
  IconMusic,
  IconUsers,
  IconYouTube,
} from "../components/Icons";

/** Every icon in the shared set shares this signature. */
type IconType = ComponentType<SVGProps<SVGSVGElement>>;

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */
type NavItem = { label: string; to: string; end?: boolean };

export const navItems: NavItem[] = [
  { label: "Home", to: "/", end: true },
  { label: "About", to: "/about" },
  { label: "Donate", to: "/donate" },
];

/* ------------------------------------------------------------------ */
/* Hero metrics                                                        */
/* ------------------------------------------------------------------ */
export type Metric = {
  id: string;
  value: string;
  label: string;
  icon: IconType;
};

export const metrics: Metric[] = [
  { id: "founded", value: "2012", label: "Year we started", icon: IconCalendar },
  { id: "members", value: "45", label: "Volunteer musicians", icon: IconUsers },
  { id: "concerts", value: "30+", label: "Free concerts every year", icon: IconMusic },
  { id: "students", value: "250", label: "Students taught", icon: IconCap },
];

/* ------------------------------------------------------------------ */
/* Rehearsals & events                                                 */
/* ------------------------------------------------------------------ */
export type BandEvent = {
  id: string;
  /** ISO date, `YYYY-MM-DD`. The card and the "next concert" chip both read it. */
  date: string;
  name: string;
  place: string;
  time: string;
  instruments: string[];
};

export const events: BandEvent[] = [
  {
    id: "autumn-plaza",
    date: "2026-11-08",
    name: "Autumn Plaza Concert",
    place: "Town Plaza",
    time: "4:00 PM",
    instruments: ["Trumpet", "Clarinet"],
  },
  {
    id: "carols-brass",
    date: "2026-12-13",
    name: "Carols and Brass",
    place: "Parish Hall",
    time: "6:00 PM",
    instruments: ["Horn", "Trombone"],
  },
  {
    id: "open-rehearsal",
    date: "2027-01-16",
    name: "Open Rehearsal & Sign-ups",
    place: "Community Center",
    time: "9:00 AM",
    instruments: ["Flute", "Percussion"],
  },
];

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */
export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "marites",
    quote:
      "My daughter had never touched an instrument. Two years later she is playing clarinet in the plaza concert — and it has never cost us a cent.",
    name: "Marites R.",
    role: "Parent of a youth student",
    initials: "MR",
  },
  {
    id: "eduardo",
    quote:
      "I played trumpet in school and thought that part of my life was over. The Saturday ensemble gave it back to me at 61.",
    name: "Eduardo S.",
    role: "Senior Ensemble member",
    initials: "ES",
  },
  {
    id: "liza",
    quote:
      "The monthly concert is the one night the whole barangay shows up together. It brings everyone, young and old, into the same square.",
    name: "Liza M.",
    role: "Neighbor and regular listener",
    initials: "LM",
  },
  {
    id: "noel",
    quote:
      "I borrow a trumpet from the lending library. I could never have afforded one on my own — the band simply handed me one and said, come back Saturday.",
    name: "Noel B.",
    role: "Youth student, age 14",
    initials: "NB",
  },
  {
    id: "grace",
    quote:
      "Volunteering as a librarian turned into learning the flute. Nobody here is too old or too busy to start.",
    name: "Grace T.",
    role: "Volunteer and adult beginner",
    initials: "GT",
  },
  {
    id: "ramon",
    quote:
      "Every donation we get goes back into the instruments the kids hold. You can see exactly where your help lands.",
    name: "Ramon D.",
    role: "Committee treasurer",
    initials: "RD",
  },
];

/* ------------------------------------------------------------------ */
/* Programs                                                            */
/* ------------------------------------------------------------------ */
export type Program = {
  id: string;
  title: string;
  text: string;
  who: string;
  icon: IconType;
};

export const programs: Program[] = [
  {
    id: "youth",
    title: "Youth Music Lessons",
    text: "Weekly group lessons in brass, woodwind, and percussion. Families who cannot buy an instrument can borrow one from our lending library.",
    who: "Ages 8 to 17",
    icon: IconCap,
  },
  {
    id: "concerts",
    title: "Community Concerts",
    text: "A free outdoor concert in the town plaza on the second Sunday of every month. Bring a chair, a blanket, and your neighbors.",
    who: "All ages",
    icon: IconMusic,
  },
  {
    id: "senior",
    title: "Senior Ensemble",
    text: "A relaxed Saturday-afternoon group for adults who want to keep playing or finally learn. No audition needed.",
    who: "Ages 55 and up",
    icon: IconHeart,
  },
];

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */
type SocialLink = { label: string; href: string; icon: IconType };

/**
 * TODO: swap these for the band's own profile URLs. They currently point at
 * each platform's home page, so the icons are never broken links, but they do
 * not take a visitor to the band yet.
 */
export const socials: SocialLink[] = [
  { label: "Facebook", href: "https://facebook.com", icon: IconFacebook },
  { label: "Instagram", href: "https://instagram.com", icon: IconInstagram },
  { label: "YouTube", href: "https://youtube.com", icon: IconYouTube },
];

type LegalLink = { label: string; to: string };

export const legalLinks: LegalLink[] = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Accessibility", to: "/accessibility" },
];

/** Shared by the footer and the accessibility statement. */
export const contact = {
  phoneLabel: "0994-329-5457",
  phoneHref: "tel:+639943295457",
  address: "Pandacaqui, Mexico, Pampanga, Philippines",
} as const;
