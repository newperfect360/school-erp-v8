import { test, expect } from "@playwright/test";

async function login(page) {
  await page.goto("/");
  await page.getByLabel("Username", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("123456");
  await page.getByLabel("Password", { exact: true }).press("Enter");
  await expect(page.locator(".sidebar")).toBeVisible();
}
async function nav(page, text) {
  const opener = page.getByRole("button", { name: "Open navigation", exact: true });
  if (await opener.isVisible()) await opener.click();
  await page.locator(".sidebar").getByRole("button", { name: text, exact: true }).click();
}

test("login, every existing navigation entry, logout and mobile layout", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  page.on("dialog", dialog => dialog.dismiss());
  await page.getByLabel("Username", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page.locator(".sidebar")).toHaveCount(0);
  await login(page);
  for (const name of ["विद्यार्थी", "शिक्षक", "उपस्थिती", "गृहपाठ", "वर्गपाठ", "प्रमाणपत्र", "निकाल", "ID Card", "Reports", "Settings", "Dashboard"]) {
    await nav(page, name);
    await expect(page.locator("main")).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await nav(page, "विद्यार्थी");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await nav(page, "Logout");
  await expect(page.getByRole("button", { name: "Login", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("student validation, persistence, attendance by date and delete cancellation", async ({ page }) => {
  await login(page);
  page.on("dialog", dialog => dialog.dismiss());
  await nav(page, "विद्यार्थी");
  for (const [name, value] of Object.entries({ grNo: "TEST-101", name: "Test Student", className: "8", mobile: "abcdefghij", division: "A" })) {
    await page.locator(`input[name="${name}"]`).fill(value);
  }
  await page.getByRole("button", { name: "Save Student", exact: true }).click();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);
  await page.locator('input[name="mobile"]').fill("9999999999");
  await page.getByRole("button", { name: "Save Student", exact: true }).click();
  await nav(page, "Dashboard");
  await nav(page, "विद्यार्थी");
  await expect(page.getByRole("cell", { name: "Test Student", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Test Student", exact: true })).toBeVisible();
  for (const [name, value] of Object.entries({ grNo: "TEST-101", name: "Duplicate", className: "8", mobile: "9999999999" })) await page.locator(`input[name="${name}"]`).fill(value);
  await page.getByRole("button", { name: "Save Student", exact: true }).click();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(1);
  await nav(page, "उपस्थिती");
  await page.locator('input[type="date"]').fill("2026-09-15");
  const absentButton = page.locator(".attendance-buttons .absent");
  if (await absentButton.isVisible()) await absentButton.click();
  else await page.locator("select").selectOption("Absent");
  await page.locator('input[type="date"]').fill("2026-09-16");
  await expect(page.locator("select")).toHaveValue("Present");
  await login(page);
  await nav(page, "उपस्थिती");
  await page.locator('input[type="date"]').fill("2026-09-15");
  await expect(page.locator("select")).toHaveValue("Absent");
});

test("teachers, homework, classwork and settings survive reload", async ({ page }) => {
  await login(page);
  page.on("dialog", dialog => dialog.dismiss());
  await nav(page, "शिक्षक");
  for (const [name, value] of Object.entries({ name: "Test Teacher", subject: "Math", mobile: "9999999999" })) await page.locator(`input[name="${name}"]`).fill(value);
  await page.getByRole("button", { name: "Save Teacher", exact: true }).click();
  for (const [menu, content, button] of [["गृहपाठ", "Homework test", "Save Homework"], ["वर्गपाठ", "Classwork test", "Save Classwork"]]) {
    await nav(page, menu);
    await page.getByPlaceholder("इयत्ता", { exact: true }).fill("8");
    await page.getByPlaceholder("विषय", { exact: true }).fill("Math");
    await page.locator("textarea").fill(content);
    await page.getByRole("button", { name: button, exact: true }).click();
  }
  await nav(page, "Settings");
  await page.locator('input[name="principal"]').fill("Test Principal");
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await login(page);
  for (const [menu, content] of [["शिक्षक", "Test Teacher"], ["गृहपाठ", "Homework test"], ["वर्गपाठ", "Classwork test"]]) {
    await nav(page, menu);
    await expect(page.getByRole("cell", { name: content, exact: true })).toBeVisible();
  }
  await nav(page, "Settings");
  await expect(page.locator('input[name="principal"]')).toHaveValue("Test Principal");
});

test("corrupt storage is preserved and failed save retains form", async ({ page }) => {
  await login(page);
  await page.evaluate(() => localStorage.setItem("erp_pro_students", "broken-json"));
  page.on("dialog", dialog => dialog.dismiss());
  await nav(page, "विद्यार्थी");
  for (const [name, value] of Object.entries({ grNo: "TEST-101", name: "Unsaved Student", className: "8", mobile: "9999999999" })) await page.locator(`input[name="${name}"]`).fill(value);
  await page.getByRole("button", { name: "Save Student", exact: true }).click();
  await expect(page.locator('input[name="name"]')).toHaveValue("Unsaved Student");
  expect(await page.evaluate(() => localStorage.getItem("erp_pro_students"))).toBe("broken-json");
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);
});
