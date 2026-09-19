import type { Metadata } from "next";
import { DeckOverview } from "@/components/flashcards/DeckOverview";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Flashcards" };

export default function FlashcardsPage() {
  return (
    <>
      <PageHeader
        title="Technical flashcards"
        description="Accounting, corporate finance and economics questions that come up in interviews and assessment centres, scheduled with spaced repetition."
      />
      <DeckOverview />
    </>
  );
}
