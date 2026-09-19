import type { Metadata } from "next";
import { StudySession } from "@/components/flashcards/StudySession";
import { PageHeader } from "@/components/ui/Card";
import { deckName, isDeckId } from "@/content/decks";

export const metadata: Metadata = { title: "Study" };

// Next.js 16: searchParams is a Promise.
export default async function StudyPage({ searchParams }: PageProps<"/flashcards/study">) {
  const { deck } = await searchParams;
  const deckId = typeof deck === "string" && isDeckId(deck) ? deck : null;
  return (
    <>
      <PageHeader
        title={deckId ? `Study: ${deckName(deckId)}` : "Study: all decks"}
        description="Space shows the answer. Then press 1 if you didn't know it, 2 if you did."
      />
      <StudySession deckId={deckId} />
    </>
  );
}
