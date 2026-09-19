"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

function todayLabel(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date());
}

/**
 * Today's date, rendered only in the browser. The home page is prerendered at
 * build time, so a server-rendered date would be frozen at the build date.
 */
export function TodayDate() {
  const label = useSyncExternalStore(noop, todayLabel, () => null);
  return <span suppressHydrationWarning>{label ?? " "}</span>;
}
