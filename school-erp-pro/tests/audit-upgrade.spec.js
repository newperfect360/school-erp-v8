import { nav } from "./portal-navigation.mjs";
import { test, expect } from "@playwright/test";
import * as XLSX from "xlsx";
import { coreDesignFixture } from "./fixtures/core-design.mjs";
import fs from "node:fs/promises";

const seed = () => {
  const data = coreDesignFixture();
  data.erp_pro_library = [{ id: "old-book", "Book ID": "OLD-1", "पुस्तकाचे नाव": "Original school book", "Available Copies": "1" }];
  data.erp_pro_library_books = [{ id: "book1", bookId: "B1", name: "A World of Science", author: "School Library", copies: 1 }];
  data.erp_pro_sports_equipment = [{ id: "ball1", name: "Football", quantity: 1, condition: "Good" }];
  data.erp_pro_sports_athletes = [{ id: "athlete1", studentId: data.erp_pro_students[0].id, student: data.erp_pro_students[0].name, grNo: data.erp_pro_students[0].grNo, sport: "Athletics", ageGroup: "Under 14", level: "District", medal: "Silver" }];
  data.erp_pro_trips = [{ id: "trip1", name: "Science discovery visit", destination: "Science Centre", startDate: "2026-10-12", inCharge: "School teacher", status: "Planned", participants: data.erp_pro_students.slice(0, 3).map(s => ({ studentId: s.id, consent: "प्रलंबित", boarding: "नोंद नाही" })) }];
  return data;
};
async function setup(page, data = seed()) {
  await page.goto("/");
  await page.evaluate(data => { localStorage.clear(); for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value)); }, data);
  await page.reload(); await login(page);
}
async function login(page) {
  await page.getByLabel("Username", { exact: true }).fill("admin"); await page.getByLabel("Password", { exact: true }).fill("admin1234"); await page.getByRole("button", { name: "Login", exact: true }).click();
}

const stored = (page, key) => page.evaluate(key => JSON.parse(localStorage.getItem(key) || "null"), key);
const csv = text => ({ name: "school.csv", mimeType: "text/csv", buffer: Buffer.from(text) });

test("all routes render, desktop/mobile fit, and the requested review gallery is captured", async ({ page }) => {
  test.setTimeout(90000); const errors = []; page.on("pageerror", e => errors.push(e.message));
  await setup(page); const keys = await page.locator(".portal-nav [data-nav]").evaluateAll(nodes => [...new Set(nodes.map(n => n.dataset.nav))]);
  for (const key of keys) { await nav(page, key); await expect(page.locator("#school-main")).toBeVisible(); await expect(page.getByText("This page could not be displayed")).toHaveCount(0); expect((await page.locator("#school-main").innerText()).length).toBeGreaterThan(50); }
  await fs.mkdir("artifacts/full-audit-review", { recursive: true });
  const screens = ["Dashboard", "Students", "Attendance", "Homework", "Results", "Certificates", "Trips", "Sports", "Library", "Communications", "TeacherDashboard", "Scholarships", "Admissions", "Formats", "AccessSetup"];
  await page.setViewportSize({ width: 1440, height: 1024 });
  for (const key of screens) { await nav(page, key);  }
  await nav(page, "Students"); await page.getByRole("button", { name: "Import Excel", exact: true }).click(); await page.getByLabel("Upload Excel", { exact: true }).setInputFiles(csv("Name,GR No,Standard,Division,Mobile,DOB\nNew Learner,NEW-001,8,A,9876543210,2012-05-10")); await page.getByRole("button", { name: "Validate", exact: true }).click(); 
  await page.setViewportSize({ width: 390, height: 844 });
  for (const key of screens) { await nav(page, key); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), key).toBe(true); }
  await nav(page, "Dashboard"); 
  await nav(page, "Students"); await page.locator('.directory-student').first().click(); 
  await page.reload(); 
  await page.setViewportSize({ width: 1440, height: 1024 }); 
  expect(errors).toEqual([]);
});

