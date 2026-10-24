import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Server } from "node:http";
import { once } from "node:events";
import bcrypt from "bcryptjs";
import { createApp } from "../backend/app.js";
import {
  openDatabase,
  purgeExpired,
  removeOrphans,
} from "../backend/database.js";
import type { Config } from "../backend/config.js";
import { DOMAIN_IDS } from "../shared/domains.js";
import { applicationCsv } from "../backend/csv.js";
import type { ApplicationRow } from "../backend/database.js";
const pdf = readFileSync("tests/fixtures/resume.pdf");
const docx = readFileSync("tests/fixtures/resume.docx");
const syntheticPassword = "Test-only-password-387!";
async function start(config: Config, db: ReturnType<typeof openDatabase>) {
  const server = createApp(config, db).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address !== "string");
  return { server, base: `http://127.0.0.1:${address.port}` };
}
const close = (server: Server) =>
  new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
test("local registration, administration, persistence and security integration", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "pfsa-test-"));
  const config: Config = {
    dataDir: join(root, "data"),
    uploadsDir: join(root, "uploads"),
    port: 3001,
    host: "127.0.0.1",
    sessionSecret: "x".repeat(64),
    secureCookies: false,
    origins: ["http://localhost:5173"],
    privacyEmail: "privacy@example.invalid",
    retentionDays: 180,
    sessionHours: 8,
    mode: "test",
    submissionLimit: 100,
    loginLimit: 100,
  };
  let db = openDatabase(config);
  db.prepare("INSERT INTO administrators VALUES(1,?,?)").run(
    "test-admin",
    bcrypt.hashSync(syntheticPassword, 4),
  );
  let running = await start(config, db);
  let cookie = "";
  let csrf = "";
  async function call(path: string, options: RequestInit = {}) {
    const response = await fetch(running.base + path, {
      ...options,
      headers: { ...(cookie ? { Cookie: cookie } : {}), ...options.headers },
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    return response;
  }
  const headers = () => ({
    "Content-Type": "application/json",
    "X-CSRF-Token": csrf,
  });
  async function form(
    domainId: string,
    overrides: Record<string, string> = {},
    file: Blob = new Blob([pdf], { type: "application/pdf" }),
    filename = "resume.pdf",
  ) {
    const data = new FormData();
    const values = {
      fullName: "Test O'Learner",
      email: "synthetic@example.invalid",
      stream: "B.Sc. Forensic Science",
      college: "Synthetic Test College",
      domainId,
      reason: "I want to learn ethical evidence preservation and analysis.",
      consent: "true",
      ...overrides,
    };
    for (const [key, value] of Object.entries(values)) data.set(key, value);
    data.set("resume", file, filename);
    return call("/api/applications", {
      method: "POST",
      headers: { "X-CSRF-Token": csrf },
      body: data,
    });
  }
  try {
    await t.test("unauthenticated admin routes reject access", async () => {
      for (const path of [
        "/api/admin/dashboard",
        "/api/admin/applications",
        "/api/admin/applications/00000000-0000-4000-8000-000000000000",
        "/api/admin/applications/00000000-0000-4000-8000-000000000000/resume",
        "/api/admin/export/csv",
      ])
        assert.equal((await call(path)).status, 401);
    });
    await t.test("session cookie is HttpOnly and SameSite Strict", async () => {
      const response = await call("/api/admin/session");
      const data = await response.json();
      csrf = data.csrfToken;
      assert.equal(data.authenticated, false);
      const cookieHeader = response.headers.get("set-cookie") ?? "";
      assert.match(cookieHeader, /HttpOnly/i);
      assert.match(cookieHeader, /SameSite=Strict/i);
    });
    await t.test("CSRF and cross-origin requests are rejected", async () => {
      assert.equal(
        (
          await call("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "test-admin",
              password: syntheticPassword,
            }),
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await call("/api/admin/login", {
            method: "POST",
            headers: { ...headers(), Origin: "https://foreign.invalid" },
            body: JSON.stringify({
              username: "test-admin",
              password: syntheticPassword,
            }),
          })
        ).status,
        403,
      );
    });
    await t.test(
      "wrong password rejected, correct login rotates session",
      async () => {
        assert.equal(
          (
            await call("/api/admin/login", {
              method: "POST",
              headers: headers(),
              body: JSON.stringify({
                username: "test-admin",
                password: "wrong",
              }),
            })
          ).status,
          401,
        );
        const old = cookie;
        const response = await call("/api/admin/login", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            username: "test-admin",
            password: syntheticPassword,
          }),
        });
        assert.equal(response.status, 200);
        csrf = (await response.json()).csrfToken;
        assert.notEqual(cookie, old);
      },
    );
    await t.test("new database shows zero real statistics", async () => {
      const response = await call("/api/admin/dashboard");
      const data = await response.json();
      assert.equal(data.total, 0);
      assert.equal(data.domains.length, 6);
      assert(data.domains.every((d: { count: number }) => d.count === 0));
    });
    const saved: { id: string; domain: string }[] = [];
    for (const domainId of DOMAIN_IDS)
      await t.test(
        `registration persists correct domain: ${domainId}`,
        async () => {
          const response = await form(domainId);
          assert.equal(response.status, 201);
          const result = await response.json();
          assert.equal(result.domainId, domainId);
          assert.match(result.applicationReference, /^PFSA-/);
          assert(!JSON.stringify(result).includes(config.uploadsDir));
          const row = db
            .prepare(
              "SELECT id,domain_id FROM applications WHERE application_reference=?",
            )
            .get(result.applicationReference) as {
            id: string;
            domain_id: string;
          };
          assert.equal(row.domain_id, domainId);
          saved.push({ id: row.id, domain: domainId });
        },
      );
    await t.test(
      "duplicate same-domain application is clear and leaves no orphan",
      async () => {
        const before = readdirSync(config.uploadsDir).length;
        const response = await form(DOMAIN_IDS[0]);
        assert.equal(response.status, 409);
        assert.match((await response.json()).error, /already exists/);
        assert.equal(readdirSync(config.uploadsDir).length, before);
      },
    );
    await t.test(
      "server validates required fields, email, consent, domain and length",
      async () => {
        for (const override of [
          { fullName: "" },
          { email: "invalid" },
          { stream: "" },
          { college: "" },
          { reason: "short" },
          { consent: "false" },
          { domainId: "fake-domain" },
        ])
          assert.equal(
            (
              await form(DOMAIN_IDS[0], {
                email: "validation@example.invalid",
                ...override,
              })
            ).status,
            400,
          );
      },
    );
    await t.test("missing resume rejected", async () => {
      const data = new FormData();
      for (const [key, value] of Object.entries({
        fullName: "Test Learner",
        email: "none@example.invalid",
        stream: "BCA",
        college: "Test College",
        domainId: DOMAIN_IDS[0],
        reason: "A valid and sufficiently long reason.",
        consent: "true",
      }))
        data.set(key, value);
      assert.equal(
        (
          await call("/api/applications", {
            method: "POST",
            headers: { "X-CSRF-Token": csrf },
            body: data,
          })
        ).status,
        400,
      );
    });
    await t.test(
      "invalid extension, spoofed content, declared MIME and oversized resumes rejected",
      async () => {
        assert.equal(
          (
            await form(
              DOMAIN_IDS[0],
              { email: "invalid-file@example.invalid" },
              new Blob(["abc"], { type: "text/plain" }),
              "resume.exe",
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await form(
              DOMAIN_IDS[0],
              { email: "spoof@example.invalid" },
              new Blob(["not a PDF"], { type: "application/pdf" }),
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await form(
              DOMAIN_IDS[0],
              { email: "mime@example.invalid" },
              new Blob([pdf], { type: "text/plain" }),
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await form(
              DOMAIN_IDS[0],
              { email: "big@example.invalid" },
              new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], {
                type: "application/pdf",
              }),
            )
          ).status,
          400,
        );
      },
    );
    await t.test(
      "real DOCX structure accepted and non-Word ZIP rejected",
      async () => {
        assert.equal(
          (
            await form(
              DOMAIN_IDS[1],
              { email: "docx@example.invalid" },
              new Blob([docx], {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              }),
              "resume.docx",
            )
          ).status,
          201,
        );
        assert.equal(
          (
            await form(
              DOMAIN_IDS[1],
              { email: "fake-docx@example.invalid" },
              new Blob([pdf], {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              }),
              "resume.docx",
            )
          ).status,
          400,
        );
      },
    );
    await t.test(
      "database insertion failure returns no success and cleans resume",
      async () => {
        db.exec(
          "CREATE TRIGGER fail_test BEFORE INSERT ON applications WHEN NEW.email='fail@example.invalid' BEGIN SELECT RAISE(ABORT,'simulated insertion failure'); END;",
        );
        const before = readdirSync(config.uploadsDir).length;
        assert.equal(
          (await form(DOMAIN_IDS[0], { email: "fail@example.invalid" })).status,
          503,
        );
        assert.equal(readdirSync(config.uploadsDir).length, before);
        assert.equal(
          db
            .prepare(
              "SELECT id FROM applications WHERE email='fail@example.invalid'",
            )
            .get(),
          undefined,
        );
        db.exec("DROP TRIGGER fail_test");
      },
    );
    await t.test(
      "domain filters, search, pagination, dates and injection protection use database",
      async () => {
        for (const id of DOMAIN_IDS) {
          const data = await (
            await call(`/api/admin/applications?domainId=${id}`)
          ).json();
          assert(
            data.applications.every(
              (row: { domain_id: string }) => row.domain_id === id,
            ),
          );
          assert(data.total >= 1);
        }
        const search = await (
          await call(
            "/api/admin/applications?search=Synthetic%20Test%20College&pageSize=2",
          )
        ).json();
        assert.equal(search.applications.length, 2);
        assert.equal(search.total, 7);
        assert.equal(
          (
            await (
              await call("/api/admin/applications?search=%27%20OR%201%3D1--")
            ).json()
          ).total,
          0,
        );
        assert.equal(
          (await (await call("/api/admin/applications?from=2099-01-01")).json())
            .total,
          0,
        );
        assert.equal(
          (await call("/api/admin/applications?domainId=invalid")).status,
          400,
        );
      },
    );
    await t.test(
      "detail, authenticated download and status update work",
      async () => {
        const id = saved[0].id;
        const details = await (
          await call(`/api/admin/applications/${id}`)
        ).json();
        assert.equal(details.email, "synthetic@example.invalid");
        assert(!("resume_storage_path" in details));
        const download = await call(`/api/admin/applications/${id}/resume`);
        assert.equal(download.status, 200);
        assert.match(
          download.headers.get("content-disposition") ?? "",
          /attachment/,
        );
        assert.deepEqual(Buffer.from(await download.arrayBuffer()), pdf);
        assert.equal(
          (
            await call(`/api/admin/applications/${id}/status`, {
              method: "PATCH",
              headers: headers(),
              body: JSON.stringify({ status: "Under Review" }),
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await (
              await call("/api/admin/applications?status=Under%20Review")
            ).json()
          ).total,
          1,
        );
        assert.equal(
          (
            await call(`/api/admin/applications/${id}/status`, {
              method: "PATCH",
              headers: headers(),
              body: JSON.stringify({ status: "invalid" }),
            })
          ).status,
          400,
        );
      },
    );
    await t.test(
      "all and filtered CSV exports include real records and safe columns",
      async () => {
        const all = await call("/api/admin/export/csv");
        assert.equal(all.status, 200);
        assert.match(all.headers.get("content-type") ?? "", /text\/csv/);
        const text = await all.text();
        assert.equal(text.trim().split("\r\n").length, 8);
        assert(!text.includes(config.uploadsDir));
        assert(!text.includes("password_hash"));
        const filtered = await (
          await call(`/api/admin/export/csv?domainId=${DOMAIN_IDS[0]}`)
        ).text();
        assert.equal(filtered.trim().split("\r\n").length, 2);
        assert.match(filtered, /Under Review/);
      },
    );
    await t.test(
      "SQLite records and server-side sessions survive restart",
      async () => {
        await close(running.server);
        db.close();
        db = openDatabase(config);
        running = await start(config, db);
        assert.equal(
          (await (await call("/api/admin/dashboard")).json()).total,
          7,
        );
        assert.equal(
          (await (await call("/api/admin/session")).json()).authenticated,
          true,
        );
      },
    );
    await t.test(
      "deletion removes active record and private resume; retention purge works",
      async () => {
        const row = db
          .prepare("SELECT resume_stored_filename FROM applications WHERE id=?")
          .get(saved[0].id) as { resume_stored_filename: string };
        assert.equal(
          (
            await call(`/api/admin/applications/${saved[0].id}`, {
              method: "DELETE",
              headers: headers(),
            })
          ).status,
          200,
        );
        assert(
          !readdirSync(config.uploadsDir).includes(row.resume_stored_filename),
        );
        db.prepare("UPDATE applications SET created_at=? WHERE id=?").run(
          "2000-01-01T00:00:00.000Z",
          saved[1].id,
        );
        assert.equal(purgeExpired(db, config), 1);
        removeOrphans(db, config);
      },
    );
    await t.test("logout revokes access to private routes", async () => {
      assert.equal(
        (
          await call("/api/admin/logout", {
            method: "POST",
            headers: headers(),
          })
        ).status,
        200,
      );
      assert.equal((await call("/api/admin/dashboard")).status, 401);
      assert.equal(
        (await call(`/api/admin/applications/${saved[2].id}/resume`)).status,
        401,
      );
    });
  } finally {
    await close(running.server);
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});
test("CSV escaping protects spreadsheet formulas and multiline quotes", () => {
  const row = {
    application_reference: "PFSA-TEST",
    full_name: '=HYPERLINK("bad")',
    email: "x@example.invalid",
    study_stream: "+formula",
    college_university: " @evil",
    domain_id: DOMAIN_IDS[0],
    joining_reason: 'line 1, "quoted"\nline 2',
    resume_original_filename: "resume.pdf",
    resume_stored_filename: "identifier.pdf",
    status: "New",
    created_at: "2026-10-24",
    consent_accepted_at: "2026-10-24",
  } as ApplicationRow;
  const output = applicationCsv([row]);
  assert(output.includes('"\'=HYPERLINK(""bad"")"'));
  assert(output.includes('"\'+formula"'));
  assert(output.includes('"\' @evil"'));
  assert(output.includes('"line 1, ""quoted""\nline 2"'));
});
