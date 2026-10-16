import { useState } from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { IconClose, IconMenu, IconMusic } from "./Icons";
import { navItems } from "../data/landing";
import logo from "../assets/logo.svg";

const linkBase =
  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright";

function Navbar() {
  const [open, setOpen] = useState<boolean>(false);
  const close = () => setOpen(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${linkBase} ${
      isActive
        ? "bg-brass-bright text-night-950"
        : "text-muted hover:bg-nav-hover hover:text-ink"
    }`;

  return (
    <header className="sticky top-0 z-50">
      {/* Same container as the page content, so the pill lines up with it. */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-3">
        <nav
          aria-label="Primary"
          className="flex items-center justify-between gap-3 rounded-2xl border border-nav-line bg-nav px-3 py-2.5 shadow-lg shadow-black/5 backdrop-blur-xl transition-colors duration-300"
        >
          <NavLink
            to="/"
            onClick={close}
            className="group flex min-w-0 items-center gap-2.5 rounded-xl pr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-night-950 ring-1 ring-brass/50">
              <img src={logo} alt="" className="size-6" />
            </span>
            <span className="min-w-0 truncate text-[0.95rem] font-bold tracking-tight text-ink">
              Community Music Band
            </span>
          </NavLink>

          {/* Desktop */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
            <NavLink
              to="/donate"
              className="hidden rounded-full bg-brass-bright px-4 py-2 text-sm font-bold text-night-950 shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright active:translate-y-0 sm:inline-flex"
            >
              Donate
            </NavLink>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl text-ink transition-colors duration-200 hover:bg-nav-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright md:hidden"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls="primary-navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <IconClose className="size-6" /> : <IconMenu className="size-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile panel */}
        <div
          id="primary-navigation"
          className={`mt-2 overflow-hidden rounded-2xl border bg-nav backdrop-blur-xl transition-all duration-300 md:hidden ${
            open
              ? "max-h-80 border-nav-line opacity-100"
              : "pointer-events-none max-h-0 border-transparent opacity-0"
          }`}
        >
          <div className="flex flex-col gap-1 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={close}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-brass-bright text-night-950"
                      : "text-muted hover:bg-nav-hover hover:text-ink"
                  }`
                }
              >
                {item.label}
                <IconMusic className="size-4 opacity-60" />
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
