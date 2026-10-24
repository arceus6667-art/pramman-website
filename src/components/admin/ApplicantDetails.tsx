import { useState } from "react";
import { ArrowLeft, Download, Save, Trash2 } from "lucide-react";
import type { ApplicationRecord } from "../../types/admin";
import { APPLICATION_STATUSES, DOMAIN_NAMES } from "../../../shared/domains";
import type { ApplicationStatus } from "../../../shared/domains";
import { request } from "../../services/api";
import { displayDate } from "./ApplicationsTable";
export function ApplicantDetails({
  application,
  csrfToken,
  onBack,
  onUpdated,
  onError,
}: {
  application: ApplicationRecord;
  csrfToken: string;
  onBack: () => void;
  onUpdated: () => void;
  onError: (error: unknown) => void;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      await request(`/api/admin/applications/${application.id}/status`, {
        method: "PATCH",
        headers: { "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ status }),
      });
      setMessage("Review status updated.");
      onUpdated();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !window.confirm(
        "Permanently delete this application and its resume? This cannot be undone.",
      )
    )
      return;
    setBusy(true);
    try {
      await request(`/api/admin/applications/${application.id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken },
      });
      onUpdated();
      onBack();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  }
  const values = [
    ["Application Reference", application.application_reference],
    ["Full Name", application.full_name],
    ["Email", application.email],
    ["Current Stream of Study", application.study_stream],
    ["College / University", application.college_university],
    ["Applied Internship Domain", DOMAIN_NAMES[application.domain_id]],
    [
      "Submitted Resume",
      `${application.resume_original_filename} · ${(application.resume_size / 1024).toFixed(1)} KB`,
    ],
    ["Registration Date and Time", displayDate(application.created_at)],
    ["Privacy Consent Accepted", displayDate(application.consent_accepted_at)],
    ["Current Review Status", application.status],
  ];
  return (
    <section className="admin-panel applicant-details">
      <button
        className="admin-text-button inline-flex items-center gap-2"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        Back to Applications
      </button>
      <h2>Application details</h2>
      <dl>
        {values.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <h3>Reason for joining</h3>
      <p className="joining-reason">{application.joining_reason}</p>
      <div className="detail-actions">
        <a
          className="button button-outline"
          href={`/api/admin/applications/${application.id}/resume`}
        >
          <Download size={16} />
          Download Resume
        </a>
        <label htmlFor="review-status">
          Change review status
          <select
            id="review-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ApplicationStatus)
            }
          >
            {APPLICATION_STATUSES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button className="button" disabled={busy} onClick={save}>
          <Save size={16} />
          Save Status
        </button>
      </div>
      <p role="status" className="validation-status">
        {message}
      </p>
      <div className="delete-zone">
        <p>
          Privacy request verified? This action deletes the active application
          and its resume. Backups expire separately.
        </p>
        <button className="danger-button" disabled={busy} onClick={remove}>
          <Trash2 size={15} />
          Delete application and resume
        </button>
      </div>
    </section>
  );
}
