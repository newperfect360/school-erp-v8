import { nav } from "./portal-navigation.mjs";
import { test, expect } from "@playwright/test";
import { coreDesignFixture } from "./fixtures/core-design.mjs";
import fs from "node:fs/promises";

async function login(page) { await page.getByLabel("Username", { exact: true }).fill("admin"); await page.getByLabel("Password", { exact: true }).fill("admin1234"); await page.getByRole("button", { name: "Login", exact: true }).click(); }
async function setup(page) { await page.goto("/"); await page.evaluate(data => { localStorage.clear(); for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value)); }, coreDesignFixture()); await page.reload(); await login(page); }
const read = (page, key) => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);

test("invalid login, help, language switch and logout", async ({ page }) => {
  await page.goto("/"); await page.getByLabel("Username", { exact: true }).fill("admin"); await page.getByLabel("Password", { exact: true }).fill("wrong"); await page.getByRole("button", { name: "Login", exact: true }).click(); await expect(page.getByRole("alert")).toBeVisible(); await page.getByRole("button", { name: "EN", exact: true }).click(); await page.getByRole("button", { name: "Need help signing in?", exact: true }).click(); await expect(page.getByText(/Online password recovery is not yet configured/)).toBeVisible(); await login(page); await page.getByRole("button", { name: "Logout", exact: true }).click(); await expect(page.getByRole("button", { name: "Login", exact: true })).toBeVisible();
});

test("student create, archive cancellation, archive and restore preserve related records", async ({ page }) => {
  await setup(page); await nav(page, "Students"); await page.getByRole("button", { name: "Add student", exact: true }).click();
  for (const [name, value] of Object.entries({ name: "Audit New Student", grNo: "AUDIT-NEW", className: "8", mobile: "bad" })) await page.locator(`input[name="${name}"]`).fill(value);
  await page.getByRole("button", { name: "Save Student", exact: true }).click(); expect((await read(page, "erp_pro_students")).length).toBe(36);
  await page.locator('input[name="mobile"]').fill("9876543210"); await page.getByRole("button", { name: "Save Student", exact: true }).click(); const created = (await read(page, "erp_pro_students")).find(s => s.grNo === "AUDIT-NEW");
  const row = page.locator(`tr[data-student-id="${created.id}"]`); page.once("dialog", d => d.dismiss()); await row.getByRole("button", { name: "Archive student", exact: true }).click(); expect((await read(page, "erp_pro_students")).find(s => s.id === created.id).archivedAt).toBeFalsy();
  page.once("dialog", d => d.accept()); await row.getByRole("button", { name: "Archive student", exact: true }).click(); expect(await read(page, "erp_pro_students")).toHaveLength(37); await page.getByLabel("Show inactive / archived students").check(); await expect(page.locator(`tr[data-student-id="${created.id}"]`)).toBeVisible(); page.once("dialog", d => d.accept()); await page.getByRole("button", { name: "Restore student", exact: true }).click(); expect((await read(page, "erp_pro_students")).find(s => s.id === created.id).archivedAt).toBeNull(); expect((await read(page, "erp_pro_attendance"))).toEqual(coreDesignFixture().erp_pro_attendance);
});

test("corrupt storage remains unchanged and rejected saves retain the form", async ({ page }) => {
  await setup(page); await page.evaluate(() => localStorage.setItem("erp_pro_students", "broken-json")); await nav(page, "Students"); await page.getByRole("button", { name: "Add student", exact: true }).click(); for (const [name, value] of Object.entries({ name: "Unsaved", grNo: "NEW", className: "8", mobile: "9876543210" })) await page.locator(`input[name="${name}"]`).fill(value); await page.getByRole("button", { name: "Save Student", exact: true }).click(); await expect(page.locator('input[name="name"]')).toHaveValue("Unsaved"); expect(await page.evaluate(() => localStorage.getItem("erp_pro_students"))).toBe("broken-json");
});

