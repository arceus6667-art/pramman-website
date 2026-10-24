import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import bcrypt from "bcryptjs";
import { createApp } from "../backend/app.js";
import { openDatabase } from "../backend/database.js";
import type { Config } from "../backend/config.js";

test("React admin interface works with the actual local API", async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/admin",
  });
  const properties = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries(properties)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  }
  const { createElement } = await import("react");
  const { render, fireEvent, waitFor, cleanup, within, act } =
    await import("@testing-library/react");
  const { default: AdminApp } =
    await import("../src/components/admin/AdminApp");
  const root = mkdtempSync(join(tmpdir(), "pfsa-ui-test-"));
  const config: Config = {
    dataDir: join(root, "data"),
    uploadsDir: join(root, "uploads"),
    port: 3001,
    host: "127.0.0.1",
    sessionSecret: "s".repeat(64),
    secureCookies: false,
    origins: ["http://localhost"],
    privacyEmail: "privacy@example.invalid",
    retentionDays: 180,
    sessionHours: 8,
    mode: "test",
    submissionLimit: 100,
    loginLimit: 100,
  };
  const db = openDatabase(config);
  const password = "Synthetic-UI-Password-82!";
  db.prepare("INSERT INTO administrators VALUES(1,?,?)").run(
    "test-admin",
    bcrypt.hashSync(password, 4),
  );
  const server = createApp(config, db).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  let cookie = "";
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const response = await nativeFetch(new URL(String(input), base), {
      ...init,
      headers: { ...(cookie ? { Cookie: cookie } : {}), ...init.headers },
    });
    const nextCookie = response.headers.get("set-cookie");
    if (nextCookie) cookie = nextCookie.split(";")[0];
    return response;
  };
  try {
    const app = render(createElement(AdminApp, { onHome: () => {} }));
    await waitFor(() =>
      assert(app.getByRole("heading", { name: "Administrator" })),
    );
    fireEvent.change(app.getByLabelText("Username"), {
      target: { value: "test-admin" },
    });
    fireEvent.change(app.getByLabelText("Password"), {
      target: { value: password },
    });
    fireEvent.click(app.getByRole("button", { name: "Sign In" }));
    await waitFor(
      () => assert(app.getByRole("heading", { name: "Registration overview" })),
      { timeout: 5000 },
    );
    await waitFor(() =>
      assert(
        app.getByText(
          "No registrations yet. Counts will update after applications are saved.",
        ),
      ),
    );
    assert.equal(app.getAllByText("0", { exact: true }).length, 13);
    fireEvent.click(
      app.getByRole("button", { name: "All Registrations", exact: true }),
    );
    await waitFor(() =>
      assert(
        app.getByRole("heading", { name: "All registrations", exact: true }),
      ),
    );
    await waitFor(() => assert(app.getByText("No registrations found.")));
    assert(
      app
        .getByRole("link", { name: "Export filtered CSV" })
        .getAttribute("href")
        ?.startsWith("/api/admin/export/csv?"),
    );
    fireEvent.change(app.getByLabelText("Domain", { exact: true }), {
      target: { value: "mobile-forensics" },
    });
    await waitFor(() =>
      assert(
        app.getByRole("heading", { name: "Mobile Forensics", exact: true }),
      ),
    );
    assert.equal(
      (app.getByLabelText("Domain") as HTMLSelectElement).value,
      "mobile-forensics",
    );
    // The fixture below exists only in this temporary test database.
    await act(async () => {
      const seed = await fetch("/api/public/config");
      const csrf = (await seed.json()).csrfToken;
      const form = new FormData();
      for (const [key, value] of Object.entries({
        fullName: "Synthetic UI Learner",
        email: "ui@example.invalid",
        stream: "BCA",
        college: "Synthetic College",
        domainId: "mobile-forensics",
        reason:
          "I want to learn evidence preservation in a simulated environment.",
        consent: "true",
      }))
        form.set(key, value);
      form.set(
        "resume",
        new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }),
        "resume.pdf",
      );
      assert.equal(
        (
          await fetch("/api/applications", {
            method: "POST",
            headers: { "X-CSRF-Token": csrf },
            body: form,
          })
        ).status,
        201,
      );
    });
    fireEvent.click(app.getByRole("button", { name: "Refresh", exact: true }));
    await waitFor(() => assert(app.getByText("Synthetic UI Learner")));
    fireEvent.change(app.getByLabelText("Search applicants"), {
      target: { value: "Synthetic College" },
    });
    await waitFor(() =>
      assert(
        app
          .getByRole("link", { name: "Export filtered CSV" })
          .getAttribute("href")
          ?.includes("Synthetic+College"),
      ),
    );
    fireEvent.click(
      app.getByRole("button", {
        name: "View application for Synthetic UI Learner",
      }),
    );
    await waitFor(() =>
      assert(app.getByRole("heading", { name: "Application details" })),
    );
    assert(
      app
        .getByRole("link", { name: "Download Resume" })
        .getAttribute("href")
        ?.endsWith("/resume"),
    );
    assert(app.getByText("ui@example.invalid"));
    fireEvent.change(app.getByLabelText("Change review status"), {
      target: { value: "Shortlisted" },
    });
    fireEvent.click(app.getByRole("button", { name: "Save Status" }));
    await waitFor(() => assert(app.getByText("Review status updated.")));
    fireEvent.click(app.getByRole("button", { name: "Back to Applications" }));
    await waitFor(() =>
      assert(app.getByText("Shortlisted", { selector: ".status-badge" })),
    );
    fireEvent.click(app.getByRole("button", { name: "Logout", exact: true }));
    await waitFor(() =>
      assert(app.getByRole("heading", { name: "Administrator" })),
    );
    assert.equal(
      db.prepare("SELECT status FROM applications").get()?.status,
      "Shortlisted",
    );
    assert.equal(
      within(document.body).queryByText("Synthetic UI Learner"),
      null,
    );
  } finally {
    cleanup();
    globalThis.fetch = nativeFetch;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
    rmSync(root, { recursive: true, force: true });
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
