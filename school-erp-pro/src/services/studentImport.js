import { bilingualStudent } from "./bilingualStudent.js";
import { normalizeStudentRow } from "./excel.js";

export const canonical = value => String(value ?? "").trim().normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ");
export const updateFields = ["photoNumber", "father_name_mr", "mother_name_mr", "address_mr","mobile", "whatsapp", "fatherMobile", "motherMobile", "guardianMobile", "alternateMobile", "emergencyContact", "address", "className", "division", "rollNo", "scholarship", "sports", "academicYear", "fatherName", "motherName", "guardianName", "alternateName", "healthNotes", "student_name_mr"];
export function normalizeDate(value) {
  const input = String(value ?? "").trim();
  if (!input) return "";
  let y, m, d;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(input)) [y, m, d] = input.split("-").map(Number);
  else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(input)) [d, m, y] = input.split(/[/-]/).map(Number);
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (y < 1900 || date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
export function normalizeMobile(value) {
  const digits = String(value ?? "").replace(/[\s()-]/g, "");
  if (!digits) return "";
  if (/^[6-9]\d{9}$/.test(digits)) return digits;
  if (/^(\+91|91)[6-9]\d{9}$/.test(digits)) return digits.slice(-10);
  if (digits.startsWith("+91")) return null;
  if (/^\+[1-9]\d{7,14}$/.test(digits)) return digits;
  return null;
}
const identityKeys = student => [student.grNo && `gr:${canonical(student.grNo)}`, student.admissionNo && `ad:${canonical(student.admissionNo)}`, student.name && normalizeDate(student.dob) && `person:${canonical(student.name)}:${normalizeDate(student.dob)}`].filter(Boolean);

export function reviewStudentImport(rows, mapping, existing, { mode = "create", fields = updateFields, overrides = {} } = {}) {
  const targets = Object.values(mapping).filter(Boolean);
  const repeatedMapping = targets.length !== new Set(targets).size;
  const identityIndex = new Map();
  for (const student of existing) for (const key of identityKeys(student)) { if (!identityIndex.has(key)) identityIndex.set(key, []); identityIndex.get(key).push(student); }
  const results = rows.map((row, index) => {
    const student = { ...normalizeStudentRow(row, mapping), ...overrides[index] };
    const errors = [], warnings = [];
    if (repeatedMapping) errors.push("Map each Student Master field to only one column.");
    for (const key of ["dob", "admissionDate"]) if (student[key]) {
      const date = normalizeDate(student[key]);
      if (!date) errors.push(`${key}: use YYYY-MM-DD or DD/MM/YYYY.`); else student[key] = date;
    }
    for (const key of ["mobile", "whatsapp", "fatherMobile", "motherMobile", "guardianMobile", "alternateMobile", "emergencyContact"]) if (student[key]) {
      const mobile = normalizeMobile(student[key]);
      if (mobile === null) errors.push(`${key}: invalid mobile number.`); else student[key] = mobile;
    }
    if (student.dob && student.dob > new Date().toISOString().slice(0, 10)) errors.push("Date of birth cannot be in the future.");
    const matches = [...new Set(identityKeys(student).flatMap(key => identityIndex.get(key) || []))];
    const duplicate = matches.length === 1 ? matches[0] : null;
    if (matches.length > 1) errors.push("Conflicting identifiers match multiple students. Review manually.");
    if (duplicate?.archivedAt) errors.push("Matched student is archived. Restore and review the record first.");
    if (mode === "update" && !duplicate) errors.push("Update requires one existing GR/admission or name + DOB match.");
    if (!duplicate && mode === "create") for (const key of ["name", "grNo", "className"]) if (!student[key]) errors.push(`${key} is required.`);
    if (!student.grNo && !student.admissionNo && !(student.name && student.dob)) errors.push("Provide GR, admission number, or name and DOB for identity matching.");
    if (student.mobile && existing.some(item => !matches.includes(item) && normalizeMobile(item.mobile) === student.mobile)) warnings.push("Shared parent mobile: possible siblings. Never used for automatic matching.");
    const changes = duplicate ? fields.filter(key => updateFields.includes(key) && student[key] !== undefined && student[key] !== "" && String(student[key]) !== String(duplicate[key] ?? "")).map(key => ({ field: key, before: duplicate[key] ?? "", after: student[key] })) : [];
    return { rowNumber: row.__row || index + 2, index, student, duplicate, errors, warnings, changes };
  });
  const seen = new Map(), message = "Repeated/conflicting identity within this file. Correct or skip the rows.";
  for (const result of results) for (const key of [...identityKeys(result.student), ...(result.duplicate ? [`id:${result.duplicate.id}`] : [])]) {
    if (seen.has(key)) { const previous = seen.get(key); if (!result.errors.includes(message)) result.errors.push(message); if (!previous.errors.includes(message)) previous.errors.push(message); }
    else seen.set(key, result);
  }
  return results;
}

export function applyStudentImport(existing, results, choices = {}) {
  let next = [...existing];
  let added = 0, updated = 0, skipped = 0;
  for (const result of results) {
    const choice = choices[result.index] || (result.duplicate ? "review" : "create");
    if (choice === "skip") { skipped++; continue; }
    if (result.errors.length || choice === "review") throw new Error(`Review or explicitly skip row ${result.rowNumber} before confirming.`);
    if (result.duplicate) {
      if (choice !== "update") throw new Error("Choose Update Existing or Skip for a duplicate.");
      next = next.map(item => item.id === result.duplicate.id ? bilingualStudent({ ...item, ...Object.fromEntries(result.changes.map(change => [change.field, change.after])), updatedAt: new Date().toISOString() }) : item);
      updated++;
    } else {
      next.push(bilingualStudent({ ...result.student, student_name_en: result.student.name, id: crypto.randomUUID(), createdAt: new Date().toISOString() })); added++;
    }
  }
  return { students: next, added, updated, skipped };
}
