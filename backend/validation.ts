import { z } from "zod";
import { DOMAIN_IDS, APPLICATION_STATUSES } from "../shared/domains.js";
const text = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
      "Unsupported control characters.",
    );
export const applicationSchema = z
  .object({
    fullName: text(2, 120),
    email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
    stream: text(2, 180),
    college: text(2, 240),
    domainId: z.enum(
      DOMAIN_IDS as [
        (typeof DOMAIN_IDS)[number],
        ...(typeof DOMAIN_IDS)[number][],
      ],
    ),
    reason: text(20, 3000),
    consent: z.literal("true"),
  })
  .strict();
export const loginSchema = z
  .object({
    username: text(3, 80),
    password: z
      .string()
      .min(1)
      .max(72)
      .refine((value) => Buffer.byteLength(value) <= 72),
  })
  .strict();
export const statusSchema = z
  .object({ status: z.enum(APPLICATION_STATUSES) })
  .strict();
export const idSchema = z.uuid();
export const filterSchema = z
  .object({
    search: z.string().trim().max(150).default(""),
    domainId: z
      .enum(
        DOMAIN_IDS as [
          (typeof DOMAIN_IDS)[number],
          ...(typeof DOMAIN_IDS)[number][],
        ],
      )
      .optional(),
    status: z.enum(APPLICATION_STATUSES).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    sort: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(
    (v) => !v.from || !v.to || v.from <= v.to,
    "Start date must not be after end date.",
  );
export type Filters = z.infer<typeof filterSchema>;
export function filterSql(filters: Filters) {
  const clauses: string[] = [];
  const params: string[] = [];
  if (filters.search) {
    clauses.push(
      "(full_name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR college_university LIKE ? ESCAPE '\\')",
    );
    const escaped = filters.search.replace(/[\\%_]/g, "\\$&");
    params.push(...Array<string>(3).fill(`%${escaped}%`));
  }
  if (filters.domainId) {
    clauses.push("domain_id=?");
    params.push(filters.domainId);
  }
  if (filters.status) {
    clauses.push("status=?");
    params.push(filters.status);
  }
  if (filters.from) {
    clauses.push("created_at>=?");
    params.push(`${filters.from}T00:00:00.000Z`);
  }
  if (filters.to) {
    clauses.push("created_at<=?");
    params.push(`${filters.to}T23:59:59.999Z`);
  }
  return {
    where: clauses.length ? "WHERE " + clauses.join(" AND ") : "",
    params,
    order: filters.sort === "asc" ? "ASC" : "DESC",
  };
}
