import test from "node:test";
import assert from "node:assert/strict";
import { normalizeParentMobile, parentContacts, communicationLink, absenceMessage, defaultAbsenceSettings, createVoiceCallJob } from "../school-erp-pro/src/services/absenceCommunication.js";

test("parent mobile normalization rejects malformed and ambiguous numbers", () => {
  for (const number of ["9876543210", "+91 98765 43210", "919876543210"]) assert.equal(normalizeParentMobile(number), "+919876543210");
  for (const number of ["bad9876543210", "1234567890123459876543210", "+915555555555", "", "98765"]) assert.equal(normalizeParentMobile(number), "");
  assert.equal(normalizeParentMobile("+442079460123"), "+442079460123");
});

test("parent contacts retain explicit relationships without guessing from a name", () => {
  const contacts = parentContacts({ fatherName: "Father", motherName: "Mother", mobile: "9876543210", motherMobile: "9876543211" });
  assert.deepEqual(contacts.map(c => c.id), ["mother", "primary"]);
  assert.equal(contacts[0].name, "Mother");
  assert.equal(contacts[1].name, "Parent / Guardian");
});

test("device links use exact normalized recipients and escaped message bodies", () => {
  assert.equal(communicationLink("call", "9876543210", ""), "tel:+919876543210");
  assert.equal(communicationLink("sms", "9876543210", "A & B", "iPhone"), "sms:+919876543210&body=A%20%26%20B");
  assert.equal(communicationLink("sms", "9876543210", "A & B", "Android"), "sms:+919876543210?body=A%20%26%20B");
  assert.equal(communicationLink("whatsapp", "9876543210", "A & B"), "https://wa.me/919876543210?text=A%20%26%20B");
  assert.equal(communicationLink("call", "invalid", ""), "");
});

test("absence templates preserve Marathi and exact date/class mapping", () => {
  const message = absenceMessage({ name: "Asha", className: "8", division: "A" }, "2026-09-17", { ...defaultAbsenceSettings, language: "mr" });
  assert.match(message, /आपले पाल्य Asha/); assert.match(message, /8\/A/); assert.match(message, /2026-09-17/);
});

test("future voice job contract is provider independent and has stable idempotency", () => {
  const request = { schoolId: "school", studentId: "student", contactId: "mother", attendanceDate: "2026-09-17", audioAssetId: "audio", requestedBy: "teacher" };
  assert.equal(createVoiceCallJob(request).idempotencyKey, createVoiceCallJob(request).idempotencyKey);
  assert.equal(createVoiceCallJob(request).status, "awaiting_provider");
  assert.notEqual(createVoiceCallJob(request).idempotencyKey, createVoiceCallJob({ ...request, studentId: "another" }).idempotencyKey);
  assert.throws(() => createVoiceCallJob({}), /requires/);
});
