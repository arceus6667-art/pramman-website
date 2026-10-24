import type { ApplicationRow } from "./database.js";
import { DOMAIN_NAMES } from "../shared/domains.js";
function cell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))
    text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export const csvHeaders = [
  "Application Reference",
  "Full Name",
  "Email Address",
  "Current Stream of Study",
  "College / University",
  "Internship Domain",
  "Reason for Joining",
  "Resume Filename",
  "Resume Identifier",
  "Application Status",
  "Registration Date",
  "Consent Timestamp",
];
export function applicationCsv(rows: ApplicationRow[]) {
  return (
    "\ufeff" +
    [
      csvHeaders,
      ...rows.map((r) => [
        r.application_reference,
        r.full_name,
        r.email,
        r.study_stream,
        r.college_university,
        DOMAIN_NAMES[r.domain_id as keyof typeof DOMAIN_NAMES],
        r.joining_reason,
        r.resume_original_filename,
        r.resume_stored_filename,
        r.status,
        r.created_at,
        r.consent_accepted_at,
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n") +
    "\r\n"
  );
}
