import type { ApplicationRecord } from "../../types/admin";
import { DOMAIN_NAMES } from "../../../shared/domains";
export const displayDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
export function ApplicationsTable({
  rows,
  onView,
  compact = false,
}: {
  rows: ApplicationRecord[];
  onView: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      aria-label="Scrollable applications table"
    >
      <table className="applications-table">
        <caption className="sr-only">
          {compact
            ? "Recent internship applications"
            : "Internship registrations matching current filters"}
        </caption>
        <thead>
          <tr>
            <th scope="col">Application reference</th>
            <th scope="col">Student</th>
            {!compact && (
              <>
                <th scope="col">Current stream</th>
                <th scope="col">College / university</th>
              </>
            )}
            <th scope="col">Domain</th>
            <th scope="col">Registered</th>
            <th scope="col">Status</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="reference-cell">{row.application_reference}</td>
              <td>
                <strong>{row.full_name}</strong>
                <span>{row.email}</span>
              </td>
              {!compact && (
                <>
                  <td>{row.study_stream}</td>
                  <td>{row.college_university}</td>
                </>
              )}
              <td>{DOMAIN_NAMES[row.domain_id]}</td>
              <td>{displayDate(row.created_at)}</td>
              <td>
                <span
                  className={`status-badge status-${row.status.toLowerCase().replace(" ", "-")}`}
                >
                  {row.status}
                </span>
              </td>
              <td>
                <button
                  className="admin-text-button"
                  onClick={() => onView(row.id)}
                  aria-label={`View application for ${row.full_name}`}
                >
                  View Details →
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={compact ? 6 : 8} className="table-empty">
                No registrations found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
