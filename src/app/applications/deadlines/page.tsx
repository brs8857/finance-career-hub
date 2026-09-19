import type { Metadata } from "next";
import { ApplicationsTabs } from "@/components/applications/ApplicationsTabs";
import { DeadlineList } from "@/components/applications/DeadlineList";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Deadlines" };

export default function DeadlinesPage() {
  return (
    <>
      <PageHeader title="Applications" description="Every deadline for applications you haven't submitted yet, soonest first." />
      <ApplicationsTabs />
      <DeadlineList />
    </>
  );
}
