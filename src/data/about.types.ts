import type { ComponentType, SVGProps } from "react";

/* ------------------------------------------------------------------ */
/* Icon resolution                                                     */
/* ------------------------------------------------------------------ */

/** Every icon in the shared set shares this signature. */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** String keys stored in about.json — resolved at render time via `iconMap`. */
export type IconKey =
  | "IconCalendar"
  | "IconCap"
  | "IconClock"
  | "IconHeart"
  | "IconInstrument"
  | "IconKey"
  | "IconMapPin"
  | "IconMusic"
  | "IconTicket"
  | "IconUsers";

/* ------------------------------------------------------------------ */
/* Section types                                                       */
/* ------------------------------------------------------------------ */

export interface HeroCta {
  id: string;
  label: string;
  /** Internal route — rendered as `<Link>`. */
  to?: string;
  /** Anchor or external URL — rendered as `<a>`. */
  href?: string;
  variant: "primary" | "secondary";
}

export interface HeroData {
  eyebrow: string;
  title: string;
  description: string;
  ctas: HeroCta[];
}

export interface ProfileData {
  name: string;
  age: number;
  role: string;
  course: string;
  school: string;
  instrument: string;
  bio: string;
}

export interface StoryData {
  eyebrow: string;
  title: string;
  paragraphs: string[];
}

export interface TimelineItem {
  year: string;
  text: string;
}

export interface ValueItem {
  id: string;
  icon: IconKey;
  title: string;
  text: string;
}

export interface ValuesData {
  eyebrow: string;
  title: string;
  items: ValueItem[];
}

export interface MissionPillar {
  id: string;
  icon: IconKey;
  title: string;
  text: string;
}

export interface MissionData {
  eyebrow: string;
  title: string;
  statement: string;
  pillars: MissionPillar[];
}

export interface ImpactStat {
  id: string;
  value: string;
  label: string;
  icon: IconKey;
}

export interface ImpactData {
  eyebrow: string;
  title: string;
  stats: ImpactStat[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqData {
  eyebrow: string;
  title: string;
  items: FaqItem[];
}

export interface JoinDetail {
  icon: IconKey;
  term: string;
  detail: string;
}

export interface JoinData {
  eyebrow: string;
  title: string;
  text: string;
  details: JoinDetail[];
  ctaLabel: string;
}

export interface MetaData {
  pageTitle: string;
  ogTitle: string;
  ogDescription: string;
  lastUpdated: string;
}

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

export interface AboutPageData {
  hero: HeroData;
  profile: ProfileData;
  story: StoryData;
  timeline: TimelineItem[];
  values: ValuesData;
  mission: MissionData;
  impact: ImpactData;
  faq: FaqData;
  join: JoinData;
  meta: MetaData;
}
