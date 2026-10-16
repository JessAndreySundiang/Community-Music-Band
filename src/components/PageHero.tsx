import type { ReactNode } from "react";
import { IconSparkle } from "./Icons";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  text: string;
  children?: ReactNode;
};

function PageHero({ eyebrow, title, text, children }: PageHeroProps) {
  return (
    <section className="stage relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_30px,var(--stage-staff)_30px_32px)]" />
      </div>
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-4 py-1.5 text-[0.72rem] font-bold uppercase tracking-widest text-tile-fg backdrop-blur-sm">
          <IconSparkle className="size-4" />
          {eyebrow}
        </span>
        <h1 className="mt-6 max-w-3xl font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-balance md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stage-muted">{text}</p>
        {children}
      </div>
    </section>
  );
}

export default PageHero;
