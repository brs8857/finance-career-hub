import type { Metadata } from "next";
import { NewsTabs } from "@/components/news/NewsTabs";
import { NotesArchive } from "@/components/news/NotesArchive";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Notes archive" };

export default function NotesArchivePage() {
  return (
    <>
      <PageHeader
        title="Commercial awareness"
        description="Your saved stories and notes. Search or filter by tag to revise a theme before an interview."
      />
      <NewsTabs />
      <NotesArchive />
    </>
  );
}
