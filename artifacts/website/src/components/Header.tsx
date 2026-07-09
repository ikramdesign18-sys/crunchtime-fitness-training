import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { navItems } from "@/data";
import AppLink from "./Link";

interface HeaderProps {
  currentPath: string;
  theme: "light" | "dark";
  onThemeChange: () => void;
}

export default function Header({ currentPath, theme, onThemeChange }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="nav-shell">
        <AppLink href="/" className="brand" aria-label="Crunchtime Fitness Training home">
          <img src={logo} alt="" />
          <span>
            <strong>Crunchtime</strong>
            <small>Fitness Training</small>
          </span>
        </AppLink>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <AppLink
              key={item.href}
              href={item.href}
              className={currentPath === item.href ? "active" : ""}
            >
              {item.label}
            </AppLink>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="icon-button" type="button" onClick={onThemeChange} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="icon-button menu-button"
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <AppLink key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </AppLink>
          ))}
        </nav>
      )}
    </header>
  );
}
