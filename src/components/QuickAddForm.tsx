"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { createApplication } from "@/app/actions";
import { STAGES, STAGE_META } from "@/lib/stages";
import { EMPTY_FORM_STATE } from "@/lib/validation";

import { SubmitButton } from "./SubmitButton";

/**
 * `useActionState` wires a server action to a form and hands back whatever the
 * action returned — used here to render validation errors next to the inputs
 * without any client-side validation library or fetch call.
 */
export function QuickAddForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createApplication, EMPTY_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen(true)} className="btn-primary">
          + Add application
        </button>
        {state.ok && state.message && (
          <span className="text-xs text-muted">{state.message}</span>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <label className="label" htmlFor="company">
            Company *
          </label>
          <input id="company" name="company" className="field" placeholder="Acme" />
          {state.errors?.company && (
            <span className="error-text">{state.errors.company}</span>
          )}
        </div>

        <div className="lg:col-span-1">
          <label className="label" htmlFor="role">
            Role *
          </label>
          <input
            id="role"
            name="role"
            className="field"
            placeholder="SDE Intern"
          />
          {state.errors?.role && <span className="error-text">{state.errors.role}</span>}
        </div>

        <div>
          <label className="label" htmlFor="stage">
            Stage
          </label>
          <select id="stage" name="stage" className="field" defaultValue="WISHLIST">
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_META[stage].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="url">
            Posting link
          </label>
          <input
            id="url"
            name="url"
            className="field"
            placeholder="https://…"
            inputMode="url"
          />
          {state.errors?.url && <span className="error-text">{state.errors.url}</span>}
        </div>

        <div>
          <label className="label" htmlFor="nextActionAt">
            Follow up on
          </label>
          <input id="nextActionAt" name="nextActionAt" type="date" className="field" />
          {state.errors?.nextActionAt && (
            <span className="error-text">{state.errors.nextActionAt}</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <SubmitButton pendingLabel="Adding…">Add</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          Close
        </button>
        <p className="ml-auto text-xs text-muted">
          Everything else can be filled in on the detail page.
        </p>
      </div>
    </form>
  );
}
