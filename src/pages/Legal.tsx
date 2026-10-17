import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import { contact } from "../data/landing";
import { legalDocs } from "../data/legal";
import { usePageTitle } from "../lib/usePageTitle";

type LegalProps = {
  /** Which document to show. Passed by the route so the URL and the copy cannot drift. */
  slug: string;
};

function Legal({ slug }: LegalProps) {
  const doc = legalDocs.find((entry) => entry.slug === slug) ?? legalDocs[0];
  usePageTitle(doc.eyebrow);

  return (
    <>
      <PageHero eyebrow={doc.eyebrow} title={doc.title} text={doc.intro} />

      <section className="band bg-paper">
        <div className="mx-auto w-full max-w-3xl px-5 py-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brass">
            {doc.updated}
          </p>

          <div className="mt-8 space-y-10">
            {doc.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-serif text-2xl font-semibold text-ink">{section.heading}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-3 leading-relaxed text-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-serif text-xl font-semibold text-ink">Questions?</h2>
            <p className="mt-2 text-muted">
              Call{" "}
              <a
                href={contact.phoneHref}
                className="font-semibold text-brass transition-colors duration-200 hover:text-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
              >
                {contact.phoneLabel}
              </a>
              , or write to us at {contact.address}.
            </p>
            <Link
              to="/about"
              className="mt-4 inline-flex rounded-full bg-brass-bright px-5 py-3 text-sm font-bold text-night-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright active:translate-y-0"
            >
              More about the band
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Legal;
