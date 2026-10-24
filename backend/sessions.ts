import session from "express-session";
import type { SessionData } from "express-session";
import type { DatabaseSync } from "node:sqlite";
declare module "express-session" {
  interface SessionData {
    adminId?: number;
    csrfToken?: string;
    authenticatedAt?: number;
  }
}
export class SQLiteSessionStore extends session.Store {
  constructor(
    private db: DatabaseSync,
    private lifetime: number,
  ) {
    super();
  }
  get(
    sid: string,
    callback: (error: unknown, session?: SessionData | null) => void,
  ) {
    try {
      const row = this.db
        .prepare("SELECT data,expires FROM sessions WHERE sid=?")
        .get(sid) as { data: string; expires: number } | undefined;
      if (!row || row.expires < Date.now()) {
        this.db.prepare("DELETE FROM sessions WHERE sid=?").run(sid);
        callback(null, null);
        return;
      }
      callback(null, JSON.parse(row.data) as SessionData);
    } catch (error) {
      callback(error);
    }
  }
  set(sid: string, data: SessionData, callback?: (error?: unknown) => void) {
    try {
      const expires = data.cookie.expires
        ? new Date(data.cookie.expires).getTime()
        : Date.now() + this.lifetime;
      this.db
        .prepare(
          "INSERT INTO sessions(sid,data,expires) VALUES(?,?,?) ON CONFLICT(sid) DO UPDATE SET data=excluded.data,expires=excluded.expires",
        )
        .run(sid, JSON.stringify(data), expires);
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }
  destroy(sid: string, callback?: (error?: unknown) => void) {
    try {
      this.db.prepare("DELETE FROM sessions WHERE sid=?").run(sid);
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }
}
