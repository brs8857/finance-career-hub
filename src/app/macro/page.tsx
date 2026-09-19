import type { Metadata } from "next";
import { MacroDashboard } from "@/components/macro/MacroDashboard";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Macro" };

export default function MacroPage() {
  return (
    <>
      <PageHeader
        title="Macro"
        description="The four numbers every interviewer expects you to know, for the UK and US, plus the yield curve. Official sources only: ONS, Bank of England, US Treasury and FRED."
      />
      <MacroDashboard />
    </>
  );
}
