"use client";

import { useActionState } from "react";

import { updateApplication } from "@/app/actions";
import type { Application } from "@/db/schema";
import { toDateInputValue } from "@/lib/dates";
import { PRIORITIES, SOURCES } from "@/lib/stages";
import { EMPTY_FORM_STATE } from "@/lib/validation";

import { SubmitButton } from "./SubmitButton";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export function ApplicationEditor({ application }: { application: Application }) {
  const [state, formAction] = useActionState(
    updateApplication.bind(null, application.id),
    EMPTY_FORM_STATE,
  );

  return (
    <form action={formAction} className="card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Company" error={state.errors?.company}>
          <input
            name="company"
            className="field"
            defaultValue={application.company}
          />
        </Field>

        <Field label="Role" error={state.errors?.role}>
          <input name="role" className="field" defaultValue={application.role} />
        </Field>

        <Field label="Location" error={state.errors?.location}>
          <input
            name="location"
            className="field"
            defaultValue={application.location ?? ""}
            placeholder="Bengaluru / Remote"
          />
        </Field>

        <Field label="Source" error={state.errors?.source}>
          <select
            name="source"
            className="field"
            defaultValue={application.source ?? ""}
          >
            <option value="">—</option>
            {SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Posting link" error={state.errors?.url}>
          <input
            name="url"
            className="field"
            defaultValue={application.url ?? ""}
            placeholder="https://…"
          />
        </Field>

        <Field label="Compensation" error={state.errors?.compensation}>
          <input
            name="compensation"
            className="field"
            defaultValue={application.compensation ?? ""}
            placeholder="₹ / stipend / band"
          />
        </Field>

        <Field label="Contact name" error={state.errors?.contactName}>
          <input
            name="contactName"
            className="field"
            defaultValue={application.contactName ?? ""}
          />
        </Field>

        <Field label="Contact email" error={state.errors?.contactEmail}>
          <input
            name="contactEmail"
            className="field"
            defaultValue={application.contactEmail ?? ""}
            inputMode="email"
          />
        </Field>

        <Field label="Priority" error={state.errors?.priority}>
          <select
            name="priority"
            className="field"
            defaultValue={String(application.priority)}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Applied on" error={state.errors?.appliedAt}>
          <input
            name="appliedAt"
            type="date"
            className="field"
            defaultValue={toDateInputValue(application.appliedAt)}
          />
        </Field>

        <Field label="Follow up on" error={state.errors?.nextActionAt}>
          <input
            name="nextActionAt"
            type="date"
            className="field"
            defaultValue={toDateInputValue(application.nextActionAt)}
          />
        </Field>

        <Field label="Follow-up note" error={state.errors?.nextActionNote}>
          <input
            name="nextActionNote"
            className="field"
            defaultValue={application.nextActionNote ?? ""}
            placeholder="Ping the recruiter"
          />
        </Field>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <SubmitButton>Save changes</SubmitButton>
        {state.ok && state.message && (
          <span className="text-xs text-muted">{state.message}</span>
        )}
      </div>
    </form>
  );
}
