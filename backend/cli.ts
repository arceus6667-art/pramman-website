import { randomBytes } from "node:crypto";
import { mkdirSync, copyFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { backup } from "node:sqlite";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { loadConfig } from "./config.js";
import { openDatabase, purgeExpired, purgeBackups } from "./database.js";
const config = loadConfig();
const db = openDatabase(config);
try {
  switch (process.argv[2]) {
    case "init":
      console.log(
        "SQLite schema initialized. No applicant records were seeded.",
      );
      break;
    case "admin": {
      const username = z
        .string()
        .trim()
        .min(3)
        .max(80)
        .parse(process.env.ADMIN_USERNAME);
      const password = z
        .string()
        .min(14)
        .max(72)
        .parse(process.env.ADMIN_PASSWORD);
      if (Buffer.byteLength(password) > 72)
        throw new Error("Password must be at most 72 UTF-8 bytes.");
      const hash = await bcrypt.hash(password, 12);
      db.prepare(
        "INSERT INTO administrators(id,username,password_hash) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET username=excluded.username,password_hash=excluded.password_hash",
      ).run(username, hash);
      db.exec("DELETE FROM sessions");
      console.log(
        "Administrator provisioned. Existing sessions revoked. Remove ADMIN_PASSWORD from your environment after setup.",
      );
      break;
    }
    case "backup": {
      purgeBackups(config);
      const directory = join(
        config.dataDir,
        "backups",
        new Date().toISOString().replace(/[:.]/g, "-") +
          "-" +
          randomBytes(3).toString("hex"),
      );
      mkdirSync(directory, { recursive: true, mode: 0o700 });
      const filename = join(directory, "pfsa.sqlite");
      await backup(db, filename);
      chmodSync(filename, 0o600);
      const files = db
        .prepare("SELECT resume_stored_filename FROM applications")
        .all() as { resume_stored_filename: string }[];
      const uploadDirectory = join(directory, "uploads");
      mkdirSync(uploadDirectory, { mode: 0o700 });
      for (const row of files) {
        const path = join(uploadDirectory, row.resume_stored_filename);
        copyFileSync(join(config.uploadsDir, row.resume_stored_filename), path);
        chmodSync(path, 0o600);
      }
      console.log(
        `Backup completed in ${directory}. Stop the server before backup for an application-consistent database and file snapshot.`,
      );
      break;
    }
    case "purge":
      console.log(
        `Removed ${purgeExpired(db, config)} expired applications and their resumes.`,
      );
      break;
    default:
      throw new Error("Use init, admin, backup, or purge.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Setup failed.");
  process.exitCode = 1;
} finally {
  db.close();
}
