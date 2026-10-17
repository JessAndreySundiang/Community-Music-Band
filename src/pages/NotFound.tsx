import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import { navItems } from "../data/landing";
import { usePageTitle } from "../lib/usePageTitle";

function NotFound() {
  usePageTitle("Page not found");

  return (
    <>
      <PageHero
        eyebrow="404 &middot; Page not found"
        title="This page has left the stage."
        text="The page you asked for is not here. It may have moved, or the address may have a typo. The music is still playing, so try one of these instead."
      />

      <section className="band bg-paper">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
          <ul className="grid gap-4 sm:grid-cols-3">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group flex h-full flex-col justify-between gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brass/60 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
                >
                  <span className="font-serif text-xl font-semibold text-ink">{item.label}</span>
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-brass">
                    Go to {item.label}
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    >
                      &rarr;
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export default NotFound;
