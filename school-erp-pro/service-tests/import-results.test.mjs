import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { parseStudentFile, mapHeaders } from "../src/services/excel.js";
import { reviewStudentImport, applyStudentImport, normalizeDate, normalizeMobile } from "../src/services/studentImport.js";
import { reviewMarks, validateMarks, aggregateResults } from "../src/services/results.js";

const existing = [{ id: "s1", name: "Asha Patil", grNo: "G1", admissionNo: "A1", dob: "2012-05-10", className: "8", mobile: "9876543210", address: "Keep this address", photo: "saved-photo" }];
test("aliases and safe update preserve identities, blank values, photos and unselected fields", () => {
  const rows = [{ "GR No": "g1", Name: "Different name", Mobile: "9876543211", Address: "", Standard: "9" }];
  const review = reviewStudentImport(rows, mapHeaders(Object.keys(rows[0])), existing, { mode: "update", fields: ["mobile", "address"] });
  assert.equal(review[0].duplicate.id, "s1"); assert.deepEqual(review[0].changes.map(c => c.field), ["mobile"]);
  assert.throws(() => applyStudentImport(existing, review), /Review/);
  const next = applyStudentImport(existing, review, { 0: "update" }).students[0];
  assert.equal(next.mobile, "9876543211"); assert.equal(next.name, "Asha Patil"); assert.equal(next.className, "8"); assert.equal(next.photo, "saved-photo"); assert.equal(next.address, "Keep this address"); assert.equal(next.id, "s1");
});
test("duplicates in uploaded file and conflicting existing identities are blocked", () => {
  const rows = [{ GR: "X1", Name: "New Child", Standard: "8" }, { GR: "x1", Name: "Other Child", Standard: "8" }];
  const review = reviewStudentImport(rows, mapHeaders(Object.keys(rows[0])), []);
  assert.ok(review.every(r => r.errors.some(e => e.includes("within this file"))));
  const conflict = reviewStudentImport([{ GR: "G1", "Admission Number": "A2" }], mapHeaders(["GR", "Admission Number"]), [...existing, { id: "s2", grNo: "G2", admissionNo: "A2" }]);
  assert.ok(conflict[0].errors.some(e => e.includes("multiple students")));
});
test("shared parent mobiles never select a sibling as duplicate", () => {
  const row = { GR: "G2", Name: "Sibling", Standard: "8", Mobile: "9876543210" };
  const [review] = reviewStudentImport([row], mapHeaders(Object.keys(row)), existing);
  assert.equal(review.duplicate, null); assert.equal(review.warnings.length, 1);
});
test("strict dates and mobile numbers reject impossible or prefixed garbage", () => {
  assert.equal(normalizeDate("31/02/2012"), null); assert.equal(normalizeDate("10/05/2012"), "2012-05-10");
  assert.equal(normalizeMobile("bad9876543210"), null); assert.equal(normalizeMobile("+91 9876543210"), "9876543210");
});
test("UTF-8 Marathi CSV remains Unicode without requiring a BOM", async () => {
  const parsed = await parseStudentFile(new File(["Name,GR No,Student Name Marathi\nAsha,G1,आशा पाटील"], "unicode.csv"));
  assert.equal(parsed.rows[0]["Student Name Marathi"], "आशा पाटील");
});
test("xlsx/xls/csv parsing preserves textual identifiers, worksheet dates and source rows", async () => {
  for (const bookType of ["xlsx", "xls", "csv"]) {
    const sheet = XLSX.utils.aoa_to_sheet([["Name", "GR No", "DOB"], ["Asha", "00123", new Date(2012, 4, 10)], [], ["Other", "G2", "2013-01-02"]]);
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Students");
    const buffer = XLSX.write(book, { type: "buffer", bookType });
    const parsed = await parseStudentFile(new File([buffer], `students.${bookType}`));
    assert.equal(parsed.rows[0]["GR No"], "00123"); assert.equal(parsed.rows[1].__row, 4);
    if (bookType !== "csv") assert.equal(parsed.rows[0].DOB, "2012-05-10");
  }
});
test("marks use GR identity, reject zero/blank and calculate combined subject outcome", () => {
  const rows = [{ "Student Name": "Asha Patil", "GR Number": "G1", Subject: "Math", "Maximum Marks": "100", "Obtained Marks": "80" }];
  assert.equal(reviewMarks(rows, existing, [], "Annual Exam", "Theory", "2026-27")[0].row.studentId, "s1");
  assert.ok(validateMarks({ studentId: "s1", subject: "Math", exam: "Test", maxMarks: 0, obtainedMarks: 0 }));
  assert.ok(validateMarks({ studentId: "s1", subject: "Math", exam: "Test", maxMarks: 100, obtainedMarks: "" }));
  const summary = aggregateResults([{ subject: "Math", maxMarks: 80, obtainedMarks: 25 }, { subject: "Math", maxMarks: 20, obtainedMarks: 20 }, { subject: "English", maxMarks: 100, obtainedMarks: 90 }]);
  assert.equal(summary.percentage, 67.5); assert.equal(summary.pass, true);
});
