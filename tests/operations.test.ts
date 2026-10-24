import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  readdirSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  utimesSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import bcrypt from "bcryptjs";
import { openDatabase, purgeBackups } from "../backend/database.js";
import { createApp } from "../backend/app.js";
import type { Config } from "../backend/config.js";
function config(root: string): Config {
  return {
    dataDir: join(root, "data"),
    uploadsDir: join(root, "uploads"),
    port: 3001,
    host: "127.0.0.1",
    sessionSecret: "k".repeat(64),
    secureCookies: false,
    origins: ["http://localhost"],
    privacyEmail: "privacy@example.invalid",
    retentionDays: 180,
    sessionHours: 8,
    mode: "test",
    submissionLimit: 2,
    loginLimit: 2,
  };
}
test("database setup, secure admin provisioning and database/resume backup commands", () => {
  const root = mkdtempSync(join(tmpdir(), "pfsa-operations-"));
  const settings = config(root);
  const env = {
    ...process.env,
    SESSION_SECRET: settings.sessionSecret,
    PRIVACY_CONTACT_EMAIL: settings.privacyEmail,
    DATA_DIR: settings.dataDir,
    UPLOADS_DIR: settings.uploadsDir,
    ADMIN_USERNAME: "operator-test",
    ADMIN_PASSWORD: "Operations-Test-Password-35!",
  };
  const cli = (command: string) => {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "backend/cli.ts", command],
      { env, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  try {
    cli("init");
    cli("admin");
    const db = openDatabase(settings);
    try {
      const admin = db.prepare("SELECT * FROM administrators").get() as {
        password_hash: string;
      };
      assert(bcrypt.compareSync(env.ADMIN_PASSWORD, admin.password_hash));
      assert(!admin.password_hash.includes(env.ADMIN_PASSWORD));
      assert.equal(
        db.prepare("SELECT count(*) AS n FROM applications").get()?.n,
        0,
      );
      const id = randomUUID(),
        file = randomUUID() + ".pdf";
      writeFileSync(join(settings.uploadsDir, file), "synthetic resume");
      db.prepare(
        "INSERT INTO applications VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        id,
        "PFSA-" + id,
        "Synthetic Backup Learner",
        "backup@example.invalid",
        "BCA",
        "Synthetic College",
        "mobile-forensics",
        "A synthetic backup test application.",
        "resume.pdf",
        file,
        "application/pdf",
        16,
        new Date().toISOString(),
        new Date().toISOString(),
        "New",
      );
      cli("backup");
      const directories = readdirSync(join(settings.dataDir, "backups"));
      assert.equal(directories.length, 1);
      const backupDir = join(settings.dataDir, "backups", directories[0]);
      const backup = openDatabase({
        ...settings,
        dataDir: backupDir,
        uploadsDir: join(backupDir, "uploads"),
      });
      assert.equal(
        backup.prepare("SELECT count(*) AS n FROM applications").get()?.n,
        1,
      );
      backup.close();
      assert.equal(
        readFileSync(join(backupDir, "uploads", file), "utf8"),
        "synthetic resume",
      );
      const old = join(
        settings.dataDir,
        "backups",
        "2000-01-01T00-00-00-000Z-aabbcc",
      );
      mkdirSync(old);
      utimesSync(old, new Date("2000-01-01"), new Date("2000-01-01"));
      purgeBackups(settings);
      assert.equal(existsSync(old), false);
      db.prepare("UPDATE applications SET created_at=? WHERE id=?").run(
        "2000-01-01T00:00:00.000Z",
        id,
      );
      cli("purge");
      assert.equal(
        db.prepare("SELECT count(*) AS n FROM applications").get()?.n,
        0,
      );
      assert.equal(existsSync(join(settings.uploadsDir, file)), false);
    } finally {
      db.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("login and submission rate limits and absolute session expiry", async () => {
  const root = mkdtempSync(join(tmpdir(), "pfsa-limits-"));
  const settings = config(root);
  const db = openDatabase(settings);
  db.prepare("INSERT INTO administrators VALUES(1,?,?)").run(
    "limit-admin",
    bcrypt.hashSync("Test-Limits-Password-39!", 4),
  );
  const server = createApp(settings, db).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  let cookie = "";
  let csrf = "";
  async function call(path: string, options: RequestInit = {}) {
    const response = await fetch(base + path, {
      ...options,
      headers: { Cookie: cookie, ...options.headers },
    });
    const header = response.headers.get("set-cookie");
    if (header) cookie = header.split(";")[0];
    return response;
  }
  try {
    csrf = (await (await call("/api/admin/session")).json()).csrfToken;
    const headers = {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
    };
    const login = () =>
      call("/api/admin/login", {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: "limit-admin",
          password: "Test-Limits-Password-39!",
        }),
      });
    let response = await login();
    assert.equal(response.status, 200);
    csrf = (await response.json()).csrfToken;
    const stored = db.prepare("SELECT sid,data FROM sessions").all() as {
      sid: string;
      data: string;
    }[];
    for (const row of stored) {
      const data = JSON.parse(row.data);
      if (data.adminId) {
        data.authenticatedAt = Date.now() - 9 * 3600000;
        db.prepare("UPDATE sessions SET data=? WHERE sid=?").run(
          JSON.stringify(data),
          row.sid,
        );
      }
    }
    assert.equal((await call("/api/admin/dashboard")).status, 401);
    await call("/api/admin/login", {
      method: "POST",
      headers: { ...headers, "X-CSRF-Token": csrf },
      body: JSON.stringify({ username: "limit-admin", password: "wrong" }),
    });
    assert.equal((await login()).status, 429);
    for (let index = 0; index < 2; index++)
      await call("/api/applications", {
        method: "POST",
        headers: { "X-CSRF-Token": csrf, "Content-Type": "application/json" },
        body: "{}",
      });
    assert.equal(
      (
        await call("/api/applications", {
          method: "POST",
          headers: { "X-CSRF-Token": csrf },
          body: new FormData(),
        })
      ).status,
      429,
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});
