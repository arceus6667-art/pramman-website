import type { DomainId } from "../../shared/domains";
export type { DomainId } from "../../shared/domains";
export type DomainIcon =
  "Monitor" | "Smartphone" | "Network" | "Cloud" | "Database" | "Cpu";
export interface InternshipDomain {
  id: DomainId;
  name: string;
  description: string;
  topics: readonly string[];
  objectives: readonly string[];
  exercises: readonly string[];
  icon: DomainIcon;
}
