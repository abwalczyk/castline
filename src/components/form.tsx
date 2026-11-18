"use client";

import { useActionState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { buttonClass } from "@/components/ui";

export function Form({
  action,
  children,
  className,
  encType,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  encType?: "multipart/form-data" | "application/x-www-form-urlencoded";
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  return (
    <form action={formAction} className={className} encType={encType}>
      {state.error ? (
        <p role="alert" className="mb-4 rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="mb-4 rounded-md border border-good/40 bg-good/10 px-3 py-2 text-sm text-good">{state.ok}</p>
      ) : null}
      {children}
    </form>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Working…",
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button {...props} className={buttonClass(variant, className)} disabled={pending || props.disabled}>
      {pending ? pendingLabel : children}
    </button>
  );
}
