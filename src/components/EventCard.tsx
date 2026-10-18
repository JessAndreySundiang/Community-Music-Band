import { IconClock, IconMapPin, IconMusic } from "./Icons";
import type { BandEvent } from "../data/landing";
import { eventDateParts } from "../lib/events";

/**
 * A rehearsal or concert. Deliberately not interactive: there is no RSVP list,
 * so a button here would promise the band something it never receives.
 */
function EventCard({ event }: { event: BandEvent }) {
  const { date, name, place, time, instruments } = event;
  const parts = eventDateParts(date);

  return (
    <article className="group grid gap-5 rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all duration-300 hover:border-brass/60 hover:shadow-xl sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
      {/* Date block */}
      <div className="flex size-16 flex-col items-center justify-center rounded-2xl bg-tile text-ink border border-tile-line">
        <span className="font-serif text-2xl font-semibold leading-none">{parts?.day ?? date}</span>
        <span className="mt-1 text-[0.68rem] font-bold uppercase tracking-wider text-tile-fg">
          {parts?.month ?? ""}
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
    </article>
  );
}

export default EventCard;
