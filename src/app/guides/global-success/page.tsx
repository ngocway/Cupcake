import type { Metadata } from "next";
import { GlobalSuccessGuideClient } from "./_components/GlobalSuccessGuideClient";

export const metadata: Metadata = {
  title: "How to Pick Your Grade & Unit (Global Success Books) | Dolcake Teacher Guide",
  description:
    "A 30-second quick guide for English teachers to open official Global Success Books (Grades 1–12), select a unit, and share ready-to-play learning games.",
};

export default function GlobalSuccessGuidePage() {
  return <GlobalSuccessGuideClient />;
}
