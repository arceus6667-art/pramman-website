export const DOMAIN_NAMES = {
  "computer-cyber-forensics": "Computer / Cyber Forensics",
  "mobile-forensics": "Mobile Forensics",
  "network-forensics": "Network Forensics",
  "cloud-forensics": "Cloud Forensics",
  "database-forensics": "Database Forensics",
  "iot-forensics": "IoT Forensics",
} as const;
export type DomainId = keyof typeof DOMAIN_NAMES;
export const DOMAIN_IDS = Object.keys(DOMAIN_NAMES) as DomainId[];
export const APPLICATION_STATUSES = [
  "New",
  "Under Review",
  "Shortlisted",
  "Rejected",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
