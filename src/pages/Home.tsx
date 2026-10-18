import { Link } from "react-router-dom";
import SheetMusic from "../components/SheetMusic";
import SectionHeading from "../components/SectionHeading";
import MetricCard from "../components/MetricCard";
import ProgramCard from "../components/ProgramCard";
import EventCard from "../components/EventCard";
import TestimonialCard from "../components/TestimonialCard";
import { IconArrowRight, IconHeart, IconSparkle, IconTicket, IconCheck } from "../components/Icons";
import { events, metrics, programs, testimonials } from "../data/landing";
import { eventDateParts, nextUpcomingEvent } from "../lib/events";
import { usePageTitle } from "../lib/usePageTitle";
import logo from "../assets/logo.svg";

const trustPoints = ["No auditions", "No fees, ever", "Instruments to borrow"];

const btnFocus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-fg";

function Home() {
  usePageTitle("");
  // The soonest event still to come, or nothing at all once the announced
  // dates have passed — never just whichever entry happens to be first.
  const nextEvent = nextUpcomingEvent(events);
  const nextDate = nextEvent ? eventDateParts(nextEvent.date) : null;

  return (
    <>
      {/* ============================= HERO ============================= */}
      <section className="stage relative isolate overflow-hidden">
        {/* Atmospheric background layers */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 top-1/4 size-[26rem] rounded-full bg-amber-400/10 blur-3xl motion-safe:animate-drift" />
          <div className="absolute -right-20 top-8 size-[22rem] rounded-full bg-plume/10 blur-3xl motion-safe:animate-float-slow" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          {/* Copy */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-4 py-1.5 text-[0.72rem] font-bold uppercase tracking-widest text-tile-fg backdrop-blur-sm">
              <IconSparkle className="size-4" />A volunteer band for every neighbor
            </span>

            <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-6xl">
              <span className="bg-[linear-gradient(105deg,var(--title-from),var(--title-to))] bg-clip-text text-transparent">
                Music that belongs to everyone.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stage-muted">
              Free to learn, free to listen, and open to every age and skill level. Local musicians
              making room for more music in our community.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/about"
                className={`group inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 active:translate-y-0 ${btnFocus}`}
              >
                Join a rehearsal
                <IconArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#events"
                className={`inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-6 py-3.5 font-semibold text-stage-fg backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brass/50 hover:bg-stage-hover active:translate-y-0 ${btnFocus}`}
              >
                <IconTicket className="size-5" />
                Find a concert
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stage-muted">
              {trustPoints.map((point) => (
                <li key={point} className="inline-flex items-center gap-2">
                  <IconCheck className="size-4 text-tile-fg" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Emblem artwork */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative aspect-square">
              <div className="absolute inset-0 rounded-full border border-stage-ring" />
              <div className="absolute inset-8 rounded-full border border-stage-line" />
              <div className="absolute inset-0 rounded-full border border-dashed border-stage-ring motion-safe:animate-spin-slow" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="grid size-40 place-items-center rounded-full border border-medal-ring bg-gradient-to-br from-medal-from to-medal-to shadow-[0_0_90px_-10px_var(--medal-glow)]">
                  <img src={logo} alt="" className="size-20" />
                </span>
              </div>

              {/* Floating glass "next concert" chip */}
              {nextEvent && (
                <div className="absolute -bottom-6 left-1/2 w-64 -translate-x-1/2 rounded-2xl border border-stage-line bg-stage-glass-strong p-4 text-left backdrop-blur-md motion-safe:animate-float">
                  <p className="text-[0.68rem] font-bold uppercase tracking-widest text-tile-fg">
                    Next concert
                  </p>
                  <p className="mt-1 font-serif text-lg leading-tight text-stage-fg">
                    {nextEvent.name}
                  </p>
                  <p className="mt-1 text-sm text-stage-muted">
                    {nextDate ? `${nextDate.month} ${nextDate.dayOfMonth} · ` : ""}
                    {nextEvent.place} · {nextEvent.time}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Living sheet music */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-44 [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_68%,transparent)] opacity-70 sm:h-56"
        >
          <SheetMusic className="h-full w-full" />
        </div>

        {/* Metrics (glass) */}
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-20">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================ MISSION ============================ */}
      <section className="band bg-paper">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 md:py-28 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading
              eyebrow="Our mission"
              title="Music should not depend on what a family can afford."
            />
            <div className="mt-2 space-y-4 text-base leading-relaxed text-muted">
              <p>
                We started in a parish hall because too many children in our town never got the
                chance to hold an instrument. Today our volunteer teachers run lessons, lend out
                instruments, and play free concerts for the whole community.
              </p>
              <p>Every dollar we raise goes to instruments, sheet music, and rehearsal space.</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border-l-[6px] border-plume bg-feature p-8 shadow-2xl">
            <img src={logo} alt="" className="size-12 rounded-full ring-1 ring-brass/40" />
            <p className="mt-4 font-serif text-2xl font-semibold leading-snug text-feature-fg">
              Free to learn. Free to listen. Free to join.
            </p>
            <p className="mt-3 text-sm text-feature-muted">
              Run by volunteers, funded by donations and local sponsors.
            </p>
          </div>
        </div>
      </section>

      {/* ============================ PROGRAMS ============================ */}
      <section className="band-tint bg-paper-2">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <SectionHeading
            center
            eyebrow="What we offer"
            title="Three programs, all free."
            text="Every program is run by band volunteers, and every one of them is open to anyone who walks through the door."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        </div>
      </section>

      {/* ====================== REHEARSALS & EVENTS ====================== */}
      <section id="events" className="band scroll-mt-24 bg-paper">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <SectionHeading
            eyebrow="Upcoming"
            title="Rehearsals & events"
            text="Every event is free and open to the neighbourhood — no tickets and no sign-up, just come along."
          />
          <div className="mt-10 grid gap-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================== TESTIMONIALS ========================== */}
      <section className="band-tint bg-paper-2">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <SectionHeading
            center
            eyebrow="Voices"
            title="Why families keep coming back"
            text="Everyone who plays here started somewhere. Here is what the band means to the people in it."
          />
          <div className="mt-14 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="stage relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -bottom-24 left-1/4 size-[24rem] rounded-full bg-amber-400/10 blur-3xl" />
        </div>
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 py-20 md:flex-row md:items-center md:justify-between md:py-24">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-balance text-stage-fg md:text-4xl">
              Play with us, or help us buy the next trumpet.
            </h2>
            <p className="mt-4 text-stage-muted">
              New members join all year. Donations and sponsors keep every lesson and concert free.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/about"
              className={`inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-6 py-3.5 font-semibold text-stage-fg backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brass/50 hover:bg-stage-hover active:translate-y-0 ${btnFocus}`}
            >
              See how to join
            </Link>
            <Link
              to="/donate"
              className={`group inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 active:translate-y-0 ${btnFocus}`}
            >
              <IconHeart className="size-5 transition-transform duration-300 group-hover:scale-110" />
              Donate now
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
