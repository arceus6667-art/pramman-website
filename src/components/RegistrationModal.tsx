import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FileUp, LoaderCircle, CheckCircle2, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import type { InternshipDomain } from "../types/internship";
import type {
  FieldErrors,
  RegistrationFields,
  RegistrationResult,
} from "../types/registration";
import {
  submitRegistration,
  validateRegistration,
} from "../services/registration";
import { ApiError, publicConfig } from "../services/api";
import type { PublicConfig } from "../services/api";
const empty: RegistrationFields = {
  fullName: "",
  email: "",
  stream: "",
  college: "",
  resume: null,
  reason: "",
  consent: false,
};
export function RegistrationModal({
  domain,
  onClose,
}: {
  domain: InternshipDomain;
  onClose: () => void;
}) {
  const [fields, setFields] = useState<RegistrationFields>(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [policy, setPolicy] = useState<PublicConfig | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const successHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let current = true;
    publicConfig()
      .then((config) => {
        if (current) setPolicy(config);
      })
      .catch(() => {
        if (current)
          setMessage(
            "Applications are not available on this website yet. Please check back for registration updates.",
          );
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    if (result) successHeading.current?.focus();
  }, [result]);
  function update(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const input = event.target;
    const value =
      input instanceof HTMLInputElement && input.type === "file"
        ? (input.files?.[0] ?? null)
        : input instanceof HTMLInputElement && input.type === "checkbox"
          ? input.checked
          : input.value;
    const next = { ...fields, [input.name]: value };
    setFields(next);
    if (Object.keys(errors).length) setErrors(validateRegistration(next));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    const next = validateRegistration(fields);
    setErrors(next);
    setMessage("");
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    if (!policy || !fields.resume) {
      setMessage("The registration service is not ready. Please try again.");
      return;
    }
    busy.current = true;
    setLoading(true);
    try {
      const response = await submitRegistration(
        { ...fields, domainId: domain.id, resume: fields.resume },
        policy.csrfToken,
      );
      setResult(response);
      setFields(empty);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Submission failed. Please try again.",
      );
      if (error instanceof ApiError && error.fields) {
        const mapped: FieldErrors = {};
        for (const key of Object.keys(empty) as (keyof RegistrationFields)[])
          if (error.fields[key]) mapped[key] = error.fields[key][0];
        setErrors(mapped);
      }
      if (error instanceof ApiError && error.status === 403) {
        try {
          setPolicy(await publicConfig());
        } catch {
          /* Existing error remains visible. */
        }
      }
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  const textFields = [
    {
      name: "fullName",
      label: "Full Name",
      placeholder: "Your full name",
      autocomplete: "name",
      max: 120,
    },
    {
      name: "email",
      label: "Email Address",
      placeholder: "you@example.com",
      autocomplete: "email",
      max: 254,
    },
    {
      name: "stream",
      label: "Current Stream of Study",
      placeholder: "e.g. B.Tech AI & ML",
      autocomplete: "off",
      max: 180,
    },
    {
      name: "college",
      label: "College / University Name",
      placeholder: "Full name of your institution",
      autocomplete: "organization",
      max: 240,
    },
  ] as const;
  return (
    <Modal
      titleId="registration-title"
      className="registration-modal"
      onClose={() => {
        if (!busy.current) onClose();
      }}
    >
      <div className="eyebrow">PRAMMAN FORENSICS SCIENCE ACADEMY</div>
      {result ? (
        <div className="registration-success">
          <CheckCircle2 size={42} aria-hidden="true" />
          <h2 id="registration-title" ref={successHeading} tabIndex={-1}>
            Registration Submitted Successfully!
          </h2>
          <p>Your application has been received for review.</p>
          <div className="domain-context">
            <span>Application reference</span>
            <strong className="application-reference">
              {result.applicationReference}
            </strong>
            <span>Applied domain</span>
            <h3>{result.domainTitle}</h3>
          </div>
          <p>
            Keep this reference for enquiries. Submission does not guarantee
            selection, admission, or certification.
          </p>
          <button className="button" onClick={onClose}>
            Back to Internships
          </button>
        </div>
      ) : (
        <>
          <h2 id="registration-title">Internship Registration</h2>
          <div className="domain-context">
            <span>Apply for</span>
            <h3>{domain.name} Internship</h3>
          </div>
          <p className="preview-note">
            One application per email address per domain. You may apply to
            different domains independently.
          </p>
          <form ref={formRef} onSubmit={submit} noValidate>
            <fieldset disabled={loading} className="registration-fields">
              <div className="form-grid">
                {textFields.map((field) => (
                  <label key={field.name} htmlFor={field.name}>
                    {field.label}
                    <input
                      id={field.name}
                      name={field.name}
                      value={fields[field.name]}
                      type={field.name === "email" ? "email" : "text"}
                      autoComplete={field.autocomplete}
                      placeholder={field.placeholder}
                      required
                      maxLength={field.max}
                      onChange={update}
                      aria-invalid={Boolean(errors[field.name])}
                      aria-describedby={
                        errors[field.name] ? `${field.name}-error` : undefined
                      }
                    />
                    {errors[field.name] && (
                      <small className="field-error" id={`${field.name}-error`}>
                        {errors[field.name]}
                      </small>
                    )}
                  </label>
                ))}
              </div>
              <label htmlFor="resume">
                Upload Your Resume
                <span className="file-upload">
                  <span className="flex items-center gap-2">
                    <FileUp size={17} />
                    Choose a PDF, DOC, or DOCX resume
                  </span>
                  <input
                    ref={fileRef}
                    id="resume"
                    name="resume"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    required
                    onChange={update}
                    aria-invalid={Boolean(errors.resume)}
                    aria-describedby="resume-help resume-error"
                  />
                </span>
                <small id="resume-help">
                  Maximum 5 MB. Files are stored privately for application
                  review.
                </small>
                <small className="field-error" id="resume-error">
                  {errors.resume}
                </small>
              </label>
              {fields.resume && (
                <div className="selected-file">
                  <span>
                    {fields.resume.name} ·{" "}
                    {(fields.resume.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    type="button"
                    aria-label="Remove selected resume"
                    onClick={() => {
                      setFields({ ...fields, resume: null });
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              <label htmlFor="reason">
                Why Do You Want to Join This Internship?
                <textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  value={fields.reason}
                  onChange={update}
                  required
                  minLength={20}
                  maxLength={3000}
                  placeholder="Tell us about your interest in forensic science, your learning goals, and why you want to join this internship."
                  aria-invalid={Boolean(errors.reason)}
                  aria-describedby="reason-help reason-error"
                />
                <small id="reason-help">
                  20–3,000 characters · {fields.reason.length}/3,000
                </small>
                <small className="field-error" id="reason-error">
                  {errors.reason}
                </small>
              </label>
              <label className="consent" htmlFor="consent">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  checked={fields.consent}
                  onChange={update}
                  required
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby="consent-error"
                />
                <span>
                  I agree to the processing of my application details and
                  uploaded resume for internship application review, as
                  described in the{" "}
                  <a
                    className="privacy-link"
                    href="#privacy-notice"
                    onClick={() =>
                      document
                        .querySelector<HTMLDetailsElement>("#privacy-notice")
                        ?.setAttribute("open", "")
                    }
                  >
                    Privacy Notice
                  </a>
                  .
                </span>
              </label>
              <p className="field-error" id="consent-error">
                {errors.consent}
              </p>
              <details id="privacy-notice" className="privacy-notice">
                <summary>
                  Privacy Notice <span>+</span>
                </summary>
                {policy ? (
                  <p>
                    Pramman Forensics Science Academy collects your name, email,
                    stream, institution, reason for joining, and resume solely
                    to review and manage this internship application. Only the
                    authenticated academy administrator can view applications or
                    download resumes. The local server stores this information
                    on its filesystem; it is not sent to a cloud database.
                    Active applications and resumes are deleted after{" "}
                    {policy.retentionDays} days, with maintenance on startup and
                    hourly while the server runs. Offline backups may retain
                    data for up to seven additional days. To request access,
                    correction, or deletion, email{" "}
                    <a href={`mailto:${policy.privacyEmail}`}>
                      {policy.privacyEmail}
                    </a>{" "}
                    with your reference and application email. The academy will
                    verify the request before deleting the record and resume.
                    Selection is not guaranteed. Do not upload identity
                    documents or unrelated sensitive information.
                  </p>
                ) : (
                  <p>
                    The registration service must be connected to display the
                    configured retention policy and privacy contact. Submission
                    is disabled until these details are available.
                  </p>
                )}
              </details>
              <button
                type="submit"
                className="button submit-button"
                disabled={loading || !policy?.registrationEnabled}
              >
                {loading ? (
                  <>
                    <LoaderCircle className="loading-spin" size={17} />
                    Submitting…
                  </>
                ) : (
                  "Submit Registration"
                )}
              </button>
            </fieldset>
            <p role="alert" className="field-error submission-error">
              {message}
            </p>
            {Object.keys(errors).length > 0 && (
              <p role="status" className="preview-note">
                Please correct the highlighted fields.
              </p>
            )}
          </form>
        </>
      )}
    </Modal>
  );
}
