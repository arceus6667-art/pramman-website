import "dotenv/config";
import { resolve, sep } from "node:path";
import { z } from "zod";
export interface Config {
  dataDir: string;
  uploadsDir: string;
  port: number;
  host: string;
  sessionSecret: string;
  secureCookies: boolean;
  origins: string[];
  privacyEmail: string;
  retentionDays: number;
  sessionHours: number;
  mode: string;
  submissionLimit: number;
  loginLimit: number;
}
export function loadConfig(): Config {
  const env = z
    .object({
      SESSION_SECRET: z.string().min(48),
      PORT: z.coerce.number().int().min(1).max(65535).default(3001),
      HOST: z.string().default("127.0.0.1"),
      DATA_DIR: z.string().default("./data"),
      UPLOADS_DIR: z.string().default("./uploads"),
      COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
      ALLOWED_ORIGINS: z
        .string()
        .default(
          "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3001,http://127.0.0.1:3001",
        ),
      PRIVACY_CONTACT_EMAIL: z.email(),
      RETENTION_DAYS: z.coerce.number().int().min(1).max(3650).default(180),
      SESSION_HOURS: z.coerce.number().int().min(1).max(24).default(8),
      NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    })
    .safeParse(process.env);
  if (!env.success)
    throw new Error(
      "Configuration invalid. Set SESSION_SECRET (48+ characters) and PRIVACY_CONTACT_EMAIL; check .env.example for other settings.",
    );
  const e = env.data;
  const dataDir = resolve(e.DATA_DIR);
  const uploadsDir = resolve(e.UPLOADS_DIR);
  if (dataDir === uploadsDir)
    throw new Error("DATA_DIR and UPLOADS_DIR must be separate directories.");
  // Storage must never live in a directory served by Vite or Express static hosting.
  for (const dir of [dataDir, uploadsDir])
    for (const publicDir of [
      resolve("public"),
      resolve("dist"),
      resolve("src"),
    ])
      if (
        dir === publicDir ||
        dir.startsWith(publicDir + sep) ||
        publicDir.startsWith(dir + sep)
      )
        throw new Error(
          "Private storage cannot be inside frontend directories.",
        );
  return {
    dataDir,
    uploadsDir,
    port: e.PORT,
    host: e.HOST,
    sessionSecret: e.SESSION_SECRET,
    secureCookies: e.COOKIE_SECURE === "true",
    origins: e.ALLOWED_ORIGINS.split(",").map((v) => new URL(v.trim()).origin),
    privacyEmail: e.PRIVACY_CONTACT_EMAIL.toLowerCase(),
    retentionDays: e.RETENTION_DAYS,
    sessionHours: e.SESSION_HOURS,
    mode: e.NODE_ENV,
    submissionLimit: 12,
    loginLimit: 10,
  };
}
