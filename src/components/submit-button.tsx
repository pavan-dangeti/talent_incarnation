"use client";

import { useFormStatus } from "react-dom";

/** A primary submit button that disables itself and shows progress while the form is pending. */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={`${className} disabled:opacity-60`} disabled={disabled || pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