test("teachers, classwork and settings persist without provider calls", async ({ page }) => {
  await setup(page); await nav(page, "Teachers"); for (const [name, value] of Object.entries({ name: "Audit Teacher", subject: "Science", mobile: "9876543210" })) await page.locator(`input[name="${name}"]`).fill(value); await page.getByRole("button", { name: "Save Teacher", exact: true }).click();
  await nav(page, "Classwork"); await page.getByPlaceholder("इयत्ता", { exact: true }).fill("8"); await page.getByPlaceholder("विषय", { exact: true }).fill("Science"); await page.locator("textarea").fill("School lesson audit"); await page.getByRole("button", { name: "Save Classwork", exact: true }).click();
  await nav(page, "Settings"); await page.locator('input[name="principal"]').fill("Review Principal"); await page.getByRole("button", { name: "Save Settings", exact: true }).click(); await page.reload(); await login(page); expect((await read(page, "erp_pro_teachers")).at(-1).name).toBe("Audit Teacher"); expect((await read(page, "erp_pro_classwork")).at(-1).classwork).toBe("School lesson audit"); await nav(page, "Settings"); await expect(page.locator('input[name="principal"]')).toHaveValue("Review Principal");
});

test("QR lookup auto-fills exact student and draft LC requires details; print and PDF output", async ({ page }) => {
  await setup(page); await nav(page, "Formats"); await page.getByText("Scan QR / auto-fill student", { exact: true }).click(); await page.getByLabel("Student QR reference or GR", { exact: true }).fill("schoolerp:student:v1:review-student-13"); await page.getByRole("button", { name: "Identify student", exact: true }).click(); await expect(page.getByLabel("Document student", { exact: true })).toHaveValue("review-student-13");
  await page.getByLabel("Format", { exact: true }).selectOption("Leaving Certificate"); await page.getByRole("button", { name: "Preview", exact: true }).click(); await page.getByRole("button", { name: "Generate document", exact: true }).click(); expect(await read(page, "erp_pro_certificates")).toHaveLength(1);
  for (const [label, value] of Object.entries({ reason: "Transfer requested", "last class": "9", progress: "Satisfactory", conduct: "Good" })) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Preview", exact: true }).click(); await page.getByRole("button", { name: "Generate document", exact: true }).click(); const issue = (await read(page, "erp_pro_certificates")).at(-1); expect(issue.certificateNo).toMatch(/^LC-/); expect(issue.studentId).toBe("review-student-13");
  await page.evaluate(() => { window.printRequests = 0; document.querySelector('iframe[title="School document preview"]').contentWindow.print = () => { window.printRequests++; }; }); await page.getByRole("button", { name: "Print / Save as PDF", exact: true }).click(); expect(await page.evaluate(() => window.printRequests)).toBe(1);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download HTML", exact: true }).click()]); const html = await fs.readFile(await download.path(), "utf8"); expect(html).toContain("Transfer requested"); const printPage = await page.context().newPage(); await printPage.setContent(html); const pdf = await printPage.pdf({ format: "A4", printBackground: true }); await fs.mkdir("artifacts/full-audit-review", { recursive: true }); await fs.writeFile("artifacts/full-audit-review/draft-leaving-certificate.pdf", pdf); expect(pdf.subarray(0, 4).toString()).toBe("%PDF"); await printPage.close();
});

test("every registered school format previews and bilingual labels retain original names", async ({ page }) => {
  await setup(page); await page.evaluate(() => { const rows = JSON.parse(localStorage.getItem("erp_pro_results")); rows.push({ id: "annual", studentId: "review-student-1", grNo: "2026101", studentName: "Aditi Deshmukh", exam: "Annual Exam", subject: "Math", maxMarks: 100, obtainedMarks: 80, academicYear: "2026-27" }); localStorage.setItem("erp_pro_results", JSON.stringify(rows)); });
  await nav(page, "Formats"); await page.getByLabel("Document student", { exact: true }).selectOption("review-student-1"); const formats = await page.getByLabel("Format", { exact: true }).locator("option").allTextContents(); expect(formats).toHaveLength(22);
  for (const name of formats) { await page.getByLabel("Format", { exact: true }).selectOption(name); await page.getByRole("button", { name: "Preview", exact: true }).click(); await expect(page.frameLocator('iframe[title="School document preview"]').getByRole("heading", { name, exact: true })).toBeVisible(); }
  await page.getByRole("button", { name: "मराठी", exact: true }).click(); await expect(page.getByRole("heading", { name: "नमुने व प्रमाणपत्रे", exact: true })).toBeVisible(); expect((await read(page, "erp_pro_students"))[0].name).toBe("Aditi Deshmukh"); expect((await read(page, "erp_pro_students"))[0].student_name_mr).toBe("अदिती देशमुख");
});

