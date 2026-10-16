import { IconSparkle } from "./Icons";

type SectionHeadingProps = {
  title: string;
  text?: string;
  eyebrow?: string;
  center?: boolean;
};

function SectionHeading({ title, text, eyebrow, center }: SectionHeadingProps) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-widest text-brass shadow-sm">
          <IconSparkle className="size-4" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-serif text-3xl font-semibold tracking-tight text-balance text-ink md:text-4xl">
        {title}
      </h2>
      {text && <p className="mt-4 text-base leading-relaxed text-muted">{text}</p>}
    </div>
  );
}

export default SectionHeading;
