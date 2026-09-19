import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Card";

// Placeholder until the "Today at a glance" home page is built (final phase).

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Today"
        description="Your daily base for markets, commercial awareness and interview prep. More panels land here as each section is built."
      />
      <Link href="/markets" className={buttonClasses("primary")}>
        Open the markets dashboard
      </Link>
    </>
  );
}
