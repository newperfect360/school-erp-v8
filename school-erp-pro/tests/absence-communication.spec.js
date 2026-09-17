import { test, expect } from "@playwright/test";

const roster = [
  { id: "student-a", grNo: "A1", name: "Asha", className: "8", division: "A", mobile: "9876543210", fatherName: "Father A", fatherMobile: "9876543211", motherName: "Mother A", motherMobile: "9876543212" },
  { id: "student-b", grNo: "B1", name: "Asha", className: "9", division: "B", mobile: "9987654321", guardianName: "Guardian B" },
  { id: "student-c", grNo: "C1", name: "Invalid Contact", className: "9", division: "B", mobile: "bad9876543210" },
];
async function login(page) {
  await page.getByLabel("Username", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  const menu = page.getByRole("button", { name: "Open navigation", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.locator(".sidebar").getByRole("button", { name: "उपस्थिती", exact: true }).click();
}
async function setup(page) {
  await page.goto("/");
  await page.evaluate(students => {
    localStorage.clear(); localStorage.setItem("erp_pro_students", JSON.stringify(students));
  }, roster);
  await login(page);
  await page.locator('input[type="date"]').fill("2026-09-17");
  // Prevent native navigation only after React has logged the action. No real parent contact.
  await page.evaluate(() => document.addEventListener("click", e => { if (e.target.closest("a.contact-action")) e.preventDefault(); }));
}
const row = (page, id) => page.locator(`.attendance-table tr[data-student-id="${id}"]`);
async function absent(page, id) { await row(page, id).locator(".attendance-buttons .absent").click(); }
const history = page => page.evaluate(() => JSON.parse(localStorage.getItem("erp_pro_absence_communications") || "[]"));

test("mobile: correct parent links, same-name isolation and durable call history", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await absent(page, "student-a"); await absent(page, "student-b");
  await row(page, "student-a").getByLabel("Parent contact for Asha").selectOption("mother");
  const call = row(page, "student-a").getByRole("link", { name: "Call Parent" });
  await expect(call).toHaveAttribute("href", "tel:+919876543212");
  await call.click();
  const wa = row(page, "student-a").getByRole("link", { name: "WhatsApp", exact: true });
  await expect(wa).toHaveAttribute("href", /https:\/\/wa.me\/919876543212\?text=/);
  expect(decodeURIComponent(await wa.getAttribute("href"))).toContain("Class 8/A"); await wa.click();
  const sms = row(page, "student-b").getByRole("link", { name: "SMS", exact: true });
  await expect(sms).toHaveAttribute("href", /^sms:\+919987654321\?body=/); await sms.click();
  const logs = await history(page);
  expect(logs.map(h => [h.studentId, h.parentMobile, h.channel])).toEqual([["student-a", "+919876543212", "call"], ["student-a", "+919876543212", "whatsapp"], ["student-b", "+919987654321", "sms"]]);
  await row(page, "student-a").getByRole("button", { name: "View Communication History for Asha" }).click();
  await page.getByLabel(`Call remark ${logs[0].id}`).fill("No answer");
  const card = page.locator('.followup-card[data-student-id="student-a"]');
  await card.getByLabel("Parent Response for Asha").fill("Will call back");
  await card.getByLabel("Follow-up Status for Asha").selectOption("Follow-up Required");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/absence-mobile.png", fullPage: true });
  await page.reload(); await login(page);
  await page.locator('input[type="date"]').fill("2026-09-17");
  expect((await history(page))[0].remark).toBe("No answer");
  await expect(page.locator('.followup-card[data-student-id="student-a"]').getByLabel("Parent Response for Asha")).toHaveValue("Will call back");
  await expect(page.locator('.followup-card[data-student-id="student-b"]').getByLabel("Parent Response for Asha")).toHaveValue("");
});

test("draft templates, date isolation, invalid contacts and stale Student Master", async ({ page }) => {
  await setup(page);
  await page.getByText("Absence notification settings", { exact: true }).click();
  await page.getByLabel("Automatically prepare a notification when marked absent").check();
  await page.getByLabel("Notification language").selectOption("mr");
  await absent(page, "student-a");
  expect((await history(page))[0].message).toContain("आपले पाल्य Asha");
  await row(page, "student-a").locator(".attendance-buttons .present").click(); await absent(page, "student-a");
  expect((await history(page)).filter(h => h.channel === "notification")).toHaveLength(1);
  await absent(page, "student-c");
  await expect(row(page, "student-c").getByRole("button", { name: "Call Parent" })).toBeDisabled();
  await page.evaluate(() => localStorage.setItem("erp_pro_students", "[]"));
  await row(page, "student-a").getByRole("link", { name: "Call Parent" }).click();
  expect((await history(page)).filter(h => h.channel === "call")).toHaveLength(0);
  await page.locator('input[type="date"]').fill("2026-09-18");
  await expect(page.locator(".followup-card")).toHaveCount(0);
});

test("selected bulk recipients, no bulk calls, CSV and audio cancellation", async ({ page }) => {
  await setup(page); await absent(page, "student-a"); await absent(page, "student-b");
  await page.locator('.followup-card[data-student-id="student-b"] input[type="checkbox"]').check();
  await page.getByRole("button", { name: "Send SMS to selected", exact: true }).click();
  const queue = page.getByRole("region", { name: "Bulk communication queue" });
  await expect(queue.locator("a")).toHaveCount(1);
  await expect(queue.locator("a")).toHaveAttribute("href", /^sms:\+919987654321/);
  await expect(queue.getByRole("link", { name: "Call Parent" })).toHaveCount(0);
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Export parent list" }).click();
  expect((await download).suggestedFilename()).toBe("absent-parents-2026-09-17.csv");
  await row(page, "student-a").getByRole("button", { name: "Audio", exact: true }).click();
  await page.getByLabel("Audio notice (maximum 10 MB)").setInputFiles({ name: "notice.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("test audio") });
  await page.evaluate(() => { navigator.canShare = () => true; navigator.share = async () => { throw new DOMException("Cancelled", "AbortError"); }; });
  await page.getByRole("button", { name: "Send Audio Message", exact: true }).click();
  await expect.poll(async () => (await history(page)).find(h => h.channel === "audio")?.status).toBe("Share cancelled");
});

test("storage failure prevents unlogged contact initiation", async ({ page }) => {
  await setup(page); await absent(page, "student-a");
  await page.evaluate(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === "erp_pro_absence_communications") throw new DOMException("Full", "QuotaExceededError"); return original.call(this, key, value); }; });
  await row(page, "student-a").getByRole("link", { name: "Call Parent" }).click();
  expect(await history(page)).toEqual([]);
});
