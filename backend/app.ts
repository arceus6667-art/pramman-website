import express from "express";
import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import session from "express-session";
import multer from "multer";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import { randomUUID, randomBytes, timingSafeEqual } from "node:crypto";
import { join, resolve } from "node:path";
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import type { DatabaseSync } from "node:sqlite";
import { ZodError } from "zod";
import type { Config } from "./config.js";
import type { ApplicationRow } from "./database.js";
import { deleteApplication } from "./database.js";
import { SQLiteSessionStore } from "./sessions.js";
import {
  applicationSchema,
  loginSchema,
  statusSchema,
  idSchema,
  filterSchema,
  filterSql,
} from "./validation.js";
import { validateResume } from "./uploads.js";
import { applicationCsv } from "./csv.js";
import { DOMAIN_NAMES } from "../shared/domains.js";
function safeApplication(row: ApplicationRow) {
  const { resume_stored_filename, ...safe } = row;
  return { ...safe, resume_identifier: resume_stored_filename };
}
export function createApp(config: Config, db: DatabaseSync) {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: config.secureCookies ? [] : null,
        },
      },
      strictTransportSecurity: config.secureCookies ? undefined : false,
    }),
  );
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "16kb" }));
  const lifetime = config.sessionHours * 3600000;
  app.use(
    "/api",
    session({
      name: "pfsa.sid",
      secret: config.sessionSecret,
      store: new SQLiteSessionStore(db, lifetime),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "strict",
        secure: config.secureCookies,
        maxAge: lifetime,
        path: "/api",
      },
    }),
  );
  const token = (req: Request) =>
    req.session.csrfToken ??
    (req.session.csrfToken = randomBytes(32).toString("hex"));
  const csrf = (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get("origin");
    if (
      (origin && !config.origins.includes(origin)) ||
      req.get("sec-fetch-site") === "cross-site"
    ) {
      res.status(403).json({ error: "Request origin is not allowed." });
      return;
    }
    const supplied = req.get("x-csrf-token") ?? "";
    const expected = req.session.csrfToken ?? "";
    if (
      !expected ||
      !/^[a-f0-9]{64}$/.test(supplied) ||
      supplied.length !== expected.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    ) {
      res
        .status(403)
        .json({ error: "Your form session expired. Refresh and try again." });
      return;
    }
    next();
  };
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (
      req.session.adminId !== 1 ||
      !req.session.authenticatedAt ||
      Date.now() - req.session.authenticatedAt > lifetime
    ) {
      res.status(401).json({ error: "Administrator sign-in required." });
      return;
    }
    next();
  };
  const submitLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.submissionLimit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: "Too many application attempts. Please try again in 15 minutes.",
    },
  });
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.loginLimit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: "Too many sign-in attempts. Please try again in 15 minutes.",
    },
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
      fields: 7,
      parts: 8,
      fieldSize: 12000,
      fieldNameSize: 100,
    },
  }).single("resume");
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/public/config", (req, res) =>
    res.json({
      csrfToken: token(req),
      registrationEnabled: true,
      privacyEmail: config.privacyEmail,
      retentionDays: config.retentionDays,
      maxResumeBytes: 5 * 1024 * 1024,
    }),
  );
  app.post("/api/applications", submitLimit, csrf, upload, async (req, res) => {
    const parsed = applicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Please correct the application fields.",
        fields: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    if (!req.file) {
      res.status(400).json({
        error: "A resume is required.",
        fields: { resume: ["Choose a resume file."] },
      });
      return;
    }
    let verified: Awaited<ReturnType<typeof validateResume>>;
    try {
      verified = await validateResume(req.file);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid resume.",
        fields: {
          resume: [
            "Choose a valid PDF, DOC, or DOCX resume, no larger than 5 MB.",
          ],
        },
      });
      return;
    }
    const data = parsed.data;
    const id = randomUUID();
    const reference = `PFSA-${id.toUpperCase()}`;
    const storedName = `${randomUUID()}${verified.extension}`;
    const filePath = join(config.uploadsDir, storedName);
    const now = new Date().toISOString();
    let written = false;
    try {
      writeFileSync(filePath, req.file.buffer, { mode: 0o600, flag: "wx" });
      written = true;
      db.prepare(
        `INSERT INTO applications(id,application_reference,full_name,email,study_stream,college_university,domain_id,joining_reason,resume_original_filename,resume_stored_filename,resume_mime_type,resume_size,consent_accepted_at,created_at,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        id,
        reference,
        data.fullName,
        data.email,
        data.stream,
        data.college,
        data.domainId,
        data.reason,
        verified.originalName,
        storedName,
        verified.mime,
        req.file.size,
        now,
        now,
        "New",
      );
    } catch (error) {
      if (written && existsSync(filePath)) unlinkSync(filePath);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("UNIQUE constraint failed: applications.email")) {
        res.status(409).json({
          error:
            "An application with this email already exists for this domain. You may apply to other domains independently. Contact the academy to amend an existing application.",
        });
        return;
      }
      res.status(503).json({
        error:
          "The application could not be saved. Please try again later. No registration has been confirmed.",
      });
      return;
    }
    res.status(201).json({
      applicationReference: reference,
      domainId: data.domainId,
      domainTitle: DOMAIN_NAMES[data.domainId],
      receivedAt: now,
    });
  });
  const dummyHash = bcrypt.hashSync(randomBytes(24).toString("hex"), 12);
  app.get("/api/admin/session", (req, res) =>
    res.json({
      authenticated:
        req.session.adminId === 1 &&
        Boolean(
          req.session.authenticatedAt &&
          Date.now() - req.session.authenticatedAt <= lifetime,
        ),
      csrfToken: token(req),
    }),
  );
  app.post("/api/admin/login", loginLimit, csrf, async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter a valid username and password." });
      return;
    }
    const admin = db
      .prepare(
        "SELECT id,username,password_hash FROM administrators WHERE id=1",
      )
      .get() as
      { id: number; username: string; password_hash: string } | undefined;
    const matches = await bcrypt.compare(
      parsed.data.password,
      admin?.password_hash ?? dummyHash,
    );
    if (!admin || !matches || admin.username !== parsed.data.username) {
      res.status(401).json({ error: "Incorrect username or password." });
      return;
    }
    req.session.regenerate((error) => {
      if (error) {
        next(error);
        return;
      }
      req.session.adminId = 1;
      req.session.authenticatedAt = Date.now();
      const csrfToken = token(req);
      req.session.save((saveError) => {
        if (saveError) {
          next(saveError);
          return;
        }
        res.json({ authenticated: true, csrfToken });
      });
    });
  });
  app.post("/api/admin/logout", requireAdmin, csrf, (req, res, next) =>
    req.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }
      res.clearCookie("pfsa.sid", {
        path: "/api",
        sameSite: "strict",
        secure: config.secureCookies,
        httpOnly: true,
      });
      res.json({ ok: true });
    }),
  );
  app.use("/api/admin", requireAdmin);
  app.get("/api/admin/dashboard", (req, res) => {
    const filters = filterSchema.parse(req.query);
    const { where, params } = filterSql(filters);
    const total = (
      db
        .prepare(`SELECT count(*) AS count FROM applications ${where}`)
        .get(...params) as { count: number }
    ).count;
    const grouped = db
      .prepare(
        `SELECT domain_id,count(*) AS count FROM applications ${where} GROUP BY domain_id`,
      )
      .all(...params) as { domain_id: string; count: number }[];
    const counts = Object.entries(DOMAIN_NAMES).map(([id, title]) => ({
      id,
      title,
      count: grouped.find((row) => row.domain_id === id)?.count ?? 0,
    }));
    const recent = db
      .prepare(
        `SELECT * FROM applications ${where} ORDER BY created_at DESC,id DESC LIMIT 8`,
      )
      .all(...params) as unknown as ApplicationRow[];
    res.json({ total, domains: counts, recent: recent.map(safeApplication) });
  });
  app.get("/api/admin/applications", (req, res) => {
    const filters = filterSchema.parse(req.query);
    const { where, params, order } = filterSql(filters);
    const total = (
      db
        .prepare(`SELECT count(*) AS count FROM applications ${where}`)
        .get(...params) as { count: number }
    ).count;
    const rows = db
      .prepare(
        `SELECT * FROM applications ${where} ORDER BY created_at ${order},id ${order} LIMIT ? OFFSET ?`,
      )
      .all(
        ...params,
        filters.pageSize,
        (filters.page - 1) * filters.pageSize,
      ) as unknown as ApplicationRow[];
    res.json({
      applications: rows.map(safeApplication),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    });
  });
  app.get("/api/admin/applications/:id", (req, res) => {
    const id = idSchema.parse(req.params.id);
    const row = db
      .prepare("SELECT * FROM applications WHERE id=?")
      .get(id) as unknown as ApplicationRow | undefined;
    if (!row) {
      res.status(404).json({ error: "Application not found." });
      return;
    }
    res.json(safeApplication(row));
  });
  app.patch("/api/admin/applications/:id/status", csrf, (req, res) => {
    const id = idSchema.parse(req.params.id);
    const { status } = statusSchema.parse(req.body);
    const result = db
      .prepare("UPDATE applications SET status=? WHERE id=?")
      .run(status, id);
    if (!result.changes) {
      res.status(404).json({ error: "Application not found." });
      return;
    }
    res.json({ status });
  });
  app.delete("/api/admin/applications/:id", csrf, (req, res) => {
    const id = idSchema.parse(req.params.id);
    if (!deleteApplication(db, config, id)) {
      res.status(404).json({ error: "Application not found." });
      return;
    }
    res.json({ ok: true });
  });
  app.get("/api/admin/applications/:id/resume", (req, res, next) => {
    const id = idSchema.parse(req.params.id);
    const row = db
      .prepare("SELECT * FROM applications WHERE id=?")
      .get(id) as unknown as ApplicationRow | undefined;
    if (!row) {
      res.status(404).json({ error: "Application not found." });
      return;
    }
    const filePath = join(config.uploadsDir, row.resume_stored_filename);
    if (!existsSync(filePath)) {
      res.status(404).json({
        error: "Resume file is unavailable. Contact the system administrator.",
      });
      return;
    }
    res.set({
      "Content-Type": row.resume_mime_type,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    });
    res.download(filePath, row.resume_original_filename, (error) => {
      if (error && !res.headersSent) next(error);
    });
  });
  app.get("/api/admin/export/csv", (req, res) => {
    const filters = filterSchema.parse(req.query);
    const { where, params, order } = filterSql(filters);
    const count = (
      db
        .prepare(`SELECT count(*) AS count FROM applications ${where}`)
        .get(...params) as { count: number }
    ).count;
    if (count > 50000) {
      res.status(413).json({
        error:
          "This export exceeds 50,000 records. Narrow the date or domain filters.",
      });
      return;
    }
    const rows = db
      .prepare(
        `SELECT * FROM applications ${where} ORDER BY created_at ${order},id ${order}`,
      )
      .all(...params) as unknown as ApplicationRow[];
    const filename = `pfsa-${filters.domainId ?? "registrations"}-${new Date().toISOString().slice(0, 10)}.csv`;
    res
      .set({
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      })
      .send(applicationCsv(rows));
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  const staticDir = resolve("dist");
  if (existsSync(join(staticDir, "index.html"))) {
    app.use(express.static(staticDir, { index: false }));
    app.get(["/", "/admin"], (_req, res) =>
      res.sendFile(join(staticDir, "index.html")),
    );
  }
  app.use((_req, res) => res.status(404).json({ error: "Not found." }));
  const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _req,
    res,
    _next,
  ) => {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request parameters." });
      return;
    }
    if (error instanceof multer.MulterError) {
      res.status(400).json({
        error:
          error.code === "LIMIT_FILE_SIZE"
            ? "Resume must be no larger than 5 MB."
            : "Invalid upload. Provide one resume and the required application fields.",
      });
      return;
    }
    if (error instanceof SyntaxError) {
      res.status(400).json({ error: "Invalid request body." });
      return;
    }
    res.status(500).json({
      error: "The request could not be completed. Please try again later.",
    });
  };
  app.use(errorHandler);
  return app;
}
