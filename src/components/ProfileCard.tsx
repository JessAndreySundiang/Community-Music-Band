import { IconMusic, IconPhone } from "./Icons";

type ProfileCardProps = {
  name: string;
  age: number;
  school: string;
  course: string;
  address: string;
  phone: string;
  instrument: string;
};

// Picks up src/assets/profile.jpg (or .jpeg, .png, .webp) automatically if it exists
const photos = import.meta.glob("../assets/profile.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const photo: string | undefined = Object.values(photos)[0];

function ProfileCard({ name, age, school, course, address, phone, instrument }: ProfileCardProps) {
  const parts = name.split(" ");
  const initials = parts[0][0] + parts[parts.length - 1][0];
  const rows: { label: string; value: string }[] = [
    { label: "Age", value: `${age} years old` },
    { label: "Course", value: course },
    { label: "School", value: school },
    { label: "Address", value: address },
    { label: "Contact", value: phone },
    { label: "Instrument", value: instrument },
  ];

  return (
    <article className="grid items-center gap-12 lg:grid-cols-[minmax(260px,380px)_1fr]">
      {/* Portrait */}
      <div className="relative mx-auto w-full max-w-[340px] pr-5 pb-5 lg:max-w-none">
        <div
          aria-hidden="true"
          className="absolute inset-0 left-5 top-5 rounded-3xl bg-gradient-to-br from-amber-300 to-amber-500"
        />
        <div className="relative aspect-4/5 overflow-hidden rounded-3xl border-[6px] border-surface bg-tile shadow-2xl">
          {photo ? (
            <img src={photo} alt={`Portrait of ${name}`} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-br from-tile to-tile-2 font-serif text-6xl text-tile-fg">
              {initials}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-6 inline-flex items-center gap-2 rounded-xl border-l-4 border-plume bg-feature px-4 py-2 text-sm font-semibold text-feature-fg shadow-xl">
          <IconMusic className="size-4 text-tile-fg" />
          {instrument}
        </div>
      </div>

      {/* Details */}
      <div>
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          {name}
        </h2>
        <p className="mt-2 font-semibold text-plume">
          Flute and piccolo player · Community band volunteer
        </p>

        <dl className="mt-8 grid gap-x-10 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="border-t border-line py-3.5">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">{row.label}</dt>
              <dd className="mt-0.5 text-base text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>

        <a
          href={`tel:${phone.replace(/-/g, "")}`}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright active:translate-y-0"
        >
          <IconPhone className="size-5" />
          Call {phone}
        </a>
      </div>
    </article>
  );
}

export default ProfileCard;
