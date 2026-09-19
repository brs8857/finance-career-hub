"use client";

import { useCallback, useMemo } from "react";
import { DECKS, SEEDED_CARDS, type DeckId, type Flashcard } from "@/content/decks";
import { todayIsoDate } from "@/lib/format";
import { deckStats, review, type DeckStats } from "@/lib/srs/leitner";
import { newId, type CustomCard } from "@/lib/store/collections";
import { useCollection } from "@/lib/store/useCollection";

/** Seeded + custom cards, Leitner progress and the daily review log, in one place. */
export function useFlashcards() {
  const progressCol = useCollection("cardProgress");
  const customCol = useCollection("customCards");
  const logCol = useCollection("reviewLog");

  const status =
    progressCol.status === "error" || customCol.status === "error" || logCol.status === "error"
      ? "error"
      : progressCol.status === "ready" && customCol.status === "ready" && logCol.status === "ready"
        ? "ready"
        : "loading";
  const error = progressCol.error ?? customCol.error ?? logCol.error;
  const saveError = progressCol.saveError ?? customCol.saveError ?? logCol.saveError;

  const progress = useMemo(() => progressCol.data ?? {}, [progressCol.data]);
  const custom = useMemo(() => customCol.data ?? [], [customCol.data]);

  const cards: Flashcard[] = useMemo(
    () => [...SEEDED_CARDS, ...custom.map((c) => ({ id: c.id, deckId: c.deckId, front: c.front, back: c.back, topic: "My card" }))],
    [custom],
  );
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const today = todayIsoDate();
  const stats = useMemo(() => {
    const out = {} as Record<DeckId, DeckStats>;
    for (const deck of DECKS) {
      out[deck.id] = deckStats(cards.filter((c) => c.deckId === deck.id).map((c) => c.id), progress, today);
    }
    return out;
  }, [cards, progress, today]);
  const totals = useMemo(() => deckStats(cards.map((c) => c.id), progress, today), [cards, progress, today]);

  const { update: updateProgress } = progressCol;
  const { update: updateLog } = logCol;
  const { update: updateCustom } = customCol;

  /** Record an answer: move the card between Leitner boxes and log today's count. */
  const answer = useCallback(
    (cardId: string, correct: boolean) => {
      const day = todayIsoDate();
      updateProgress((all) => ({ ...all, [cardId]: review(all[cardId], correct, day) }));
      updateLog((log) => {
        const existing = log.find((d) => d.date === day);
        if (!existing) return [...log, { date: day, reviewed: 1, correct: correct ? 1 : 0 }];
        return log.map((d) => (d.date === day ? { ...d, reviewed: d.reviewed + 1, correct: d.correct + (correct ? 1 : 0) } : d));
      });
    },
    [updateProgress, updateLog],
  );

  const addCard = useCallback(
    (deckId: DeckId, front: string, back: string) => {
      const card: CustomCard = { id: `my-${newId()}`, deckId, front, back, createdAt: new Date().toISOString() };
      updateCustom((all) => [...all, card]);
    },
    [updateCustom],
  );

  const editCard = useCallback(
    (id: string, patch: Pick<CustomCard, "front" | "back" | "deckId">) =>
      updateCustom((all) => all.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    [updateCustom],
  );

  const deleteCard = useCallback(
    (id: string) => {
      updateCustom((all) => all.filter((c) => c.id !== id));
      updateProgress((all) => {
        const next = { ...all };
        delete next[id];
        return next;
      });
    },
    [updateCustom, updateProgress],
  );

  return {
    status,
    error,
    saveError,
    cards,
    byId,
    custom,
    progress,
    log: logCol.data ?? [],
    stats,
    totals,
    today,
    answer,
    addCard,
    editCard,
    deleteCard,
  };
}
