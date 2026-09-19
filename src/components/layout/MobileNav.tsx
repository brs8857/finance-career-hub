"use client";

import { Menu, X } from "lucide-react";
import { useRef } from "react";
import { Brand } from "./Brand";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

/** Top bar + slide-over menu for small screens. Native <dialog> gives focus trapping and Esc. */
export function MobileNav() {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-2 backdrop-blur md:hidden">
      <Brand />
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg"
        aria-label="Open menu"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      <dialog
        ref={dialog}
        aria-label="Menu"
        onClick={(e) => e.target === dialog.current && close()}
        className="m-0 ml-auto h-dvh max-h-none w-72 max-w-[85vw] bg-surface p-0 text-fg"
      >
        <div className="flex h-full flex-col p-3">
          <div className="flex items-center justify-between">
            <Brand />
            <button
              type="button"
              onClick={close}
              className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Close menu"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <nav aria-label="Main" className="mt-6 flex-1">
            <NavLinks onNavigate={close} />
          </nav>
          <ThemeToggle />
        </div>
      </dialog>
    </header>
  );
}
