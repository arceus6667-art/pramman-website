import { AcademyLogo } from "../AcademyLogo";
import { useState } from "react";
import type { FormEvent } from "react";
import { LockKeyhole, LoaderCircle } from "lucide-react";
import { request } from "../../services/api";
import type { AdminSession } from "../../types/admin";
export function AdminLogin({
  session,
  onLogin,
  onHome,
}: {
  session: AdminSession;
  onLogin: (session: AdminSession) => void;
  onHome: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const next = await request<AdminSession>("/api/admin/login", {
        method: "POST",
        headers: { "X-CSRF-Token": session.csrfToken },
        body: JSON.stringify({ username, password }),
      });
      setPassword("");
      onLogin(next);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-login">
      <a
        className="brand"
        href="/"
        onClick={(event) => {
          event.preventDefault();
          onHome();
        }}
      >
        <AcademyLogo />
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
      <section className="admin-login-card">
        <LockKeyhole size={30} className="cyan" aria-hidden="true" />
        <div className="eyebrow">PRIVATE ACADEMY WORKSPACE</div>
        <h1>Administrator</h1>
        <p>Sign in to review internship applications.</p>
        <form onSubmit={submit}>
          <label htmlFor="admin-username">
            Username
            <input
              id="admin-username"
              autoComplete="username"
              required
              value={username}
              maxLength={80}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label htmlFor="admin-password">
            Password
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              maxLength={72}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="button submit-button" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="loading-spin" size={17} />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
          <p role="alert" className="field-error">
            {error}
          </p>
        </form>
        <p className="admin-help">
          Administrator access is provisioned locally. There is no public
          account registration.
        </p>
      </section>
    </main>
  );
}
