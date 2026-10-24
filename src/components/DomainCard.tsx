import {
  Monitor,
  Smartphone,
  Network,
  Cloud,
  Database,
  Cpu,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";
import type { InternshipDomain } from "../types/internship";
const icons = { Monitor, Smartphone, Network, Cloud, Database, Cpu };
export interface DomainActionProps {
  domain: InternshipDomain;
  onExplore: (domain: InternshipDomain) => void;
  onRegister: (domain: InternshipDomain) => void;
}
export function DomainCard({
  domain,
  index,
  onExplore,
  onRegister,
}: DomainActionProps & { index: number }) {
  const Icon = icons[domain.icon];
  return (
    <motion.article
      className="domain-card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, delay: (index % 3) * 0.06 }}
    >
      <div className="card-top">
        <span className="domain-icon">
          <Icon aria-hidden="true" />
        </span>
        <span className="domain-number">0{index + 1} /</span>
      </div>
      <h3>{domain.name}</h3>
      <p>{domain.description}</p>
      <ul className="topic-list">
        {domain.topics.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <div className="card-actions">
        <button
          className="card-explore inline-flex items-center gap-2"
          onClick={() => onExplore(domain)}
          aria-label={`Explore ${domain.name}`}
        >
          Explore Domain <ArrowRight size={13} />
        </button>
        <button
          className="register-button inline-flex items-center gap-3"
          onClick={() => onRegister(domain)}
          aria-label={`Register for ${domain.name}`}
          aria-haspopup="dialog"
        >
          Register Now <ArrowUpRight size={14} />
        </button>
      </div>
    </motion.article>
  );
}
