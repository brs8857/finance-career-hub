// Runs synchronously while the HTML is parsed, before first paint, so the
// page never flashes the wrong theme. Pattern from the Next.js docs:
// node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md

const SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
