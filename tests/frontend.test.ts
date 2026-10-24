import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRegistration } from "../src/services/registration";
import { domains } from "../src/data/domains";
const valid = {
  fullName: "Test Learner",
  email: "learner@example.com",
  stream: "BCA",
  college: "Sample Institution",
  reason: "I want to study evidence preservation.",
  consent: true,
  resume: new File(["sample resume"], "resume.pdf", {
    type: "application/pdf",
  }),
};
test("six stable unique domain IDs have topics, objectives and simulated exercises", () => {
  assert.deepEqual(
    domains.map((d) => d.id),
    [
      "computer-cyber-forensics",
      "mobile-forensics",
      "network-forensics",
      "cloud-forensics",
      "database-forensics",
      "iot-forensics",
    ],
  );
  assert.equal(new Set(domains.map((d) => d.id)).size, 6);
  assert(
    domains.every(
      (d) =>
        d.topics.length === 3 &&
        d.objectives.length >= 2 &&
        d.exercises.length >= 2,
    ),
  );
});
test("client accepts complete fields", () =>
  assert.deepEqual(validateRegistration(valid), {}));
test("client validates all seven required fields", () =>
  assert.equal(
    Object.keys(
      validateRegistration({
        fullName: " ",
        email: "",
        stream: "",
        college: "",
        reason: " ",
        resume: null,
        consent: false,
      }),
    ).length,
    7,
  ));
test("client rejects invalid email", () =>
  assert(validateRegistration({ ...valid, email: "invalid@" }).email));
test("client rejects unsupported extension", () =>
  assert(
    validateRegistration({ ...valid, resume: new File(["data"], "resume.exe") })
      .resume,
  ));
test("client rejects oversized file", () =>
  assert(
    validateRegistration({
      ...valid,
      resume: new File([new Uint8Array(5 * 1024 * 1024 + 1)], "resume.pdf"),
    }).resume,
  ));
test("client rejects empty file", () =>
  assert(
    validateRegistration({ ...valid, resume: new File([], "resume.docx") })
      .resume,
  ));
test("client accepts DOC/DOCX extension", () => {
  for (const extension of ["doc", "DOCX"])
    assert.deepEqual(
      validateRegistration({
        ...valid,
        resume: new File(["sample"], `resume.${extension}`),
      }),
      {},
    );
});
test("client enforces reason length and consent", () => {
  assert(validateRegistration({ ...valid, reason: "short" }).reason);
  assert(validateRegistration({ ...valid, consent: false }).consent);
});
