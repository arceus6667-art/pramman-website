interface AcademyLogoProps {
  variant?: "compact" | "full";
}

/** The academy's supplied artwork, displayed in full without recoloring or cropping. */
export function AcademyLogo({ variant = "compact" }: AcademyLogoProps) {
  const size = variant === "full" ? 128 : 56;
  return (
    <img
      className={`academy-logo academy-logo--${variant}`}
      src="/pramaan-forensic-logo.jpg"
      width={size}
      height={size}
      alt="Pramaan Forensic logo: an investigator, magnifying glass, and fingerprint"
      decoding="async"
    />
  );
}
