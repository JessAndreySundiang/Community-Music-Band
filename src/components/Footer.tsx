import { Link } from "react-router-dom";
import {
  IconClock,
  IconFacebook,
  IconInstagram,
  IconMapPin,
  IconPhone,
  IconYouTube,
} from "./Icons";
import { navItems } from "../data/landing";
import logo from "../assets/logo.svg";

const socials = [
  { label: "Facebook", href: "https://facebook.com", Icon: IconFacebook },
  { label: "Instagram", href: "https://instagram.com", Icon: IconInstagram },
  { label: "YouTube", href: "https://youtube.com", Icon: IconYouTube },
];

const rehearsal = [
  { Icon: IconClock, text: "Saturdays, 9:00 AM to 12:00 NN" },
  { Icon: IconMapPin, text: "Community Center, Main Hall" },
];

function Footer() {
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="mx-auto w-full max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-full bg-night-950 ring-1 ring-brass/50">
                <img src={logo} alt="" className="size-6" />
              </span>
              <span className="font-serif text-lg font-semibold text-ink">
                Community Music Band
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              A volunteer, non-profit band teaching and performing free music for our community.
            </p>
            <ul className="flex items-center gap-2">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Community Music Band on ${label}`}
                    className="grid size-10 place-items-center rounded-full border border-line text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-brass hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
                  >
                    <Icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Pages */}
          <nav aria-label="Footer" className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">Pages</h2>
            <ul className="space-y-2 text-sm">
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-muted transition-colors duration-200 hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Rehearsals */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">Rehearsals</h2>
            <ul className="space-y-3 text-sm">
              {rehearsal.map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-muted">
                  <Icon className="mt-0.5 size-4.5 shrink-0 text-brass" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">Contact</h2>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="tel:09943295457"
                  className="flex items-center gap-2.5 text-muted transition-colors duration-200 hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
                >
                  <IconPhone className="size-4.5 shrink-0 text-brass" />
                  0994-329-5457
                </a>
              </li>
              <li className="text-muted">
                Pandacaqui, Mexico, Pampanga, Philippines
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Community Music Band Organization. A non-profit organization.</p>
          <ul className="flex items-center gap-5">
            <li>
              <a href="#" className="transition-colors duration-200 hover:text-brass">
                Privacy
              </a>
            </li>
            <li>
              <a href="#" className="transition-colors duration-200 hover:text-brass">
                Terms
              </a>
            </li>
            <li>
              <a href="#" className="transition-colors duration-200 hover:text-brass">
                Accessibility
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
