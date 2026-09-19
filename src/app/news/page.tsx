import type { Metadata } from "next";
import { HeadlineFeed } from "@/components/news/HeadlineFeed";
import { NewsTabs } from "@/components/news/NewsTabs";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Commercial awareness" };

export default function NewsPage() {
  return (
    <>
      <PageHeader
        title="Commercial awareness"
        description="Today's business headlines from public feeds. Save the stories you'd discuss in an interview and write a three-part note: what happened, why it matters, what might happen next."
      />
      <NewsTabs />
      <HeadlineFeed />
    </>
  );
}
