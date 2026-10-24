import type { InternshipDomain } from "../types/internship";
export const domains: readonly InternshipDomain[] = [
  {
    id: "computer-cyber-forensics",
    name: "Computer / Cyber Forensics",
    description:
      "Uncover the traces left behind on computers and digital storage systems.",
    topics: [
      "Digital evidence & file artifacts",
      "Operating systems & storage analysis",
      "Incident investigation",
    ],
    icon: "Monitor",
    objectives: [
      "Identify common file artifacts and explain preservation principles.",
      "Describe a defensible sequence for examining storage evidence.",
    ],
    exercises: [
      "Compare hashes of supplied sample files.",
      "Build an event timeline from synthetic file metadata.",
    ],
  },
  {
    id: "mobile-forensics",
    name: "Mobile Forensics",
    description:
      "Explore the evidence within mobile devices and the apps we use every day.",
    topics: [
      "Mobile evidence & device artifacts",
      "App records & data preservation",
      "Investigation reports",
    ],
    icon: "Smartphone",
    objectives: [
      "Recognize mobile artifacts and their limitations.",
      "Explain preservation and clear reporting.",
    ],
    exercises: [
      "Interpret a synthetic application-record dataset.",
      "Draft a findings report from supplied mobile artifacts.",
    ],
  },
  {
    id: "network-forensics",
    name: "Network Forensics",
    description:
      "Follow digital conversations to understand how network incidents unfold.",
    topics: [
      "Packet analysis",
      "Network traffic & security events",
      "Digital incident reconstruction",
    ],
    icon: "Network",
    objectives: [
      "Explain packet and traffic analysis concepts.",
      "Correlate network events into an incident timeline.",
    ],
    exercises: [
      "Inspect a sanitized sample packet capture.",
      "Reconstruct a simulated incident from traffic records.",
    ],
  },
  {
    id: "cloud-forensics",
    name: "Cloud Forensics",
    description:
      "Trace evidence across the virtual infrastructure of a connected world.",
    topics: [
      "Cloud audit logs & access records",
      "Virtual infrastructure",
      "Cloud storage evidence",
    ],
    icon: "Cloud",
    objectives: [
      "Identify sources of cloud evidence.",
      "Correlate access and audit events while considering shared responsibility.",
    ],
    exercises: [
      "Review synthetic cloud audit logs.",
      "Trace a simulated storage-access event.",
    ],
  },
  {
    id: "database-forensics",
    name: "Database Forensics",
    description:
      "Examine the records, changes, and hidden context within structured data.",
    topics: [
      "Transaction logs & metadata",
      "Data integrity",
      "Suspicious modifications",
    ],
    icon: "Database",
    objectives: [
      "Interpret transactions and metadata.",
      "Explain integrity checks and identify potentially suspicious changes.",
    ],
    exercises: [
      "Compare supplied database snapshots.",
      "Reconstruct changes using a synthetic transaction log.",
    ],
  },
  {
    id: "iot-forensics",
    name: "IoT Forensics",
    description:
      "Connect the clues from smart devices, sensors, and their digital ecosystems.",
    topics: [
      "Smart devices & connected sensors",
      "IoT logs & device evidence",
      "Event reconstruction",
    ],
    icon: "Cpu",
    objectives: [
      "Identify evidence sources across connected devices.",
      "Correlate sensor and device events with attention to clock differences.",
    ],
    exercises: [
      "Review synthetic smart-device logs.",
      "Reconstruct a simulated event from connected-sensor records.",
    ],
  },
];
