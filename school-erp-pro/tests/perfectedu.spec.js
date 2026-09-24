import {test,expect} from '@playwright/test';
import {nav} from './portal-navigation.mjs';
import * as XLSX from 'xlsx';

test('PerfectEdu real onboarding, independent admin logins, scoped Excel import and templates',async({page,browser,request})=>{
 test.setTimeout(120000);
 await page.goto('/admin');await page.getByLabel('Platform User ID').fill('admin');await page.getByLabel('Password',{exact:true}).fill('admin1234');await page.getByRole('button',{name:'Platform Login',exact:true}).click();await expect(page.getByRole('button',{name:'Add New School'})).toBeVisible();
 for(const [index,code] of ['DEMO000001','DEMO000002'].entries()){
  await page.getByLabel('Search school name / UDISE').fill(code);
  if(!await page.locator('tbody tr').count()){
   await page.getByRole('button',{name:'Add New School'}).click();await page.getByLabel('UDISE Number',{exact:true}).fill(code);await page.getByLabel('School Name English',{exact:true}).fill('TEST SCHOOL '+(index?'B':'A'));await page.getByLabel('School Name Marathi',{exact:true}).fill(index?'चाचणी शाळा ब':'चाचणी शाळा अ');await page.getByLabel('Institution / Trust English').fill('TEST Trust '+index);await page.getByLabel('Address',{exact:true}).fill('TEST Address '+index);await page.getByRole('button',{name:'Save School',exact:true}).click();
   await page.getByLabel('Admin name').fill('TEST Master Admin '+index);await page.getByLabel('Admin email').fill('test-perfectedu-'+index+'@example.invalid');await page.getByLabel('Admin username').fill('admin');await page.getByLabel('Temporary Password',{exact:true}).fill('TEST-school-'+index+'-password!');await page.getByRole('button',{name:'Save Master Admin'}).click();await expect(page.getByRole('alert')).toContainText('School Admin saved');await page.getByRole('button',{name:'Activate',exact:true}).click();await expect(page.locator('tbody')).toContainText('ACTIVE');
  }
 }
 const contexts=[];
 for(const [index,code] of ['DEMO000001','DEMO000002'].entries()){
  const context=await browser.newContext(),school=await context.newPage();contexts.push(context);await school.goto('/login');await school.getByRole('button',{name:'EN',exact:true}).click();await school.getByLabel('School UDISE Code',{exact:true}).fill(code);await school.getByLabel('Username',{exact:true}).fill('admin');await school.getByLabel('Password',{exact:true}).fill('TEST-school-'+index+'-password!');await school.getByRole('button',{name:'Login',exact:true}).click();await expect(school.locator('.portal-shell')).toBeVisible();await expect(school.locator('.perfectedu-tenant-banner')).toContainText(code);
  await nav(school,'Students');const existing=school.locator('tbody tr').filter({hasText:'TEST-TENANT-GR'});if(await existing.count()){await existing.getByRole('button',{name:'Edit',exact:true}).click();await school.locator('input[name="name"]').fill('TEST Tenant '+index);await school.getByRole('button',{name:'Save Student',exact:true}).click();}await school.getByRole('button',{name:'Import Excel',exact:true}).click();await school.getByLabel('Import academic year').fill('2026-27');await school.getByLabel('Import class',{exact:true}).fill('8');await school.getByLabel('Import division',{exact:true}).fill('A');
  const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet([{'Student Name':'TEST Tenant '+index,'Class':'8','Division':'A','Academic Year':'2026-27','GR Number':'TEST-TENANT-GR','Father Mobile':'9000000101'}]),'Students');
  await school.getByLabel('Upload Excel',{exact:true}).setInputFiles({name:'TEST-tenant.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from(XLSX.write(workbook,{type:'buffer',bookType:'xlsx'}))});await school.getByRole('button',{name:'Validate',exact:true}).click();
  const update=school.locator('select[aria-label^="Action row"]');if(await update.count())for(const option of await update.all())if(await option.locator('option[value="update"]').count())await option.selectOption('update');
  await school.getByLabel('I reviewed all rows and before/after changes. Save only the selected actions.').check();await school.getByRole('button',{name:'Confirm Import',exact:true}).click();await expect(school.getByLabel('Search students')).toBeVisible();await school.getByLabel('Search students').fill('TEST-TENANT-GR');await expect(school.locator('tbody')).toContainText('TEST Tenant '+index);await expect(school.locator('tbody')).not.toContainText('TEST Tenant '+(1-index));
  const result=await school.evaluate(async()=>{const {schoolStorage}=await import(performance.getEntriesByType('resource').filter(r=>r.name.includes('/src/backend/demoClient.js')).at(-1).name);const {defaultFormat,templateContext,renderFormat}=await import('/src/services/templates.js');const settings=JSON.parse(schoolStorage.getItem('schoolSettings')),students=JSON.parse(schoolStorage.getItem('erp_pro_students'));return {settings,students,html:renderFormat(defaultFormat('Bonafide Certificate'),templateContext(students[0],settings))};});
  expect(result.students.every(s=>s.tenantId===result.settings.tenantId)).toBe(true);expect(result.html).toContain(index?'चाचणी शाळा ब':'चाचणी शाळा अ');expect(result.html).not.toContain(index?'चाचणी शाळा अ':'चाचणी शाळा ब');
 }
 for(const context of contexts)await context.close();
 const denied=await request.post('/__school_demo/login',{data:{udise:'DEMO000002',username:'admin',password:'admin1234'}});expect(denied.status()).toBe(401);
});
