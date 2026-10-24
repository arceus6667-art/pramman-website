import type { FieldErrors, RegistrationFields } from "../types/registration";
import { site } from "../config/site";
// Client validation complements independent server-side validation.
export function validateRegistration(fields: RegistrationFields): FieldErrors {
  const errors: FieldErrors = {};
  if (fields.fullName.trim().length < 2 || fields.fullName.trim().length > 120)
    errors.fullName = "Enter a full name between 2 and 120 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
    errors.email = "Enter a valid email address.";
  if (fields.stream.trim().length < 2 || fields.stream.trim().length > 180)
    errors.stream = "Enter your current stream of study.";
  if (fields.college.trim().length < 2 || fields.college.trim().length > 240)
    errors.college = "Enter your college or university name.";
  if (fields.reason.trim().length < 20 || fields.reason.trim().length > 3000)
    errors.reason = "Enter your learning goals in 20 to 3,000 characters.";
  if (!fields.consent)
    errors.consent = "Please read the privacy notice and provide consent.";
  if (!fields.resume) errors.resume = "Choose a resume file.";
  else if (!/\.(pdf|doc|docx)$/i.test(fields.resume.name))
    errors.resume = "Choose a PDF, DOC, or DOCX file.";
  else if (fields.resume.size > site.maxResumeBytes)
    errors.resume = "Choose a resume smaller than 5 MB.";
  else if (fields.resume.size === 0)
    errors.resume = "The selected file is empty.";
  return errors;
}

import { request } from "./api";
import type {
  RegistrationPayload,
  RegistrationResult,
} from "../types/registration";
export function submitRegistration(
  payload: RegistrationPayload,
  csrfToken: string,
): Promise<RegistrationResult> {
  const body = new FormData();
  body.set("domainId", payload.domainId);
  for (const key of [
    "fullName",
    "email",
    "stream",
    "college",
    "reason",
  ] as const)
    body.set(key, payload[key].trim());
  body.set("consent", String(payload.consent));
  body.set("resume", payload.resume);
  return request<RegistrationResult>("/api/applications", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
    body,
  });
}
