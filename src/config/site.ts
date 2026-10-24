export const site = Object.freeze({
  name: "Pramman Forensics Science Academy",
  shortName: "PFSA",
  contactEmail: "",
  contactPhone: "",
  registrationEnabled: true,
  apiBaseUrl: undefined as string | undefined,
  maxResumeBytes: 5 * 1024 * 1024,
});
export const navigation = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "internships", label: "Internships" },
  { id: "experience", label: "Learning Experience" },
  { id: "faqs", label: "FAQs" },
  { id: "contact", label: "Contact" },
] as const;
