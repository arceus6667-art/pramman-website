import { ArrowUpRight } from "lucide-react";
import { Modal } from "./Modal";
import type { InternshipDomain } from "../types/internship";
export function DomainDetails({
  domain,
  onClose,
  onRegister,
}: {
  domain: InternshipDomain;
  onClose: () => void;
  onRegister: () => void;
}) {
  return (
    <Modal titleId="domain-title" onClose={onClose}>
      <div className="eyebrow">EXPLORE THE PATHWAY</div>
      <h2 id="domain-title">{domain.name}</h2>
      <p>{domain.description}</p>
      <h3>Detailed learning topics</h3>
      <ul>
        {domain.topics.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <h3>Learning objectives</h3>
      <ul>
        {domain.objectives.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <h3>Simulated forensic exercises</h3>
      <ul>
        {domain.exercises.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <p className="preview-note">
        Proposed learning outline using synthetic or authorized sample data.
        Dates, eligibility, and final activities will be confirmed before
        applications open.
      </p>
      <button className="button" onClick={onRegister}>
        Register Now <ArrowUpRight size={17} />
      </button>
    </Modal>
  );
}
