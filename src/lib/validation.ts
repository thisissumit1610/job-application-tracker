import { z } from "zod";

import { SOURCES, STAGES } from "./stages";

/** Turns "" into null so empty optional inputs don't get stored as blanks. */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable();

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), {
    message: "Not a valid date",
  })
  // `new Date("2026-08-17")` parses as UTC midnight, which can land on the
  // previous day in a negative-offset timezone. Splitting the parts and using
  // the local-time constructor keeps the date the user picked.
  .transform((value) => {
    if (value === null) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  });

const optionalUrl = optionalText.refine(
  (value) => {
    if (value === null) return true;
    return /^https?:\/\/\S+$/i.test(value);
  },
  { message: "Must start with http:// or https://" },
);

const optionalEmail = optionalText.refine(
  (value) => value === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value),
  { message: "Not a valid email address" },
);

export const quickAddSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(120),
  role: z.string().trim().min(1, "Role is required").max(160),
  stage: z.enum(STAGES),
  url: optionalUrl,
  nextActionAt: optionalDate,
});

export const applicationSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(120),
  role: z.string().trim().min(1, "Role is required").max(160),
  location: optionalText,
  source: optionalText.refine(
    (value) => value === null || (SOURCES as readonly string[]).includes(value),
    { message: "Unknown source" },
  ),
  url: optionalUrl,
  compensation: optionalText,
  contactName: optionalText,
  contactEmail: optionalEmail,
  priority: z.coerce.number().int().min(1).max(3),
  appliedAt: optionalDate,
  nextActionAt: optionalDate,
  nextActionNote: optionalText,
});

export const noteSchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(5000),
});

export type FormState = {
  ok: boolean;
  /** Field name -> first error message, ready to render under each input. */
  errors?: Record<string, string>;
  message?: string;
};

export const EMPTY_FORM_STATE: FormState = { ok: false };

/** Collapses a ZodError into the flat shape `FormState` wants. */
export function toFormErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}
