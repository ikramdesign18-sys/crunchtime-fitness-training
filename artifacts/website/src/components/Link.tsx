import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

interface AppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

export default function AppLink({ href, children, onClick, ...props }: AppLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === "_blank" ||
      href.startsWith("http") ||
      href.startsWith("mailto:")
    ) {
      return;
    }

    if (href.includes("#")) {
      const [path, hash] = href.split("#");
      if ((path || window.location.pathname) === window.location.pathname) {
        event.preventDefault();
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `${path || window.location.pathname}#${hash}`);
        return;
      }
    }

    event.preventDefault();
    history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
    if (href.includes("#")) {
      const hash = href.split("#")[1];
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
