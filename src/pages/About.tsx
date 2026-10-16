import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import ProfileCard from "../components/ProfileCard";
import { IconCalendar, IconClock, IconHeart, IconMapPin, IconMusic, IconUsers } from "../components/Icons";

const timeline = [
  { year: "2012", text: "Founded in a parish hall with 14 members." },
  { year: "2016", text: "Free youth lessons and the instrument lending library begin." },
  { year: "2020", text: "Rehearsals move outdoors, and concerts are streamed for families at home." },
  { year: "2023", text: "The Senior Ensemble opens for adults 55 and up." },
  { year: "2026", text: "45 musicians, 250 students taught, and monthly plaza concerts." },
];

const values = [
  {
    id: "open",
    title: "Open to all",
    text: "No audition, no fee, and no experience needed. If you want to play, there is a seat for you.",
    Icon: IconUsers,
  },
  {
    id: "learn",
    title: "Learn by playing",
    text: "We teach through rehearsal and performance, so every student plays real music from the first month.",
    Icon: IconMusic,
  },
  {
    id: "give",
    title: "Give back",
    text: "Every concert is free, and every peso donated goes to instruments, music, and rehearsal space.",
    Icon: IconHeart,
  },
];

const joinDetails = [
  { Icon: IconCalendar, term: "When", detail: "Saturdays, 9:00 AM to 12:00 NN" },
  { Icon: IconMapPin, term: "Where", detail: "Community Center, Main Hall" },
  { Icon: IconHeart, term: "Cost", detail: "Free" },
  { Icon: IconClock, term: "Bring", detail: "Your instrument, or borrow one from us" },
];

function About() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Music should be within everyone’s reach."
        text="I’m Jess Andrey Sundiang, a flute and piccolo player and BSIT student. I built this site to help more families find a band where anyone can learn, borrow an instrument, and perform. Your support helps us care for instruments, provide music, and keep concerts free for our community."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/donate"
            className="inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-fg active:translate-y-0"
          >
            Help keep music free
          </Link>
          <a
            href="#join"
            className="inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-6 py-3.5 font-semibold text-stage-fg backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brass/50 hover:bg-stage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-fg active:translate-y-0"
          >
            Visit a rehearsal
          </a>
        </div>
      </PageHero>

      <section className="band bg-paper">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-24">
          <ProfileCard
            name="Jess Andrey Sundiang"
            age={20}
            course="3rd Year BSIT"
            school="Angeles University Foundation"
            address="Pandacaqui, Mexico, Pampanga"
            phone="0994-329-5457"
            instrument="Flute / Piccolo"
          />
        </div>
      </section>

      <section className="band-tint bg-paper-2">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-12 px-5 py-20 md:py-28 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="Our story" title="About the band" />
            <div className="space-y-4 text-base leading-relaxed text-muted">
              <p>
                Our founders were retired school band teachers and local musicians who missed playing
                together. They opened their rehearsals to anyone who wanted to learn, and the band
                has grown by word of mouth ever since.
              </p>
              <p>
                We are registered as a non-profit and every volunteer, from conductor to librarian,
                gives their time for free.
              </p>
            </div>
          </div>

          <ol className="relative space-y-6 border-l-2 border-brass/40 pl-8">
            {timeline.map((item) => (
              <li key={item.year} className="relative">
                <span className="absolute -left-[2.65rem] top-1.5 size-3.5 rounded-full bg-brass shadow-[0_0_0_4px_var(--paper-2)]" />
                <p className="font-serif text-lg font-semibold text-ink">{item.year}</p>
                <p className="text-sm leading-relaxed text-muted">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band bg-paper">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <SectionHeading center eyebrow="What guides us" title="What we stand for" />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {values.map(({ id, title, text, Icon }) => (
              <div
                key={id}
                className="rounded-2xl border border-line border-t-4 border-t-plume bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-plume/10 text-plume">
                  <Icon className="size-6" />
                </span>
                <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="join" className="band-tint scroll-mt-24 bg-paper-2">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <SectionHeading
            eyebrow="Come and see"
            title="Join a rehearsal"
            text="Come to any Saturday rehearsal. You can watch first, or sit in and play."
          />
          <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {joinDetails.map(({ Icon, term, detail }) => (
              <div key={term} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <dt className="flex items-center gap-2 font-bold text-ink">
                  <Icon className="size-5 text-brass" />
                  {term}
                </dt>
                <dd className="mt-1 text-sm text-muted">{detail}</dd>
              </div>
            ))}
          </dl>
          <a
            href="tel:09943295457"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright active:translate-y-0"
          >
            Call 0994-329-5457
          </a>
        </div>
      </section>
    </>
  );
}

export default About;
