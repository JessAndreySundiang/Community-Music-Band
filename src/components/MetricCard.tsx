import type { Metric } from "../data/landing";

/**
 * Premium glass metric card. Sits on the dark hero stage, so it uses
 * translucent white borders/washes per the glassmorphism spec.
 */
function MetricCard({ metric }: { metric: Metric }) {
  const { value, label, icon: Icon } = metric;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-stage-line bg-stage-glass p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brass/40 hover:bg-stage-hover sm:p-6">
      <span className="mb-4 grid size-11 place-items-center rounded-xl bg-stage-glass-strong text-tile-fg border border-stage-line">
        <Icon className="size-5.5" />
      </span>
      <p className="font-serif text-3xl font-semibold leading-none tracking-tight text-stage-fg sm:text-4xl">
        {value}
      </p>
      <p className="mt-2 text-sm text-stage-muted">{label}</p>
      {/* brass underline that reveals on hover */}
      <span className="pointer-events-none absolute inset-x-6 -bottom-px h-px bg-gradient-to-r from-transparent via-brass-bright/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

export default MetricCard;
