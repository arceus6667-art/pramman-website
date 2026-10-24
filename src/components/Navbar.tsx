import { AcademyLogo } from "./AcademyLogo";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { navigation } from "../config/site";
export function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-15% 0px -55% 0px" },
    );
    document
      .querySelectorAll("main section[id]")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        document.querySelector<HTMLButtonElement>(".menu-toggle")?.focus();
      }
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <a
          className="brand"
          href="#home"
          aria-label="PFSA home"
          onClick={() => setOpen(false)}
        >
          <AcademyLogo />
          <span>
            <b>
              PFSA<span className="brand-dot">.</span>
            </b>
            <small>
              PRAMMAN FORENSICS
              <br />
              SCIENCE ACADEMY
            </small>
          </span>
        </a>
        <button
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav
          id="navigation"
          className={open ? "open" : ""}
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={active === item.id ? "active" : ""}
              aria-current={active === item.id ? "location" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            href="#internships"
            className="button button-small"
            onClick={() => setOpen(false)}
          >
            Explore Internships <ArrowUpRight size={16} />
          </a>
        </nav>
      </div>
    </header>
  );
}
