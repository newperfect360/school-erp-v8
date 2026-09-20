import {navigationItems} from '../../src/design/navigation.js';
import * as XLSX from '../../node_modules/xlsx/xlsx.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { chromium } from '../../node_modules/@playwright/test/index.mjs';

test('release QA: authenticated module navigation, student CRUD and Excel imports', { timeout: 180000 }, async () => {
  const projectId = 'demo-gbs-school', base = 'http://127.0.0.1:5301';
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Must run inside Firebase emulators:exec');
  const env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8080, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
  const email = `admin-${crypto.randomUUID()}@example.invalid`;
  let password = crypto.randomUUID() + '!Aa7';
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-only', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const account = await response.json(); assert.ok(account.localId, 'Emulator account created');
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'schools/auth-school/members', account.localId), {
    active: true, passwordSetupComplete: true, role: 'Super Admin', modules: [...navigationItems.map(item=>item[0]),'AcademicYears','Lifecycle','PhotoImport','LongAbsence','EmergencyContacts','Checkout'], resources: [], classIds: [], studentIds: [],
  }));
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'schools/auth-school/members/staff-member'), {
    active: true, passwordSetupComplete: true, role: 'Teacher', modules: [], resources: [], classIds: [], studentIds: [],
  }));
  await assertFails(updateDoc(doc(env.authenticatedContext('staff-member').firestore(), 'schools/auth-school/members/staff-member'), { role: 'Super Admin' }));
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5301', '--strictPort'], {
    cwd: new URL('../../', import.meta.url), stdio: 'ignore', windowsHide: true,
    env: { ...process.env, VITE_SCHOOL_DATA_MODE: 'firebase', VITE_SCHOOL_ID: 'auth-school', VITE_FIREBASE_PROJECT_ID: projectId,
      VITE_FIREBASE_API_KEY: 'emulator-only', VITE_FIREBASE_APP_ID: 'emulator-web', VITE_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`, VITE_FIREBASE_EMULATORS: 'true' },
  });
  let browser;
  try {
    for (let attempt = 0; attempt < 60; attempt++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 500)); }
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage(); page.setDefaultTimeout(15000); await page.goto(base);

    await page.getByRole('button',{name:'EN',exact:true}).click();
    await page.getByLabel('Email',{exact:true}).fill(email);
    await page.getByLabel('Password',{exact:true}).fill(password);
    await page.getByRole('button',{name:'Login',exact:true}).click();
    await page.locator('.portal-shell').waitFor();


    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const {nav}=await import('../../tests/portal-navigation.mjs');
    const routes=[];
    for(const [key] of navigationItems){
      await nav(page,key);
      await page.waitForTimeout(100);
      const text=await page.locator('main').innerText();
      assert.ok(text.length>20,key+' renders content');
      assert.doesNotMatch(text,/This page encountered an error/i,key);
      routes.push({module:key,rendered:true,notes:text.match(/[^.\n]*(?:not connected|not configured|placeholder|requires|preview only)[^.\n]*/gi)||[]});
    }
    await nav(page,'Students');
    await page.getByRole('button',{name:'Add student',exact:true}).click();
    for(const [name,value]of Object.entries({name:'Release QA Student',grNo:'QA-NEW',className:'8',division:'A',academicYear:'2026-27',fatherMobile:'9000000101'}))await page.locator('input[name="'+name+'"]').fill(value);
    await page.getByRole('button',{name:'Save Student',exact:true}).click();
    let student=await page.evaluate(()=>JSON.parse(localStorage.getItem('erp_pro_students')).find(s=>s.grNo==='QA-NEW'));assert.ok(student);
    const row=page.locator('tr[data-student-id="'+student.id+'"]');
    await row.getByRole('button',{name:'Edit',exact:true}).click();
    await page.locator('input[name="fatherMobile"]').fill('9000000102');
    await page.getByRole('button',{name:'Save Student',exact:true}).click();
    assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('erp_pro_students')).find(s=>s.id===id).fatherMobile,student.id),'9000000102');
    page.once('dialog',d=>d.accept());await row.getByRole('button',{name:'Archive student',exact:true}).click();
    assert.ok(await page.evaluate(id=>JSON.parse(localStorage.getItem('erp_pro_students')).find(s=>s.id===id).archivedAt,student.id));
    await page.getByLabel('Show inactive / archived students').check();
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Restore student',exact:true}).click();
    assert.ok(!await page.evaluate(id=>JSON.parse(localStorage.getItem('erp_pro_students')).find(s=>s.id===id).archivedAt,student.id));
    const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download Excel Template',exact:true}).click();assert.ok((await readFile(await(await download).path())).length>100);
    for(const format of ['xlsx','xls','csv']){
      await nav(page,'Students');await page.getByRole('button',{name:'Import Excel',exact:true}).click();
      const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{'Student Name':'Import '+format,'GR Number':'QA-'+format,'Class':'8','Division':'A','Academic Year':'2026-27','Father Mobile':'9000000101'}]),'Students');
      const buffer=format==='csv'?Buffer.from(XLSX.utils.sheet_to_csv(wb.Sheets.Students)):Buffer.from(XLSX.write(wb,{type:'buffer',bookType:format==='xls'?'biff8':'xlsx'}));
      await page.getByLabel('Upload Excel',{exact:true}).setInputFiles({name:'qa.'+format,mimeType:'application/octet-stream',buffer});
      await page.getByRole('button',{name:'Validate',exact:true}).click();
      await page.getByLabel('I reviewed all rows and before/after changes. Save only the selected actions.').check();
      await page.getByRole('button',{name:'Confirm Import',exact:true}).click();
      assert.ok(await page.evaluate(gr=>JSON.parse(localStorage.getItem('erp_pro_students')).some(s=>s.grNo===gr),'QA-'+format));
    }
    await page.setViewportSize({width:390,height:844});
    for(const key of ['Dashboard','Students','Attendance','Homework','Library','Fees','Results','IDCard','Certificates','Backup']){await nav(page,key);assert.ok(await page.locator('main').isVisible());}
    assert.deepEqual(errors,[]);
    await writeFile(new URL('../../../docs/RELEASE_QA_MODULE_RENDER_RESULTS.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),scope:'Isolated emulator login; page rendering is not full business-flow verification',routes,checks:['Student add/edit/archive/restore','Excel template download','xlsx/xls/csv imports','Mobile module rendering'],pageErrors:errors},null,2));
  }finally{await browser?.close();server.kill();await env.cleanup();}
});
