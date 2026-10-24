import { domains } from "../data/domains";
import { DomainCard } from "./DomainCard";
import type { InternshipDomain } from "../types/internship";
export function InternshipDomains({
  onExplore,
  onRegister,
}: {
  onExplore: (domain: InternshipDomain) => void;
  onRegister: (domain: InternshipDomain) => void;
}) {
  return (
    <section className="section domains" id="internships">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">02 / FIND YOUR SPECIALIZATION</div>
            <h2>
              Six domains.
              <br />
              <span className="muted">One investigative mindset.</span>
            </h2>
          </div>
          <p>
            Follow the evidence across devices, networks,
            <br className="desktop-break" /> and the systems that connect them.
          </p>
        </div>
        <div className="domain-grid">
          {domains.map((domain, index) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              index={index}
              onExplore={onExplore}
              onRegister={onRegister}
            />
          ))}
        </div>
        <div className="section-footnote">
          <span className="live-dot" />
          Explore the proposed pathways and apply to your selected domain.
          Applications are reviewed independently.
        </div>
      </div>
    </section>
  );
}
