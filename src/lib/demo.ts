/**
 * Demo mode: for a public deployment (e.g. Vercel), where there is no
 * writable disk and no login.
 *
 * Turned on with NEXT_PUBLIC_DEMO_MODE=1. When on:
 * - the browser never sends saves to the server, so nothing is stored;
 * - changes still appear immediately, but only in that browser tab;
 * - the API refuses writes as a backstop;
 * - a banner explains this on every page.
 *
 * Locally this is off, so everything saves to data/ as normal.
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

export const DEMO_NOTICE = "Demo: you can try everything, but changes aren't saved.";
