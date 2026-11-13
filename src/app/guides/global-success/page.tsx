import type { Metadata } from "next";
import { GlobalSuccessGuideClient } from "./_components/GlobalSuccessGuideClient";

export const metadata: Metadata = {
  title: "Global Success Books Teacher Guide",
  description:
    "Step-by-step user guide for English teachers to sign in to Dolcake Teacher Portal and browse Global Success Books (Grades 1–12).",
};

export default function GlobalSuccessGuidePage() {
  return <GlobalSuccessGuideClient />;
}