test("student import requires validation and acknowledgement; safe bulk update preserves identity and blanks", async ({ page }) => {
  await setup(page); await nav(page, "Students"); await page.getByRole("button", { name: "Import Excel", exact: true }).click();
  const before = await stored(page, "erp_pro_students");
  const file = csv("Name,GR No,Standard,Division,Mobile,DOB,Student Name Marathi\nNew Learner,NEW-001,8,A,9876543210,2012-05-10,नवा विद्यार्थी");
  await page.getByLabel("Upload Excel", { exact: true }).setInputFiles(file);
  await expect(page.getByRole("button", { name: "Confirm Import", exact: true })).toBeDisabled(); expect(await stored(page, "erp_pro_students")).toEqual(before);
  await page.getByRole("button", { name: "Validate", exact: true }).click(); await page.getByLabel("I reviewed all rows and before/after changes. Save only the selected actions.").check(); await page.getByRole("button", { name: "Confirm Import", exact: true }).click();
  const imported = (await stored(page, "erp_pro_students")).find(s => s.grNo === "NEW-001"); expect(imported.student_name_mr).toBe("नवा विद्यार्थी"); expect(imported.id).toBeTruthy();
  await page.getByRole("button", { name: "Import Excel", exact: true }).click(); await page.getByLabel("Import operation").selectOption("update");
  await page.getByLabel("Upload Excel", { exact: true }).setInputFiles(csv("GR No,Name,Mobile,Address\nNEW-001,Do not overwrite name,9876543211,")); await page.getByRole("button", { name: "Validate", exact: true }).click(); await page.getByLabel("Action row 2").selectOption("update"); await page.getByLabel("I reviewed all rows and before/after changes. Save only the selected actions.").check(); await page.getByRole("button", { name: "Confirm Import", exact: true }).click();
  const updated = (await stored(page, "erp_pro_students")).find(s => s.grNo === "NEW-001"); expect(updated.id).toBe(imported.id); expect(updated.name).toBe("New Learner"); expect(updated.mobile).toBe("9876543211"); expect(updated.student_name_mr).toBe("नवा विद्यार्थी");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export Excel", exact: true }).click()]); const book = XLSX.read(await fs.readFile(await download.path())); expect(XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]])).toHaveLength(before.length + 1);
});

test("file duplicates and stale preview cannot silently save", async ({ page }) => {
  await setup(page); await nav(page, "Students"); await page.getByRole("button", { name: "Import Excel", exact: true }).click();
  await page.getByLabel("Upload Excel", { exact: true }).setInputFiles(csv("Name,GR No,Standard\nChild A,GX,8\nChild B,gx,8")); await page.getByRole("button", { name: "Validate", exact: true }).click(); await expect(page.getByRole("button", { name: "Confirm Import", exact: true })).toBeDisabled(); expect(await page.locator(".import-invalid").count()).toBe(2);
  await page.getByLabel("Upload Excel", { exact: true }).setInputFiles(csv("Name,GR No,Standard\nChild A,GX,8")); await page.getByRole("button", { name: "Validate", exact: true }).click(); await page.getByLabel("I reviewed all rows and before/after changes. Save only the selected actions.").check();
  await page.evaluate(() => { const rows = JSON.parse(localStorage.getItem("erp_pro_students")); rows[0].address = "Other tab edit"; localStorage.setItem("erp_pro_students", JSON.stringify(rows)); });
  await page.getByRole("button", { name: "Confirm Import", exact: true }).click(); expect((await stored(page, "erp_pro_students")).some(s => s.grNo === "GX")).toBe(false); await expect(page.getByText("Data changed since preview. Reload and validate again.")).toBeVisible();
});

test("marks Excel, student ID mapping, grades, saved certificate snapshots and safe templates", async ({ page }) => {
  await setup(page); await nav(page, "Results"); const data = seed(); const first = data.erp_pro_students[0];
  await page.getByLabel("Upload marks", { exact: true }).setInputFiles(csv(`Student Name,GR Number,Roll Number,Subject,Maximum Marks,Obtained Marks\n${first.name},${first.grNo},01,Math,100,81`));
  await page.getByRole("button", { name: "Validate marks", exact: true }).click(); await page.getByLabel("I reviewed all uploaded marks and any replacements.").check(); await page.getByRole("button", { name: "Confirm Marks Import", exact: true }).click();
  const results = await stored(page, "erp_pro_results"); expect(results.at(-1).studentId).toBe(first.id); expect(results.at(-1).percentage).toBe(81);
  await page.getByLabel("Student", { exact: true }).selectOption(first.id); await page.getByRole("button", { name: "Preview marksheet", exact: true }).click(); await expect(page.frameLocator('iframe[title="Marksheet preview"]').getByText("81/100", { exact: false })).toBeVisible();
  await nav(page, "Certificates"); await page.getByLabel("Document student", { exact: true }).selectOption(data.erp_pro_students[12].id); await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.frameLocator('iframe[title="School document preview"]').getByText(`GR: ${data.erp_pro_students[12].grNo}`, { exact: false })).toBeVisible(); await page.getByRole("button", { name: "Generate Bonafide", exact: true }).click();
  const issues = await stored(page, "erp_pro_certificates"); expect(issues.at(-1).studentId).toBe(data.erp_pro_students[12].id); expect(issues.at(-1).draft).toBe(true); expect(issues.at(-1).html).toContain(data.erp_pro_students[12].grNo);
  await page.getByRole("button", { name: "Customize school format", exact: true }).click(); await page.getByLabel("Template HTML").fill('<h1>{{student_name}}</h1><script>window.parent.hacked=true</script><img src="https://example.test/track" onerror="alert(1)"><p>{{gr_number}}</p>'); await page.getByRole("button", { name: "Save template", exact: true }).click();
  const saved = (await stored(page, "erp_pro_document_templates"))[0]; expect(saved.html).not.toContain("script"); expect(saved.html).not.toContain("onerror"); expect(saved.html).not.toContain("https://");
});