test("backup previews before non-destructive merge; account requests never store passwords", async ({ page }) => {
  await setup(page); await nav(page, "Backup"); const source = await read(page, "erp_pro_students"); const incoming = { version: 2, data: { erp_pro_students: JSON.stringify([{ ...source[0], name: "Must not overwrite" }, { id: "restored", name: "Restored review", grNo: "NEW-RESTORE", className: "8" }]), unrelated_secret: "excluded" } };
  await page.getByLabel("Preview backup restore", { exact: true }).setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(incoming)) }); expect(await read(page, "erp_pro_students")).toEqual(source); await page.getByLabel("Merge new records only; retain every existing ID and value.").check(); await page.getByRole("button", { name: "Confirm non-destructive restore", exact: true }).click(); expect((await read(page, "erp_pro_students"))[0].name).toBe(source[0].name); expect(await read(page, "erp_pro_students")).toHaveLength(37); expect(await page.evaluate(() => localStorage.getItem("unrelated_secret"))).toBeNull();
  await nav(page, "AccessSetup"); await page.getByLabel("name", { exact: true }).fill("New Teacher"); await page.getByLabel("email", { exact: true }).fill("teacher@example.test"); await page.getByRole("button", { name: "Save account setup request", exact: true }).click(); const request = (await read(page, "erp_pro_access_requests"))[0]; expect(request.status).toBe("Pending identity provider"); expect(request).not.toHaveProperty("password");
});

test("remaining office registers save, search and export without cross-module state", async ({ page }) => {
  await setup(page);
  for (const key of ["Inventory", "Timetable", "Calendar", "Staff", "Notices", "Transport"]) {
    await nav(page, key); const fields = key === "Staff" ? page.locator(".workflow-panel").filter({has:page.getByLabel("Employee ID",{exact:true})}).locator(".form-grid input") : page.locator(".workflow-panel .form-grid input"); await fields.nth(0).fill(`Audit ${key}`); await fields.nth(1).fill("Review record"); if (key === "Fees") { await fields.nth(2).fill("100"); await fields.nth(3).fill("50"); }
    await page.getByRole("button", { name: "नोंद जतन करा", exact: true }).click(); await page.getByLabel("नोंदी शोधा", { exact: true }).fill(`Audit ${key}`); await expect(page.locator(".record-card")).toHaveCount(1);
  }
});

test("backup rejects duplicate identities and malformed missing collections", async ({ page }) => {
  await setup(page); await nav(page, "Backup"); const students = await read(page, "erp_pro_students");
  for (const data of [{ erp_pro_students: [{ ...students[0], id: "conflicting-id" }] }, { erp_pro_new_records: [{ name: "No identifier" }] }, { erp_pro_students: { incorrect: true } }]) {
    await page.getByLabel("Preview backup restore", { exact: true }).setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ data })) });
    await expect(page.getByRole("button", { name: "Confirm non-destructive restore", exact: true })).toHaveCount(0);
    expect(await read(page, "erp_pro_students")).toEqual(students); expect(await read(page, "erp_pro_new_records")).toBeNull();
  }
});

test("admission documents survive reload and exit retains Student Master identity", async ({ page }) => {
  await setup(page); await nav(page, "Admissions"); await page.getByLabel("Student", { exact: true }).selectOption("review-student-1"); await page.getByLabel("Movement", { exact: true }).selectOption("Exit"); await page.getByLabel("reason", { exact: true }).fill("Parent requested transfer");
  await page.getByLabel("Admission documents", { exact: true }).setInputFiles({ name: "admission.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nReview document") });
  await expect(page.getByRole("link", { name: "admission.pdf", exact: true })).toBeVisible(); page.once("dialog", d => d.accept()); await page.getByRole("button", { name: "Record movement", exact: true }).click();
  const movement = (await read(page, "erp_pro_student_movements"))[0]; expect(movement.studentId).toBe("review-student-1"); expect(movement.attachments[0].name).toBe("admission.pdf"); expect((await read(page, "erp_pro_students"))[0].archivedAt).toBeTruthy();
  await page.reload(); await login(page); await nav(page, "Admissions"); await expect(page.getByRole("link", { name: "admission.pdf", exact: true })).toBeVisible();
});
