import { HomeDashboard } from "@/components/home/HomeDashboard";
import { TodayDate } from "@/components/home/TodayDate";
import { PageHeader } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Today"
        description={<TodayDate />}
      />
      <HomeDashboard />
    </>
  );
}
