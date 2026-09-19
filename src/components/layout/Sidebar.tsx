import { Brand } from "./Brand";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

/** Desktop sidebar (md and up). On mobile the same links live in MobileNav. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface p-3 md:flex">
      <Brand />
      <nav aria-label="Main" className="mt-6 flex-1">
        <NavLinks />
      </nav>
      <ThemeToggle />
    </aside>
  );
}
