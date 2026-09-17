import { test, expect } from '@playwright/test';

async function nav(page, id) { await page.locator(`nav button[onclick="show('${id}',this)"]`).click(); }

test('legacy navigation, student import preserves data, attendance, results, fees, documents and backup', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('dialog', d => d.dismiss());
  await page.goto('http://127.0.0.1:5174');
  await expect(page.locator('.page.show')).toHaveCount(1);
  for (const b of await page.locator('nav button').all()) { await b.click(); await expect(page.locator('.page.show')).toHaveCount(1); }
  await nav(page, 'students');
  await page.locator('#sName').fill('Legacy Test Student');
  await page.locator('#sAdmission').fill('TEST-LEGACY');
  await page.locator('#sRoll').fill('99');
  await page.locator('#sParent').fill('9999999999');
  await page.locator('#students').getByRole('button', { name: 'Save Student', exact: true }).click();
  await page.locator('#students').getByRole('button', { name: 'Import Test List', exact: true }).click();
  await page.locator('#students').getByRole('button', { name: 'Import Test List', exact: true }).click();
  await expect(page.locator('#studentTable tr')).toHaveCount(36);
  await expect(page.locator('#studentTable')).toContainText('Legacy Test Student');
  await nav(page, 'attendance');
  await page.locator('#attendance').getByRole('button', { name: 'यादी दाखवा', exact: true }).click();
  await page.locator('#attList .row').first().getByRole('button', { name: 'A', exact: true }).click();
  await page.getByRole('button', { name: 'Save Attendance', exact: true }).click();
  await expect(page.locator('#attendanceTable tr')).toHaveCount(36);
  await page.locator('#attendance').getByRole('button', { name: 'यादी दाखवा', exact: true }).click();
  await expect(page.locator('#attList .st').first()).toHaveText('A');
  await page.locator('#attClass').selectOption('6वी');
  await page.getByRole('button', { name: 'Save Attendance', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('v32_attendance')).filter(a => a.className === '6वी').length)).toBe(0);
  await nav(page, 'results');
  await page.locator('#resExam').fill('Test Exam');
  await page.locator('#resMarks').fill('Math:75/100,Science:85/100');
  await page.getByRole('button', { name: 'Save Result', exact: true }).click();
  await page.getByRole('button', { name: 'Report Card', exact: true }).click();
  await expect(page.locator('#resultCard')).toContainText('80%');
  await nav(page, 'fees');
  await page.locator('#feeTuition').fill('1000'); await page.locator('#feePaid').fill('400');
  await page.getByRole('button', { name: 'Save Fee', exact: true }).click();
  await page.getByRole('button', { name: 'Receipt', exact: true }).click();
  await expect(page.locator('#receiptBox')).toContainText('Balance 600');
  await nav(page, 'photos');
  await page.locator('#photoType').fill('Test document');
  await page.getByRole('button', { name: 'Save Doc', exact: true }).click();
  await expect(page.locator('#photosTable')).toContainText('Test document');
  await nav(page, 'certificates');
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.locator('#certBox')).toContainText('Legacy Test Student');
  await nav(page, 'settings'); await page.locator('#setPrincipal').fill('Legacy Principal');
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.locator('#settings').getByRole('button', { name: 'Backup JSON', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toContain('backup.json');
  await nav(page, 'reports');
  const excel = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Excel', exact: true }).click();
  expect((await excel).suggestedFilename()).toBe('students.xlsx');
  await page.reload(); await nav(page, 'settings');
  await expect(page.locator('#setPrincipal')).toHaveValue('Legacy Principal');
  expect(errors).toEqual([]);
});

test('invalid restore preserves saved records and verification hash does not crash', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.dismiss());
  await page.goto('http://127.0.0.1:5174');
  await page.evaluate(() => localStorage.setItem('v32_students', JSON.stringify([{ id: 'keep', name: 'Preserved' }])));
  await nav(page, 'cloud');
  await page.locator('#restoreFile').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"D":{"students":null}}') });
  await page.getByRole('button', { name: 'Restore JSON', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('v32_students'))[0].id)).toBe('keep');
  await page.goto('http://127.0.0.1:5174/#verify-student=%E0');
  await expect(page.getByText('Record Not Found')).toBeVisible();
  expect(errors).toEqual([]);
});

test('remaining legacy forms persist records without executing entered markup', async ({ page }) => {
  page.on('dialog', d => d.dismiss());
  await page.goto('http://127.0.0.1:5174');
  await page.evaluate(() => localStorage.setItem('v32_students', JSON.stringify([{id:'test',name:'Test Student',className:'5वी'}])));
  await page.reload();
  for (const [module,fields,button,table] of [
    ['teachers',{tName:'Teacher',tMobile:'9999999999',tSubject:'Math'},'Save Teacher','teachersTable'],
    ['homework',{hwSubject:'Math',hwHomework:'Test homework'},'Save Homework','homeworkTable'],
    ['health',{heightVal:'145',weightVal:'40'},'Save Health','healthTable'],
    ['distribution',{distQty:'1'},'Save','distributionTable'],
    ['library',{bookName:'Test book',bookNo:'TEST-1'},'Save/Issue Book','libraryTable'],
    ['committees',{memberName:'Test member'},'Save','committeesTable'],
    ['transport',{busNo:'TEST-BUS',routeName:'Route',driverName:'Driver'},'Save','transportTable'],
    ['mdm',{mdmCount:'20',mdmMenu:'Test meal'},'Save MDM','mdmTable'],
  ]) {
    await nav(page,module);
    for (const [id,value] of Object.entries(fields)) await page.locator(`#${id}`).fill(value);
    await page.locator(`#${module}`).getByRole('button',{name:button,exact:true}).click();
    await expect(page.locator(`#${table} tr`)).toHaveCount(2);
  }
  await nav(page,'students');
  await page.locator('#sName').fill('<img src=x onerror="window.injected=true">');
  await page.locator('#sAdmission').fill('TEST-XSS');
  await page.locator('#students').getByRole('button',{name:'Save Student',exact:true}).click();
  await expect(page.locator('#studentTable img')).toHaveCount(0);
  expect(await page.evaluate(()=>window.injected)).toBeUndefined();
});
