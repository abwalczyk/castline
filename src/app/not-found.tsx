import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center bg-canvas px-6 text-ink">
      <div>
        <h1 className="font-serif text-4xl">That page is not here</h1>
        <p className="mt-3 text-sm text-muted">The link may have expired, or the record is not visible to this account.</p>
        <Link href="/" className={`${buttonClass()} mt-6`}>
          Back to Castline
        </Link>
      </div>
    </div>
  );
}
