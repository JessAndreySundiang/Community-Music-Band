import { IconQuote } from "./Icons";
import type { Testimonial } from "../data/landing";

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { quote, name, role, initials } = testimonial;

  return (
    <figure className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brass/50 hover:shadow-xl">
      <IconQuote className="mb-3 size-6 text-brass" />
      <blockquote className="font-serif text-[1.05rem] leading-relaxed text-ink">
        {quote}
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tile font-serif text-sm text-tile-fg border border-tile-line">
          {initials}
        </span>
        <span>
          <span className="block text-sm font-bold text-ink">{name}</span>
          <span className="block text-xs text-muted">{role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default TestimonialCard;
