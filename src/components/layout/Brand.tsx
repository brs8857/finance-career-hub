import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 px-3 py-1 font-semibold tracking-tight">
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-md bg-accent text-xs font-bold text-accent-fg"
      >
        MT
      </span>
      <span>Market Tracker</span>
    </Link>
  );
}
