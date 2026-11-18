import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { labelize, statusTone, type Tone } from "@/lib/labels";

const tones: Record<Tone, string> = {
  neutral: "border-line text-muted",
  good: "border-good/40 text-good",
  warn: "border-warn/40 text-warn",
  bad: "border-bad/40 text-bad",
  accent: "border-accent/40 text-accent-soft",
};

const variants = {
  primary: "bg-accent text-accent-ink hover:bg-accent-soft",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
  danger: "border border-bad/40 bg-bad/10 text-bad hover:bg-bad/20",
};

export function buttonClass(variant: keyof typeof variants = "primary", className?: string) {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("text-sm text-accent-soft underline-offset-4 hover:underline", className)}>
      {children}
    </Link>
  );
}

const control =
  "w-full rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none placeholder:text-faint focus:border-accent";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, "h-10", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(control, "min-h-28 py-2", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(control, "h-10", props.className)} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-ink">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-faint">{hint}</span> : null}
    </label>
  );
}

export function Badge({ children, status }: { children?: ReactNode; status?: string }) {
  const tone = statusTone(status ?? "neutral");
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", tones[tone])}>
      {children ?? (status ? labelize(status) : null)}
    </span>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-line bg-surface", className)}>{children}</section>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs uppercase tracking-[0.16em] text-faint">{eyebrow}</p> : null}
        <h1 className="mt-1 font-serif text-4xl tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Panel className="p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-faint">{label}</p>
      <p className="mt-2 font-serif text-3xl tabular-nums text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-muted">{detail}</p> : null}
    </Panel>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Panel className="px-6 py-10">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Panel>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-line bg-surface-2 px-3 py-2 text-sm leading-6 text-muted">{children}</p>;
}

export const thClass = "border-b border-line px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.14em] text-faint";
export const tdClass = "border-b border-line px-3 py-3 align-top text-sm";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-serif text-2xl tracking-tight text-ink">
      <span className="inline-block h-4 w-1.5 bg-accent" aria-hidden />
      Castline
    </Link>
  );
}
