import { GraduationCap, Home, KanbanSquare, Landmark, LineChart, Newspaper, Signpost, type LucideIcon } from "lucide-react";

// Sidebar navigation. Add a line here when you add a new page.

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: Home },
  { href: "/markets", label: "Markets", icon: LineChart },
  { href: "/macro", label: "Macro", icon: Landmark },
  { href: "/news", label: "News & notes", icon: Newspaper },
  { href: "/applications", label: "Applications", icon: KanbanSquare },
  { href: "/flashcards", label: "Flashcards", icon: GraduationCap },
  { href: "/pathways", label: "Pathways", icon: Signpost },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
