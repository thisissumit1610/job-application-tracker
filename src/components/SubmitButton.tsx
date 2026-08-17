"use client";

import { useFormStatus } from "react-dom";

/**
 * `useFormStatus` reads the pending state of the nearest parent `<form>`.
 * It only works in a component rendered *inside* that form — which is why this
 * is a separate component rather than a hook call in the form itself.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = "btn-primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}