test("library stock, legacy catalog, returns, equipment loss and scholarship application", async ({ page }) => {
  await setup(page); await nav(page, "Library"); await expect(page.getByRole("heading", { name: "Original school book" })).toBeVisible();
  await page.getByLabel("Student", { exact: true }).selectOption("review-student-1"); await page.getByLabel("Book", { exact: true }).selectOption("book1"); await page.getByLabel("Due Date", { exact: true }).fill("2027-12-31"); await page.getByRole("button", { name: "Issue book", exact: true }).click();
  await page.getByLabel("Student", { exact: true }).selectOption("review-student-2"); await page.getByLabel("Book", { exact: true }).selectOption("book1"); await page.getByLabel("Due Date", { exact: true }).fill("2027-12-31"); await page.getByRole("button", { name: "Issue book", exact: true }).click(); expect(await stored(page, "erp_pro_library_loans")).toHaveLength(1);
  await page.getByRole("button", { name: "Return book", exact: true }).click(); expect((await stored(page, "erp_pro_library_loans"))[0].returned).toBe(true); expect(await stored(page, "erp_pro_library")).toHaveLength(1);
  await nav(page, "Sports"); await page.getByLabel("Borrowing student").selectOption("review-student-1"); await page.getByLabel("Equipment", { exact: true }).selectOption("ball1"); await page.getByLabel("Return due").fill("2027-12-31"); await page.getByRole("button", { name: "Issue equipment", exact: true }).click(); const loans = await stored(page, "erp_pro_equipment_loans"); await page.getByLabel(`Return ${loans[0].id}`).selectOption("Lost"); await page.getByRole("button", { name: "Issue equipment", exact: true }).click(); expect(await stored(page, "erp_pro_equipment_loans")).toHaveLength(1);
  await nav(page, "Scholarships"); await page.getByLabel("Student", { exact: true }).selectOption("review-student-1"); await page.getByLabel("scholarship", { exact: true }).fill("Merit support"); await page.getByLabel("eligibility", { exact: true }).fill("School review completed"); await page.getByLabel("deadline", { exact: true }).fill("2027-01-01"); await page.getByRole("button", { name: "Save application", exact: true }).click(); expect((await stored(page, "erp_pro_scholarship_applications"))[0].studentId).toBe("review-student-1");
});

test("homework attachment survives reload, trip selection and correct parent call history", async ({ page }) => {
  await setup(page); await nav(page, "Homework"); await page.getByLabel("Standard", { exact: true }).fill("8"); await page.getByLabel("Subject", { exact: true }).fill("Science"); await page.getByRole("textbox", { name: "Homework", exact: true }).fill("Observe a plant"); await page.getByLabel("Attachment", { exact: true }).setInputFiles({ name: "worksheet.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") }); await page.getByRole("button", { name: "Save Homework", exact: true }).click(); await page.reload(); await login(page); await nav(page, "Homework"); await expect(page.getByRole("link", { name: "worksheet.pdf" })).toBeVisible();
  await nav(page, "Trips"); await page.getByLabel("Trip status", { exact: true }).selectOption("Active"); await page.getByLabel("Consent 2026101", { exact: true }).selectOption("मिळाली"); expect((await stored(page, "erp_pro_trips"))[0].status).toBe("Active");
  await nav(page, "Communications"); await page.getByLabel("Find student", { exact: true }).fill("2026101"); await page.getByLabel("Parent contact 2026101", { exact: true }).selectOption("mother"); const call = page.getByRole("link", { name: "Call Parent", exact: true }); await expect(call).toHaveAttribute("href", "tel:+919000002001");
  await page.evaluate(() => document.addEventListener("click", event => { if (event.target.closest('a[href^="tel:"]')) event.preventDefault(); })); await call.click(); const history = await stored(page, "erp_pro_absence_communications"); expect(history.at(-1).studentId).toBe("review-student-1"); expect(history.at(-1).parentMobile).toBe("+919000002001"); expect(history.at(-1).status).toBe("Call Initiated");
});
