import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(
    "press inline-flex h-12 items-center justify-center gap-2 rounded-sm px-4 text-base font-medium disabled:cursor-not-allowed disabled:opacity-40",
    variant === "primary" && "bg-fg text-surface",
    variant === "secondary" && "border border-line-strong bg-surface text-fg",
    variant === "ghost" && "bg-transparent text-fg",
    variant === "danger" && "bg-danger-soft text-danger",
    className,
  );
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function IconButton({
  label,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "press inline-flex size-11 items-center justify-center rounded-sm border border-line-strong bg-surface text-fg disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("field", className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field", className)} {...props} />;
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error ? <span className="text-danger">{error}</span> : hint ? <span className="text-muted">{hint}</span> : null}
    </label>
  );
}
