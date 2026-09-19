import type { Metadata } from "next";
import { ApplicationsTabs } from "@/components/applications/ApplicationsTabs";
import { KanbanBoard } from "@/components/applications/KanbanBoard";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return (
    <>
      <PageHeader
        title="Applications"
        description="Track spring weeks, internships, graduate schemes and apprenticeships from first research to offer. You add every employer and deadline yourself - nothing is pre-filled."
      />
      <ApplicationsTabs />
      <KanbanBoard />
    </>
  );
}
