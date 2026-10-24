import { DatabaseSync } from "node:sqlite";
import {
  mkdirSync,
  chmodSync,
  existsSync,
  readdirSync,
  unlinkSync,
  statSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { DOMAIN_NAMES } from "../shared/domains.js";
import type { Config } from "./config.js";
export interface ApplicationRow {
  id: string;
  application_reference: string;
  full_name: string;
  email: string;
  study_stream: string;
  college_university: string;
  domain_id: string;
  joining_reason: string;
  resume_original_filename: string;
  resume_stored_filename: string;
  resume_mime_type: string;
  resume_size: number;
  consent_accepted_at: string;
  created_at: string;
  status: string;
}
export function openDatabase(config: Config) {
  for (const dir of [config.dataDir, config.uploadsDir]) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    chmodSync(dir, 0o700);
  }
  const filename = join(config.dataDir, "pfsa.sqlite");
  const db = new DatabaseSync(filename);
  chmodSync(filename, 0o600);
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  const version = (
    db.prepare("PRAGMA user_version").get() as { user_version: number }
  ).user_version;
  if (version > 1)
    throw new Error("Database schema is newer than this application.");
  if (version === 0) {
    db.exec(`BEGIN;
 CREATE TABLE domains(id TEXT PRIMARY KEY,title TEXT NOT NULL);
 CREATE TABLE applications(id TEXT PRIMARY KEY,application_reference TEXT NOT NULL UNIQUE,full_name TEXT NOT NULL,email TEXT NOT NULL COLLATE NOCASE,study_stream TEXT NOT NULL,college_university TEXT NOT NULL,domain_id TEXT NOT NULL REFERENCES domains(id),joining_reason TEXT NOT NULL,resume_original_filename TEXT NOT NULL,resume_stored_filename TEXT NOT NULL UNIQUE,resume_mime_type TEXT NOT NULL,resume_size INTEGER NOT NULL CHECK(resume_size>0 AND resume_size<=5242880),consent_accepted_at TEXT NOT NULL,created_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New','Under Review','Shortlisted','Rejected')),UNIQUE(email,domain_id));
 CREATE INDEX applications_domain_date ON applications(domain_id,created_at DESC);
 CREATE INDEX applications_status_date ON applications(status,created_at DESC);
 CREATE INDEX applications_created ON applications(created_at DESC);
 CREATE TABLE administrators(id INTEGER PRIMARY KEY CHECK(id=1),username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL);
 CREATE TABLE sessions(sid TEXT PRIMARY KEY,data TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE INDEX sessions_expiry ON sessions(expires);
 PRAGMA user_version=1; COMMIT;`);
  }
  const seed = db.prepare(
    "INSERT OR IGNORE INTO domains(id,title) VALUES (?,?)",
  );
  for (const [id, title] of Object.entries(DOMAIN_NAMES)) seed.run(id, title);
  return db;
}
export function deleteApplication(
  db: DatabaseSync,
  config: Config,
  id: string,
) {
  const row = db
    .prepare("SELECT resume_stored_filename FROM applications WHERE id=?")
    .get(id) as { resume_stored_filename: string } | undefined;
  if (!row) return false;
  // Delete the record first. Startup cleanup removes any remaining orphan if file removal fails.
  db.prepare("DELETE FROM applications WHERE id=?").run(id);
  const path = join(config.uploadsDir, row.resume_stored_filename);
  if (existsSync(path)) unlinkSync(path);
  return true;
}
export function purgeExpired(db: DatabaseSync, config: Config) {
  const cutoff = new Date(
    Date.now() - config.retentionDays * 86400000,
  ).toISOString();
  const rows = db
    .prepare("SELECT id FROM applications WHERE created_at < ?")
    .all(cutoff) as { id: string }[];
  for (const row of rows) deleteApplication(db, config, row.id);
  return rows.length;
}
export function removeOrphans(db: DatabaseSync, config: Config) {
  const files = new Set(
    (
      db.prepare("SELECT resume_stored_filename FROM applications").all() as {
        resume_stored_filename: string;
      }[]
    ).map((row) => row.resume_stored_filename),
  );
  for (const file of readdirSync(config.uploadsDir))
    if (/^[0-9a-f-]{36}\.(pdf|doc|docx)$/.test(file) && !files.has(file))
      unlinkSync(join(config.uploadsDir, file));
}

export function purgeBackups(config: Config) {
  const directory = join(config.dataDir, "backups");
  if (!existsSync(directory)) return;
  for (const name of readdirSync(directory))
    if (/^\d{4}-\d{2}-\d{2}T[\d-]+Z-[a-f0-9]{6}$/.test(name)) {
      const path = join(directory, name);
      if (statSync(path).mtimeMs < Date.now() - 7 * 86400000)
        rmSync(path, { recursive: true, force: true });
    }
}
