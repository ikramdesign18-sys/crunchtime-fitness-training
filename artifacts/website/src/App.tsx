import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import FeaturesPage from "@/pages/FeaturesPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";

const pageMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Crunchtime Fitness Training | Smarter Fitness Coaching",
    description:
      "Premium fitness coaching app with workouts, meal plans, BMI tracking, progress, bookings, video feedback, and live coaching.",
  },
  "/features": {
    title: "Features | Crunchtime Fitness Training",
    description:
      "Explore client and trainer features for workouts, tracking, communication, video coaching, bookings, and account security.",
  },
  "/privacy": {
    title: "Privacy Policy | Crunchtime Fitness Training",
    description:
      "Privacy policy for Crunchtime Fitness Training, covering account data, fitness information, bookings, video submissions, Supabase, and Agora.",
  },
  "/terms": {
    title: "Terms and Disclaimer | Crunchtime Fitness Training",
    description:
      "Terms and disclaimer for Crunchtime Fitness Training, including fitness responsibility, no medical advice, user content, and third-party services.",
  },
};

function getPath() {
  return window.location.pathname || "/";
}

export default function App() {
  const [path, setPath] = useState(getPath);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = window.localStorage.getItem("crunchtime-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const onPopState = () => setPath(getPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("crunchtime-theme", theme);
  }, [theme]);

  useEffect(() => {
    const meta = pageMeta[path] ?? pageMeta["/"];
    document.title = meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", meta.description);

    if (window.location.hash) {
      window.setTimeout(() => {
        document
          .getElementById(window.location.hash.slice(1))
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [path]);

  const Page = useMemo(() => {
    if (path === "/features") return <FeaturesPage />;
    if (path === "/privacy") return <PrivacyPage />;
    if (path === "/terms") return <TermsPage />;
    return <HomePage />;
  }, [path]);

  return (
    <>
      <Header
        currentPath={path}
        theme={theme}
        onThemeChange={() => setTheme(theme === "dark" ? "light" : "dark")}
      />
      {Page}
      <Footer />
    </>
  );
}
