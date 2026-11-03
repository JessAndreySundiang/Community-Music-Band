import { useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import ProfileCard from "../components/ProfileCard";
import { contact } from "../data/landing";
import { usePageTitle } from "../lib/usePageTitle";
import { resolveIcon } from "../lib/iconMap";
import aboutData from "../data/about.json";
import type { AboutPageData } from "../data/about.types";

const data = aboutData as AboutPageData;

function About() {
  usePageTitle(data.meta.pageTitle);

  return (
    <>
      {/* ───────────────────────────── Hero ───────────────────────────── */}
      <PageHero eyebrow={data.hero.eyebrow} title={data.hero.title} text={data.hero.description}>
        <div className="mt-8 flex flex-wrap gap-3">
          {data.hero.ctas.map((cta) =>
            cta.to ? (
              <Link
                key={cta.id}
                to={cta.to}
                className="inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-fg active:translate-y-0"
              >
                {cta.label}
              </Link>
            ) : (
              <a
                key={cta.id}
                href={cta.href}
                className="inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-6 py-3.5 font-semibold text-stage-fg backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brass/50 hover:bg-stage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-fg active:translate-y-0"
              >
                {cta.label}
              </a>
            ),
          )}
        </div>
      </PageHero>

      {/* ──────────────────────── Profile Card ────────────────────────── */}
      <section className="band bg-paper">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-24">
          <ProfileCard
            name={data.profile.name}
            age={data.profile.age}
            course={data.profile.course}
            school={data.profile.school}
            address={contact.address}
            phone={contact.phoneLabel}
            phoneHref={contact.phoneHref}
            instrument={data.profile.instrument}
          />
        </div>
      </section>

      {/* ─────────────────────── Mission (NEW) ────────────────────────── */}
      <section className="band-tint bg-paper-2">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <SectionHeading center eyebrow={data.mission.eyebrow} title={data.mission.title} />
          <p className="mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed text-muted">
            {data.mission.statement}
          </p>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {data.mission.pillars.map((pillar) => {
              const Icon = resolveIcon(pillar.icon);
              return (
                <div
                  key={pillar.id}
                  className="rounded-2xl border border-line border-t-4 border-t-brass bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-brass/10 text-brass">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────── Our Story + Timeline ──────────────────────── */}
      <section className="band bg-paper">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-12 px-5 py-20 md:py-28 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow={data.story.eyebrow} title={data.story.title} />
            <div className="space-y-4 text-base leading-relaxed text-muted">
              {data.story.paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>

          <ol className="relative space-y-6 border-l-2 border-brass/40 pl-8">
            {data.timeline.map((item) => (
              <li key={item.year} className="relative">
                <span className="absolute -left-[2.65rem] top-1.5 size-3.5 rounded-full bg-brass shadow-[0_0_0_4px_var(--paper)]" />
                <p className="font-serif text-lg font-semibold text-ink">{item.year}</p>
                <p className="text-sm leading-relaxed text-muted">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ──────────────────────── Values ───────────────────────────────── */}
      <section className="band-tint bg-paper-2">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <SectionHeading center eyebrow={data.values.eyebrow} title={data.values.title} />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {data.values.items.map((value) => {
              const Icon = resolveIcon(value.icon);
              return (
                <div
                  key={value.id}
                  className="rounded-2xl border border-line border-t-4 border-t-plume bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-plume/10 text-plume">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{value.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────── Impact / Stats (NEW) ─────────────────────── */}
      <section className="band bg-paper">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <SectionHeading center eyebrow={data.impact.eyebrow} title={data.impact.title} />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.impact.stats.map((stat) => {
              const Icon = resolveIcon(stat.icon);
              return (
                <div
                  key={stat.id}
                  className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brass/10 text-brass">
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <p className="font-serif text-3xl font-bold tracking-tight text-ink">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────── FAQ (NEW) ──────────────────────────────── */}
      <section className="band-tint bg-paper-2">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <SectionHeading center eyebrow={data.faq.eyebrow} title={data.faq.title} />
          <div className="mx-auto mt-14 max-w-3xl divide-y divide-line">
            {data.faq.items.map((item) => (
              <FaqAccordionItem key={item.id} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── Join a Rehearsal ─────────────────────────── */}
      <section id="join" className="band scroll-mt-24 bg-paper">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <SectionHeading
            eyebrow={data.join.eyebrow}
            title={data.join.title}
            text={data.join.text}
          />
          <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.join.details.map((item) => {
              const Icon = resolveIcon(item.icon);
              return (
                <div
                  key={item.term}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
                >
                  <dt className="flex items-center gap-2 font-bold text-ink">
                    <Icon className="size-5 text-brass" />
                    {item.term}
                  </dt>
                  <dd className="mt-1 text-sm text-muted">{item.detail}</dd>
                </div>
              );
            })}
          </dl>
          <a
            href={contact.phoneHref}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright active:translate-y-0"
          >
            {data.join.ctaLabel} {contact.phoneLabel}
          </a>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ Accordion Item                                                  */
/* ------------------------------------------------------------------ */

function FaqAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <span className="font-serif text-lg font-semibold text-ink">{question}</span>
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M12 6v12M6 12h12" />
          </svg>
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p className="pt-3 text-base leading-relaxed text-muted">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default About;
