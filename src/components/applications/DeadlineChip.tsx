import { CalendarClock, RefreshCcw } from "lucide-react";
import { countdownLabel, daysUntil, urgencyOf, type Urgency } from "@/lib/applications/model";
import { formatDate } from "@/lib/format";

const STYLES: Record<Urgency, string> = {
  overdue: "bg-warn-bg text-warn-fg",
  urgent: "bg-warn-bg text-warn-fg",
  soon: "bg-surface-2 text-fg",
  later: "bg-surface-2 text-muted",
};

/** Deadline date + countdown. `today` is the UK date (YYYY-MM-DD). */
export function DeadlineChip({
  deadline,
  rolling,
  today,
  showCountdown = true,
}: {
  deadline: string;
  rolling: boolean;
  today: string;
  showCountdown?: boolean;
}) {
  const days = daysUntil(deadline, today);
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 rounded px-1.5 py-0.5 text-xs ${showCountdown ? STYLES[urgencyOf(days)] : "text-muted"}`}>
      <CalendarClock aria-hidden className="size-3" />
      <time dateTime={deadline}>{formatDate(deadline)}</time>
      {showCountdown ? <span className="font-medium">· {countdownLabel(days)}</span> : null}
      {rolling ? (
        <span title="Recruits on a rolling basis - it may close before this date" className="inline-flex items-center gap-0.5">
          · <RefreshCcw aria-hidden className="size-3" /> rolling
        </span>
      ) : null}
    </span>
  );
}
