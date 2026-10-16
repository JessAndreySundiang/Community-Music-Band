import { useState } from "react";
import { IconCheck, IconClock, IconMapPin, IconMusic } from "./Icons";
import type { BandEvent } from "../data/landing";

function EventCard({ event }: { event: BandEvent }) {
  const { month, day, name, place, time, going: baseGoing, instruments } = event;
  const [attending, setAttending] = useState<boolean>(false);
  const going = baseGoing + (attending ? 1 : 0);

  return (
    <article className="group grid gap-5 rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all duration-300 hover:border-brass/60 hover:shadow-xl sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
      {/* Date block */}
      <div className="flex size-16 flex-col items-center justify-center rounded-2xl bg-tile text-ink border border-tile-line">
        <span className="font-serif text-2xl font-semibold leading-none">{day}</span>
        <span className="mt-1 text-[0.68rem] font-bold uppercase tracking-wider text-tile-fg">
          {month}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2.5">
        <h3 className="font-serif text-lg font-semibold tracking-tight text-ink">{name}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <IconMapPin className="size-4 text-brass" />
            {place}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconClock className="size-4 text-brass" />
            {time}
          </span>
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {instruments.map((instrument) => (
            <li
              key={instrument}
              className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs text-muted"
            >
              <IconMusic className="size-3.5 text-brass" />
              {instrument} open
            </li>
          ))}
        </ul>
      </div>

      {/* RSVP */}
      <button
        type="button"
        aria-pressed={attending}
        onClick={() => setAttending(!attending)}
        className={`inline-flex items-center justify-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright active:translate-y-0 ${
          attending
            ? "border-brass-bright bg-brass-bright text-night-950"
            : "border-brass/50 bg-transparent text-brass hover:bg-brass/10"
        }`}
      >
        {attending && <IconCheck className="size-4" />}
        {attending ? "You're going" : "RSVP"}
        <span className="rounded-full bg-ink/10 px-1.5 py-px text-xs font-semibold">
          {going}
        </span>
      </button>
    </article>
  );
}

export default EventCard;
