import { AcademyLogo } from "./AcademyLogo";
import { useEffect, useState } from "react";
import { academyInfo } from "../services/api";
import { site } from "../config/site";
export function Footer() {
  const [email, setEmail] = useState<string>(site.contactEmail);
  useEffect(() => {
    academyInfo()
      .then((config) => setEmail(config.privacyEmail))
      .catch(() => {});
  }, []);
  return (
    <>
      <footer>
        <div className="container">
          <div className="footer-top">
            <div>
              <a className="brand" href="#home">
                <AcademyLogo variant="full" />
                <span>
                  <b>
                    PFSA<span className="brand-dot">.</span>
                  </b>
                  <small>
                    PRAMMAN FORENSICS
                    <br />
                    SCIENCE ACADEMY
                  </small>
                </span>
              </a>
              <p>
                Building scientific understanding.
                <br />
                Inspiring the investigative mind.
              </p>
            </div>
            <div className="footer-nav">
              <a href="#about">About the Academy</a>
              <a href="#internships">Internship Domains</a>
              <a href="#experience">Learning Experience</a>
              <a href="#faqs">FAQs</a>
            </div>
            <div className="footer-contact">
              <span className="eyebrow">LET’S CONNECT</span>
              <p data-contact-placeholder>
                {email || "Contact details to be announced."}
              </p>
              <span className="outline-label">
                INDEPENDENT EDUCATION INITIATIVE
              </span>
            </div>
          </div>
          <div className="footer-disclaimer">
            PFSA is an emerging independent education initiative. Content
            describes proposed learning pathways. No government accreditation,
            institutional affiliation, certificate recognition, or placement
            guarantee is claimed. All practical learning is intended for
            authorized, ethical, simulated environments.
          </div>
          <div className="footer-bottom">
            <span>
              © <span>{new Date().getFullYear()}</span> Pramman Forensics
              Science Academy. All rights reserved.
            </span>
            <span>SCIENCE. EVIDENCE. UNDERSTANDING.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
