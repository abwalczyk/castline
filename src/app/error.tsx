"use client";

import { buttonClass } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center bg-canvas px-6 text-ink">
      <div className="max-w-lg">
        <h1 className="font-serif text-4xl">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-muted">The page could not be loaded. Try it again. If this keeps happening, the database may still be starting.</p>
        <button className={`${buttonClass()} mt-6`} onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
