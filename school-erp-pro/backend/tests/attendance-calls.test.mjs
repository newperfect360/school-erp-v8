import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { chromium } from '../../node_modules/@playwright/test/index.mjs';

test('attendance parent calling and saved follow-up use the correct student', { timeout: 180000 }, async () => {
  const projectId = 'demo-gbs-school', base = 'http://127.0.0.1:5298';
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Must run inside Firebase emulators:exec');
  const env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8080, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
  const email = `admin-${crypto.randomUUID()}@example.invalid`;
  let password = crypto.randomUUID() + '!Aa7';
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-only', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const account = await response.json(); assert.ok(account.localId, 'Emulator account created');
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'schools/auth-school/members', account.localId), {
    active: true, passwordSetupComplete: true, role: 'Super Admin', modules: ['Dashboard','Attendance','Students','EmergencyContacts','LongAbsence','Trips'], resources: [], classIds: [], studentIds: [],
  }));
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'schools/auth-school/members/staff-member'), {
    active: true, passwordSetupComplete: true, role: 'Teacher', modules: [], resources: [], classIds: [], studentIds: [],
  }));
  await assertFails(updateDoc(doc(env.authenticatedContext('staff-member').firestore(), 'schools/auth-school/members/staff-member'), { role: 'Super Admin' }));
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5298', '--strictPort'], {
    cwd: new URL('../../', import.meta.url), stdio: 'ignore', windowsHide: true,
    env: { ...process.env, VITE_SCHOOL_DATA_MODE: 'firebase', VITE_SCHOOL_ID: 'auth-school', VITE_FIREBASE_PROJECT_ID: projectId,
      VITE_FIREBASE_API_KEY: 'emulator-only', VITE_FIREBASE_APP_ID: 'emulator-web', VITE_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`, VITE_FIREBASE_EMULATORS: 'true' },
  });
  let browser;
  try {
    for (let attempt = 0; attempt < 60; attempt++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 500)); }
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage(); await page.goto(base);

    await page.getByRole('button',{name:'EN',exact:true}).click();
    await page.getByLabel('Email',{exact:true}).fill(email);
    await page.getByLabel('Password',{exact:true}).fill(password);
    await page.getByRole('button',{name:'Login',exact:true}).click();
    await page.locator('.portal-shell').waitFor();
    await page.evaluate(() => {
      const common={name:'Contact Test',className:'8',division:'A',academicYear:'2026-27',status:'Active',fatherName:'Father',motherName:'Mother',emergencyName:'Emergency'};
      localStorage.setItem('erp_pro_students',JSON.stringify([
        {...common,id:'contact-one',grNo:'CONTACT-1',rollNo:'1',fatherMobile:'9000000101',motherMobile:'9000000102',emergencyContact:'9000000103'},
        {...common,id:'contact-two',grNo:'CONTACT-2',rollNo:'2',fatherMobile:'9000000201',motherMobile:'9000000202',emergencyContact:'9000000203'}
      ]));
      localStorage.setItem('erp_pro_absence_settings',JSON.stringify({autoPrepare:false,language:'en',primaryContact:'mother'}));
      localStorage.setItem('erp_pro_message_settings',JSON.stringify({channels:[{id:'call',enabled:false},{id:'whatsapp',enabled:false},{id:'sms',enabled:false}]}));
      document.addEventListener('click',event=>{if(event.target.closest('a[href^="tel:"]'))event.preventDefault()},true);
    });
    const {nav}=await import('../../tests/portal-navigation.mjs');
    await nav(page,'Attendance');
    const row=page.locator('tr[data-student-id="contact-one"]');
    await row.getByRole('button',{name:'Absent',exact:false}).click();
    const card=row.locator('.family-contact-card');
    await card.getByRole('link',{name:'Call Father',exact:true}).waitFor();
    assert.equal(await card.locator('.family-person').first().getAttribute('class'),'family-person mother');
    for(const [label,number] of [['Father','+919000000101'],['Mother','+919000000102'],['Emergency','+919000000103']]){
      const link=card.getByRole('link',{name:'Call '+label,exact:true});
      assert.equal(await link.getAttribute('href'),'tel:'+number);
      await link.click();
    }
    await card.getByLabel('Call outcome',{exact:true}).selectOption('Medical Reason');
    await card.getByLabel('Call follow-up remark',{exact:true}).fill('Parent confirmed medical leave');
    await card.getByRole('button',{name:'Save call follow-up',exact:true}).click();
    assert.equal(await card.getByLabel('Contact status for Contact Test').inputValue(),'Reason Confirmed');
    await card.getByRole('button',{name:'Contact History',exact:true}).click();
    await card.getByText('Medical Reason Parent confirmed medical leave',{exact:false}).waitFor();
    const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('erp_pro_absence_communications')));
    assert.deepEqual(records.filter(x=>x.channel==='call').map(x=>[x.studentId,x.contactType,x.parentMobile]),[
      ['contact-one','father','+919000000101'],['contact-one','mother','+919000000102'],['contact-one','emergency','+919000000103']
    ]);
    assert.ok(records.every(x=>x.initiatedBy===account.localId));
    // Follow-up must remain available for saved calls, including after navigation.
    await card.getByRole('button',{name:'Record follow-up for Mother',exact:true}).click();
    await card.getByLabel('Call outcome',{exact:true}).selectOption('Busy');
    await card.getByLabel('Call follow-up remark',{exact:true}).fill('Try again later');
    await card.getByRole('button',{name:'Save call follow-up',exact:true}).click();
    assert.equal(await card.getByLabel('Contact status for Contact Test').inputValue(),'No Response');
    const quickCall=row.getByRole('link',{name:'Call Parent',exact:true});
    assert.equal(await quickCall.getAttribute('href'),'tel:+919000000102');
    await quickCall.click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('erp_pro_absence_communications')).filter(r=>r.channel==='call').length),4);
    await page.setViewportSize({width:390,height:844});
    const mother=card.getByRole('link',{name:'Call Mother',exact:true});
    assert.ok((await mother.boundingBox()).height>=44);
    const other=page.locator('tr[data-student-id="contact-two"]');
    await other.getByRole('button',{name:'Absent',exact:false}).click();
    const otherCard=other.locator('.family-contact-card');
    assert.equal(await otherCard.getByRole('link',{name:'Call Father',exact:true}).getAttribute('href'),'tel:+919000000201');
    await otherCard.getByRole('button',{name:'Contact History',exact:true}).click();
    await otherCard.getByText('No contact attempts yet.').waitFor();
    await nav(page,'Students');
    await page.locator('tr').filter({hasText:'CONTACT-1'}).getByRole('button',{name:'View profile CONTACT-1',exact:true}).click();
    await page.locator('.family-contact-card').getByRole('button',{name:'Contact History',exact:true}).click();
    await page.getByText('Medical Reason Parent confirmed medical leave',{exact:false}).waitFor();
  } finally { await browser?.close(); server.kill(); await env.cleanup(); }
});
