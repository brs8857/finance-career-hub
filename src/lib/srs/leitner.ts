// Leitner spaced repetition. Five boxes; each box has a review interval.
// Right answer: move up a box. Wrong answer: back to box 1.
// Simple enough to explain in one sentence, which is the point.

/** Days until the next review for a card in each box (index 0 = box 1). */
export const INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;
export const MAX_BOX = INTERVAL_DAYS.length;

export interface CardProgress {
  /** 1..5 */
  box: number;
  /** Next review date, YYYY-MM-DD (UK). */
  due: string;
  lastReviewed: string;
  reviews: number;
  lapses: number;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Apply one answer. `previous` is undefined for a brand-new card. */
export function review(previous: CardProgress | undefined, correct: boolean, today: string): CardProgress {
  const currentBox = previous?.box ?? 0; // new cards start "before" box 1
  const box = correct ? Math.min(currentBox + 1, MAX_BOX) : 1;
  return {
    box,
    due: addDays(today, INTERVAL_DAYS[box - 1]),
    lastReviewed: today,
    reviews: (previous?.reviews ?? 0) + 1,
    lapses: (previous?.lapses ?? 0) + (correct ? 0 : 1),
  };
}

export function isDue(progress: CardProgress, today: string): boolean {
  return progress.due <= today;
}

export interface DeckStats {
  total: number;
  /** Seen before and due today (or overdue). */
  due: number;
  /** Never reviewed. */
  fresh: number;
  /** In the top box. */
  mastered: number;
}

export function deckStats(cardIds: string[], progress: Record<string, CardProgress>, today: string): DeckStats {
  let due = 0;
  let fresh = 0;
  let mastered = 0;
  for (const id of cardIds) {
    const p = progress[id];
    if (!p) fresh++;
    else {
      if (isDue(p, today)) due++;
      if (p.box === MAX_BOX) mastered++;
    }
  }
  return { total: cardIds.length, due, fresh, mastered };
}

/** Maximum brand-new cards introduced in one session, to keep sessions manageable. */
export const NEW_PER_SESSION = 15;

/**
 * Build a study queue: due cards first (most overdue, then lowest box),
 * then up to `newLimit` unseen cards in their original order.
 */
export function buildQueue(
  cardIds: string[],
  progress: Record<string, CardProgress>,
  today: string,
  newLimit = NEW_PER_SESSION,
): string[] {
  const due = cardIds
    .filter((id) => progress[id] && isDue(progress[id], today))
    .sort((a, b) => progress[a].due.localeCompare(progress[b].due) || progress[a].box - progress[b].box);
  const fresh = cardIds.filter((id) => !progress[id]).slice(0, newLimit);
  return [...due, ...fresh];
}
