import type { Program } from "../data/landing";

function ProgramCard({ program }: { program: Program }) {
  const { title, text, who, icon: Icon } = program;

  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brass/60 hover:shadow-xl">
      <span className="grid size-12 place-items-center rounded-2xl bg-tile text-tile-fg border border-tile-line">
        <Icon className="size-6" />
      </span>
      <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{text}</p>
      <span className="mt-auto self-start rounded-full bg-plume/10 px-3 py-1 text-xs font-bold text-plume">
        {who}
      </span>
    </article>
  );
}

export default ProgramCard;
