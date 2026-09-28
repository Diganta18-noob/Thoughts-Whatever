import type { Metadata } from "next";
import { LetterConfirmClient } from "./letter-confirm-client";

export const metadata: Metadata = {
  title: "Confirm The Letter",
  robots: { index: false, follow: false },
};

export default function LetterConfirmPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <main className="mx-auto max-w-measure px-4 py-20 sm:px-6">
      <LetterConfirmClient token={searchParams.token ?? ""} />
    </main>
  );
}
