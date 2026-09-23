import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { chromium } from '../../node_modules/@playwright/test/index.mjs';

test('development attendance draft, final submit, permission and staff dry-run workflows', { timeout: 180000 }, async () => {
  const projectId = 'demo-gbs-school', base = 'http://127.0.0.1:5299';
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Must run inside Firebase emulators:exec');
  const env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8080, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
  const email = `admin-${crypto.randomUUID()}@example.invalid`;
  let password = crypto.randomUUID() + '!Aa7';
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-only', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const account = await response.json(); assert.ok(account.localId, 'Emulator account created');
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'schools/auth-school/members', account.localId), {
    active: true, passwordSetupComplete: true, role: 'Super Admin', modules: ['Dashboard','Attendance','Students','EmergencyContacts','LongAbsence','Trips','Automation','Checkout','Staff','Settings'], resources: [], classIds: [], studentIds: [],
  }));
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'schools/auth-school/members/staff-member'), {
    active: true, passwordSetupComplete: true, role: 'Teacher', modules: [], resources: [], classIds: [], studentIds: [],
  }));
  await assertFails(updateDoc(doc(env.authenticatedContext('staff-member').firestore(), 'schools/auth-school/members/staff-member'), { role: 'Super Admin' }));
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5299', '--strictPort'], {
    cwd: new URL('../../', import.meta.url), stdio: 'ignore', windowsHide: true,
    env: { ...process.env, DEV_ADMIN_LOGIN: 'true', VITE_SCHOOL_DATA_MODE: 'firebase', VITE_SCHOOL_ID: 'auth-school', VITE_FIREBASE_PROJECT_ID: projectId,
      VITE_FIREBASE_API_KEY: 'emulator-only', VITE_FIREBASE_APP_ID: 'emulator-web', VITE_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`, VITE_FIREBASE_EMULATORS: 'true' },
  });
  let browser;
  try {
    for (let attempt = 0; attempt < 60; attempt++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 500)); }
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage(); page.setDefaultTimeout(15000); await page.goto(base);

    await page.getByRole('button',{name:'EN',exact:true}).click();
    await page.getByLabel('Username',{exact:true}).fill('admin');
    await page.getByLabel('Password',{exact:true}).fill('admin1234');
    await page.getByRole('button',{name:'Login',exact:true}).click();
    await page.locator('.portal-shell').waitFor();

    await page.evaluate(async () => {
      const {mergedAutomation,classKey,automationTemplates}=await import('/src/services/attendanceAutomation.js');
      localStorage.setItem('erp_pro_academic_context',JSON.stringify({current:'2026-27'}));
      localStorage.setItem('erp_pro_students',JSON.stringify([
        {id:'trial-one',name:'Trial One',academicYear:'2026-27',className:'8',division:'A',grNo:'T-1',status:'Active',fatherMobile:'9000000101',notificationLanguage:'both'},
        {id:'trial-two',name:'Trial Two',academicYear:'2026-27',className:'8',division:'A',grNo:'T-2',status:'Active',motherMobile:'9000000102'},
        {id:'outside',name:'Outside Trial',academicYear:'2026-27',className:'9',division:'B',grNo:'T-3',status:'Active',fatherMobile:'9000000201'}
      ]));
      localStorage.setItem('erp_pro_teachers',JSON.stringify([{id:'t1',name:'Trial Teacher',designation:'Teacher'}]));
      localStorage.setItem('erp_pro_attendance_automation',JSON.stringify(mergedAutomation({enabledClasses:[classKey('2026-27','8','A')],enabledEvents:Object.keys(automationTemplates),managementRecipients:[{id:'hm',name:'Headmaster',mobile:'9000000301',enabled:true,absence:true,late:true,summary:true,channel:'sms'}]})));
    });
    const {nav}=await import('../../tests/portal-navigation.mjs');
    await nav(page,'Attendance');
    await page.getByLabel('Attendance academic year').selectOption('2026-27');
    await page.getByLabel('Attendance date',{exact:true}).fill('2026-09-18');
    await page.getByLabel('Attendance class',{exact:true}).selectOption('8');
    await page.getByLabel('Attendance division',{exact:true}).selectOption('A');
    const one=page.locator('tr[data-student-id="trial-one"]'),two=page.locator('tr[data-student-id="trial-two"]');
    await one.getByRole('button',{name:'Absent',exact:false}).click();
    await two.getByRole('button',{name:'Late',exact:false}).click();
    await two.getByLabel('Arrival time for Trial Two').fill('08:20');
    await two.getByLabel('Attendance reason for Trial Two').fill('Bus delayed');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('erp_pro_message_jobs')||'[]').length),0);
    await page.getByRole('button',{name:'Review attendance',exact:true}).click();
    await page.getByRole('button',{name:'Final Submit attendance',exact:true}).click();
    await page.getByText('Attendance submitted. 2 dry-run message jobs prepared.',{exact:true}).waitFor();
    const snapshot=await page.evaluate(()=>({attendance:JSON.parse(localStorage.getItem('erp_pro_attendance')),jobs:JSON.parse(localStorage.getItem('erp_pro_message_jobs'))}));
    assert.equal(snapshot.attendance['2026-09-18']['trial-one'],'Absent');assert.equal(snapshot.attendance['2026-09-18']['trial-two'],'Late');
    assert.ok(snapshot.jobs.every(j=>j.dryRun&&j.status==='Queued'&&j.studentId!=='outside'));
    await page.getByRole('button',{name:'Review attendance',exact:true}).click();
    await page.getByRole('button',{name:'Final Submit attendance',exact:true}).click();
    await page.getByText('Already submitted; no duplicate jobs created.',{exact:true}).waitFor();
    await nav(page,'Automation');
    await page.getByText('DRY RUN ON', {exact:false}).first().waitFor();
    await page.getByLabel('Template name',{exact:true}).selectOption('Absent');
    await page.getByLabel('Student for preview').selectOption('trial-one');
    await page.getByRole('button',{name:'Preview Marathi + English',exact:true}).click();
    assert.match(await page.locator('.message-preview').first().innerText(),/Dear Parent/);
    assert.match(await page.locator('.message-preview').first().innerText(),/[\u0900-\u097f]/);
    await page.getByRole('button',{name:'Save Automation Settings',exact:true}).click();
    await page.getByText('Settings saved. Dry Run ON. No messages sent.',{exact:true}).waitFor();
    await page.setViewportSize({width:390,height:844});
    await nav(page,'Checkout');
    const permission=page.locator('section').filter({has:page.getByRole('heading',{name:'Student Permission / Early Leave Register',exact:true})});
    await permission.getByLabel('Permission student').selectOption('trial-one');
    await permission.getByLabel('Permission status').selectOption('Early Leave');
    await permission.getByLabel('date',{exact:true}).fill('2026-09-18');
    await permission.getByLabel('outTime',{exact:true}).fill('10:15');
    await permission.getByLabel('reason',{exact:true}).fill('Family reason');
    await permission.getByLabel('permissionBy',{exact:true}).fill('Headmaster');
    await permission.getByLabel('Written application received',{exact:true}).check();
    await permission.getByRole('button',{name:'Review permission',exact:true}).click();
    await permission.getByRole('button',{name:'Confirm permission',exact:true}).click();
    await permission.getByText('Permission recorded;', {exact:false}).waitFor();
    await nav(page,'Staff');
    await page.getByLabel('Staff attendance date').fill('2026-09-18');
    await page.getByLabel('Staff status Trial Teacher').selectOption('Absent');
    await page.getByRole('button',{name:'Review staff attendance',exact:true}).click();
    await page.getByRole('button',{name:'Final Submit staff attendance',exact:true}).click();
    await page.getByText('Staff attendance finalized.',{exact:false}).waitFor();
    for(const [date,status] of [['2026-09-17','Late'],['2026-09-16','On Leave'],['2026-09-15','Present']]){
      await page.getByLabel('Staff attendance date').fill(date);
      await page.getByLabel('Staff status Trial Teacher').selectOption(status);
      if(status==='Late')await page.getByLabel('inTime',{exact:true}).fill('08:30');
      await page.getByRole('button',{name:'Review staff attendance',exact:true}).click();
      await page.getByRole('button',{name:'Final Submit staff attendance',exact:true}).click();
      await page.getByText('Staff attendance finalized.',{exact:false}).waitFor();
    }
    const extra=await page.evaluate(async(actor)=>{
      const {draftKey,draftId}=await import('/src/services/attendanceAutomation.js');
      const {reviewAttendance,finalizeAttendance}=await import('/src/services/attendanceAutomationStore.js');
      for(const [date,a,b] of [['2026-09-10','Present','Sick Leave'],['2026-09-11','Absent','Present'],['2026-09-12','Absent','Present'],['2026-09-14','Present','Approved Leave'],['2026-09-15','Permission Leave','Early Leave']]){
        const drafts=JSON.parse(localStorage.getItem(draftKey)||'{}');
        drafts[draftId('2026-27',date,'trial-one')]={status:a,arrivalTime:'10:00',reason:'Approved reason'};
        drafts[draftId('2026-27',date,'trial-two')]={status:b,arrivalTime:'10:00',reason:'Approved reason'};
        localStorage.setItem(draftKey,JSON.stringify(drafts));
        finalizeAttendance(reviewAttendance('2026-27','8','A',date),actor);
      }
      const {queueMessages}=await import('/src/services/messageStore.js');
      queueMessages([{type:'Fee Receipt',studentId:'trial-one',key:'fee:fixture',details:{Date:'2026-09-18',Amount:'100',Receipt:'R-1','Fee Type':'Tuition'}}]);
      localStorage.setItem('erp_pro_fee_ledger',JSON.stringify([{id:'fee-fixture',studentId:'trial-one',type:'Tuition',total:150,paid:100}]));
      return JSON.parse(localStorage.getItem('erp_pro_message_jobs')).map(j=>j.type);
    },account.localId);
    for(const type of ['Present','Approved Leave','Permission Leave','Early Leave','Fee Received'])assert.ok(extra.includes(type),type);
    const checks=await page.evaluate(async()=>{
      const {prepareAutomationDue}=await import('/src/services/attendanceAutomationStore.js');
      const fri=new Date('2026-09-18T13:00:00');prepareAutomationDue(fri);const first=JSON.parse(localStorage.getItem('erp_pro_message_jobs'));prepareAutomationDue(fri);const second=JSON.parse(localStorage.getItem('erp_pro_message_jobs'));
      prepareAutomationDue(new Date('2026-09-12T11:01:00'));
      prepareAutomationDue(new Date('2026-09-19T11:01:00'));
      const config=JSON.parse(localStorage.getItem('erp_pro_attendance_automation'));
      config.overrides['2026-09-17']={...config.weekdays,end:'10:30',reason:'Special timing'};
      config.holidays['2026-09-16']={reason:'Configured school holiday',reopenDate:'2026-09-17'};
      localStorage.setItem('erp_pro_attendance_automation',JSON.stringify(config));
      prepareAutomationDue(new Date('2026-09-17T10:31:00'));prepareAutomationDue(new Date('2026-09-16T13:00:00'));
      prepareAutomationDue(new Date('2026-09-20T13:00:00'));
      const jobs=JSON.parse(localStorage.getItem('erp_pro_message_jobs'));
      const {preparedJobIssue}=await import('/src/services/messageStore.js');
      return {first:first.length,second:second.length,jobs,issue:preparedJobIssue(jobs[0])};
    });
    assert.equal(checks.first,checks.second);
    assert.ok(checks.jobs.some(j=>j.type==='Written Application Leave'));
    assert.ok(checks.jobs.some(j=>j.type==='Staff Absent'));
    assert.ok(checks.jobs.some(j=>j.type==='Staff Daily Summary'));
    assert.ok(checks.jobs.some(j=>j.type==='Fee Due'));
    for(const type of ['Staff Late','Consecutive Absence Alert','Attendance Percentage Warning','Emergency School Closure','Holiday'])assert.ok(checks.jobs.some(j=>j.type===type),type);
    assert.ok(!checks.jobs.some(j=>j.date==='2026-09-16'&&j.type.includes('Closed')));
    assert.ok(checks.jobs.some(j=>j.type==='School Closed'));
    assert.ok(checks.jobs.some(j=>j.type==='Saturday School Closed'));
    assert.ok(!checks.jobs.some(j=>j.date==='2026-09-20'&&j.type.includes('Closed')));
    assert.ok(checks.jobs.every(j=>j.dryRun&&j.status!=='Sent'&&j.status!=='Delivered'));
    assert.match(checks.issue,/Dry-run preview only/);
  } finally { await browser?.close(); server.kill(); await env.cleanup(); }
});
