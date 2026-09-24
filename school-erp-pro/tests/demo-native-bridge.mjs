import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5178/login');await page.getByLabel('Username',{exact:true}).fill('dilippawar2207@gmail.com');await page.getByLabel('Password',{exact:true}).fill('admin1234');await page.getByRole('button',{name:'Login',exact:true}).click();await page.locator('.portal-shell').waitFor();
 if(process.argv.includes('--verify')){
  const row=await page.evaluate(async()=>{const {schoolStorage}=await import(performance.getEntriesByType('resource').filter(r=>r.name.includes('/src/backend/demoClient.js')).at(-1).name);return JSON.parse(schoolStorage.getItem('erp_pro_students')||'[]').find(r=>r.id==='TEST-DEMO-WEB');});
  assert.equal(row.name,'TEST Android विद्यार्थी');console.log('Android repository update visible in Web browser: PASS');
  const status=await page.evaluate(async()=>{const {schoolStorage}=await import(performance.getEntriesByType('resource').filter(r=>r.name.includes('/src/backend/demoClient.js')).at(-1).name);return JSON.parse(schoolStorage.getItem('erp_pro_attendance_drafts'))[JSON.stringify(['2026-27','2026-09-24','TEST-DEMO-WEB'])]?.status;});
  assert.equal(status,'Absent');console.log('Android attendance update visible in Web browser: PASS');
 }else{
  await page.evaluate(async()=>{const {schoolStorage,demoCommit}=await import(performance.getEntriesByType('resource').filter(r=>r.name.includes('/src/backend/demoClient.js')).at(-1).name);const rows=JSON.parse(schoolStorage.getItem('erp_pro_students')||'[]');const old=rows.find(r=>r.id==='TEST-DEMO-WEB');if(old&&!old.name.startsWith('TEST '))throw Error('Refuse to touch a real record');const row={id:'TEST-DEMO-WEB',name:'TEST Web विद्यार्थी',grNo:'TEST-DEMO-WEB',className:'8',division:'A',academicYear:'2026-27',fatherMobile:'9000000101'};demoCommit({erp_pro_students:[...rows.filter(r=>r.id!==row.id),row]});});console.log('TEST Web student saved for native verification');
  await page.evaluate(async()=>{
   const {schoolStorage,demoCommit}=await import(performance.getEntriesByType('resource').filter(r=>r.name.includes('/src/backend/demoClient.js')).at(-1).name);
   const read=(key,fallback)=>JSON.parse(schoolStorage.getItem(key)||JSON.stringify(fallback));
   const fees=read('erp_pro_fee_ledger',[]),notices=read('erp_pro_notices',[]),drafts=read('erp_pro_attendance_drafts',{});
   demoCommit({erp_pro_fee_ledger:[...fees.filter(r=>r.id!=='TEST-DEMO-FEE'),{id:'TEST-DEMO-FEE',studentId:'TEST-DEMO-WEB',amount:100,academicYear:'2026-27',receiptNo:'TEST-DEMO-FEE'}],erp_pro_notices:[...notices.filter(r=>r.id!=='TEST-DEMO-NOTICE'),{id:'TEST-DEMO-NOTICE',title:'TEST shared notice',body:'TEST only',academicYear:'2026-27'}],erp_pro_attendance_drafts:{...drafts,[JSON.stringify(['2026-27','2026-09-24','TEST-DEMO-WEB'])]:{status:'Present'}}});
  });
 }
}finally{await browser.close();}
