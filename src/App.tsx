import { lazy, Suspense, useEffect, useState } from "react";
const AdminApp = lazy(() => import("./components/admin/AdminApp"));
import { MotionConfig } from "motion/react";
import { ArrowUp } from "lucide-react";
import type { InternshipDomain } from "./types/internship";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { InternshipDomains } from "./components/InternshipDomains";
import { LearningExperience } from "./components/LearningExperience";
import { WhyPFSA } from "./components/WhyPFSA";
import { FAQ } from "./components/FAQ";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { DomainDetails } from "./components/DomainDetails";
import { RegistrationModal } from "./components/RegistrationModal";
type ModalState = {
  kind: "details" | "registration";
  domain: InternshipDomain;
} | null;
export function App() {
  const [path, setPath] = useState(window.location.pathname);
  function navigate(pathname: string) {
    window.history.pushState({}, "", pathname);
    setPath(pathname);
    setModal(null);
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    const onPop = () => {
      setPath(window.location.pathname);
      setModal(null);
    };
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.ctrlKey &&
        event.altKey &&
        !event.metaKey &&
        event.code === "KeyA"
      ) {
        event.preventDefault();
        window.history.pushState({}, "", "/admin");
        setPath("/admin");
        setModal(null);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);
  useEffect(() => {
    document.title =
      path === "/admin"
        ? "PFSA — Administrator"
        : "PFSA — The science behind digital evidence";
  }, [path]);
  const [modal, setModal] = useState<ModalState>(null);
  if (path === "/admin")
    return (
      <MotionConfig reducedMotion="user">
        <Suspense
          fallback={
            <main className="admin-loading">
              Loading administrator workspace…
            </main>
          }
        >
          <AdminApp onHome={() => navigate("/")} />
        </Suspense>
      </MotionConfig>
    );
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <About />
        <InternshipDomains
          onExplore={(domain) => setModal({ kind: "details", domain })}
          onRegister={(domain) => setModal({ kind: "registration", domain })}
        />
        <LearningExperience />
        <WhyPFSA />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <a className="back-top" href="#home" aria-label="Scroll to top">
        <ArrowUp size={18} />
      </a>
      {modal?.kind === "details" && (
        <DomainDetails
          domain={modal.domain}
          onClose={() => setModal(null)}
          onRegister={() =>
            setModal({ kind: "registration", domain: modal.domain })
          }
        />
      )}{" "}
      {modal?.kind === "registration" && (
        <RegistrationModal
          key={modal.domain.id}
          domain={modal.domain}
          onClose={() => setModal(null)}
        />
      )}
    </MotionConfig>
  );
}
