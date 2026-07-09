import logo from "@/assets/logo.png";
import { navItems } from "@/data";
import AppLink from "./Link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src={logo} alt="" />
          <div>
            <strong>Crunchtime Fitness Training</strong>
            <p>Premium coaching software for clients, trainers, progress, and accountability.</p>
          </div>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          {navItems.map((item) => (
            <AppLink key={item.href} href={item.href}>
              {item.label}
            </AppLink>
          ))}
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Crunchtime Fitness Training. All rights reserved.</span>
        <span>Fitness and wellness support, not medical advice.</span>
      </div>
    </footer>
  );
}
