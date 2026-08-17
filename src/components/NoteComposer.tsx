"use client";

import { useActionState, useEffect, useRef } from "react";

import { addNote } from "@/app/actions";
import { EMPTY_FORM_STATE } from "@/lib/validation";

import { SubmitButton } from "./SubmitButton";

export function NoteComposer({ applicationId }: { applicationId: string }) {
  // `bind` pre-fills the first argument, so the action still receives
  // (prevState, formData) in the positions useActionState expects.
  const [state, formAction] = useActionState(
    addNote.bind(null, applicationId),
    EMPTY_FORM_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <textarea
        name="body"
        rows={3}
        className="field resize-y"
        placeholder="Recruiter call went well — they asked about the OS project. Round 2 next week."
      />
      {state.errors?.body && <span className="error-text">{state.errors.body}</span>}
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Adding…">Add note</SubmitButton>
      </div>
    </form>
  );
}
