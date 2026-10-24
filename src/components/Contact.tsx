import { useEffect, useState } from "react";
import { site } from "../config/site";
import { academyInfo } from "../services/api";
export function Contact() {
  const [requested, setRequested] = useState(false);
  const [email, setEmail] = useState<string>(site.contactEmail);
  useEffect(() => {
    academyInfo()
      .then((config) => setEmail(config.privacyEmail))
      .catch(() => {});
  }, []);
  return (
    <>
      <section id="contact" className="contact-section">
        <div className="container contact-inner">
          <div className="eyebrow">YOUR NEXT CHAPTER STARTS WITH CURIOSITY</div>
          <h2>
            Begin Your Journey Into
            <br />
            <span>Digital Forensics.</span>
          </h2>
          <p>Look closer. Ask questions. Discover what the evidence reveals.</p>
          <div className="contact-actions">
            <a className="button" href="#internships">
              Explore Internships <span>↗</span>
            </a>
            <button
              className="button button-outline"
              onClick={() => {
                if (email) window.location.href = `mailto:${email}`;
                else setRequested(true);
              }}
            >
              Contact the Academy <span>→</span>
            </button>
          </div>
          <p className="contact-status" id="contact-status" aria-live="polite">
            {email ||
              (requested
                ? "The local registration service is unavailable. Contact details will appear when it is connected."
                : "Academy contact details will be announced.")}
          </p>
        </div>
      </section>
    </>
  );
}
