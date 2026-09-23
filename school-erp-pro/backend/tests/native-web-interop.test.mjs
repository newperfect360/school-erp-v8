import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDocs,collection,getDoc} from 'firebase/firestore';
import {chromium} from '../../node_modules/@playwright/test/index.mjs';
import {nav} from '../../tests/portal-navigation.mjs';

test('Web and native Android repository share students, contacts, staff, fees, notices, results, library, sports and trips', {timeout:900000}, async()=>{
 assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST,'Isolated emulators required');
 const projectId='demo-gbs-school',school='gbs-school',base='http://127.0.0.1:5296';
 const env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8080,rules:await readFile(new URL('../firestore.rules',import.meta.url),'utf8')}});
 await env.clearFirestore(); // Isolated emulator only; remove fixtures from earlier security tests.
 const email=`TEST-${crypto.randomUUID()}@example.invalid`,password=crypto.randomUUID()+'!Aa7';
 const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-only',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
 const account=await response.json();assert.ok(account.localId,'Isolated test account required');
 await env.withSecurityRulesDisabled(async ctx=>{
  await setDoc(doc(ctx.firestore(),`schools/${school}/members/${account.localId}`),{active:true,passwordSetupComplete:true,role:'SUPER_ADMIN',modules:['Dashboard','Teachers','Students','Fees','Results','Staff','Notices','Library','Sports','Trips','Attendance','AcademicYears'],resources:['teachers','students','fees','results','notifications','library','sports','trips','attendance','communication_logs','academic_years'],classIds:[],studentIds:[]});
 });
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5296','--strictPort'],{cwd:new URL('../../',import.meta.url),stdio:'ignore',windowsHide:true,env:{...process.env,DEV_ADMIN_LOGIN:'false',VITE_SCHOOL_DATA_MODE:'firebase',VITE_SCHOOL_ID:school,VITE_FIREBASE_PROJECT_ID:projectId,VITE_FIREBASE_API_KEY:'emulator-only',VITE_FIREBASE_APP_ID:'emulator-web',VITE_FIREBASE_AUTH_DOMAIN:`${projectId}.firebaseapp.com`,VITE_FIREBASE_EMULATORS:'true'}});
 let browser;
 try{
  for(let i=0;i<80;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();await page.goto(base);
  await page.getByRole('button',{name:'EN',exact:true}).click();await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Login',exact:true}).click();await page.locator('.portal-shell').waitFor();
  await page.evaluate(()=>localStorage.setItem('erp_pro_teachers',JSON.stringify([{id:'LOCAL-SENTINEL',name:'Must not upload'}])));
  await nav(page,'Teachers');await page.getByRole('status').filter({hasText:'Loading school records'}).waitFor({state:'hidden'});
  for(const [key,value]of Object.entries({name:'TEST Web Teacher',subject:'Science',mobile:'9000000101'}))await page.locator(`input[name=${key}]`).fill(value);
  await page.getByRole('button',{name:'Save Teacher',exact:true}).click();await page.getByRole('cell',{name:'TEST Web Teacher',exact:true}).waitFor();
  const db=env.authenticatedContext(account.localId).firestore();const snapshot=await getDocs(collection(db,`schools/${school}/teachers`));assert.equal(snapshot.size,1);const id=snapshot.docs[0].id;
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('erp_pro_teachers'))[0].id),'LOCAL-SENTINEL');
  await nav(page,'Students');await page.getByRole('button',{name:'Add student',exact:true}).click();
  for(const [key,value]of Object.entries({name:'TEST Web Student',className:'5',division:'A',grNo:'TEST-SYNC-1',fatherMobile:'9000000101',academicYear:'2026-27'}))await page.locator('input[name='+key+']').fill(value);
  await page.getByRole('button',{name:'Save Student',exact:true}).click();await page.getByRole('button',{name:'Add student',exact:true}).waitFor();await page.getByText('TEST Web Student',{exact:true}).first().waitFor();
  const studentDocs=await getDocs(collection(db,'schools/'+school+'/students'));assert.equal(studentDocs.size,1);const studentId=studentDocs.docs[0].id;
  await nav(page,'Fees');await page.getByLabel('Student',{exact:true}).selectOption(studentId);
  for(const [key,value]of Object.entries({total:'100',paid:'50',receipt:'TEST-SYNC-REC'}))await page.getByLabel(key,{exact:true}).fill(value);
  await page.getByRole('button',{name:'Save Fee Record',exact:true}).click();await page.getByRole('button',{name:'Edit / Void receipt',exact:true}).waitFor();
  await nav(page,'Results');await page.getByLabel('Student',{exact:true}).selectOption(studentId);await page.getByLabel('Subject',{exact:true}).fill('TEST Science');await page.getByLabel('Obtained Marks',{exact:true}).fill('70');await page.getByRole('button',{name:'Save marks',exact:true}).click();await page.getByRole('button',{name:'Edit / Archive marks',exact:true}).waitFor();
  await nav(page,'Staff');const staffPanel=page.locator('.workflow-panel').filter({has:page.getByLabel('Employee ID',{exact:true})});await staffPanel.locator('.form-grid input').nth(0).fill('TEST-STAFF-1');await staffPanel.locator('.form-grid input').nth(1).fill('TEST Web Staff');await staffPanel.getByRole('button').first().click();await page.locator('.record-card').filter({hasText:'TEST Web Staff'}).waitFor();
  await nav(page,'Notices');const noticePanel=page.locator('.workflow-panel').first();await noticePanel.locator('.form-grid input').nth(0).fill('TEST Web Notice');await noticePanel.locator('.form-grid input').nth(1).fill('All parents');await noticePanel.getByRole('button').first().click();await page.locator('.record-card').filter({hasText:'TEST Web Notice'}).waitFor();
  await nav(page,'Library');await page.getByLabel('Book ID / Barcode',{exact:true}).fill('TEST-SYNC-BOOK');await page.getByLabel('Book title',{exact:true}).fill('TEST Web Book');await page.getByRole('button',{name:'Save book',exact:true}).click();await page.getByRole('button',{name:'Edit book',exact:true}).waitFor();
  await nav(page,'Sports');const equipmentPanel=page.locator('section').filter({has:page.getByRole('heading',{name:'Equipment Master',exact:true})});await equipmentPanel.getByLabel('name',{exact:true}).fill('TEST Web Ball');await equipmentPanel.getByLabel('quantity',{exact:true}).fill('3');await page.getByRole('button',{name:'Save equipment',exact:true}).click();await page.getByRole('button',{name:'Edit equipment',exact:true}).waitFor();
  await nav(page,'Trips');for(const [key,value]of Object.entries({name:'TEST Web Trip',destination:'TEST Museum',inCharge:'TEST Teacher'}))await page.getByLabel(key,{exact:true}).fill(value);await page.getByRole('checkbox',{name:/TEST Web Student/}).check();await page.getByRole('button',{name:'Save trip',exact:true}).click();await page.getByRole('button',{name:'Edit trip',exact:true}).waitFor();
  await nav(page,'Attendance');await page.getByLabel('Attendance for TEST Web Student',{exact:true}).selectOption('Absent');await page.getByRole('link',{name:'Call Father',exact:true}).first().waitFor();
  const call=page.getByRole('link',{name:'Call Father',exact:true}).first();assert.equal(await call.getAttribute('href'),'tel:+919000000101');await call.evaluate(el=>el.addEventListener('click',e=>e.preventDefault(),{once:true}));await call.click();await page.getByLabel('Call outcome',{exact:true}).first().selectOption('Parent Contacted');await page.getByLabel('Call follow-up remark',{exact:true}).first().fill('TEST confirmed contact');await page.getByRole('button',{name:'Save call follow-up',exact:true}).first().click();
  await page.waitForFunction(()=>document.body.innerText.includes('Contact Attempted')||document.body.innerText.includes('Parent Contacted'));
  const attendanceRows=await getDocs(collection(db,'schools/'+school+'/attendance'));assert.equal(attendanceRows.docs[0].data().data.status,'Absent');
  await nav(page,'AcademicYears');await page.getByLabel('Academic year name',{exact:true}).fill('2027-28');await page.getByRole('button',{name:'Create Academic Year',exact:true}).click();await page.getByRole('heading',{name:'2027-28',exact:true}).waitFor();
  await nav(page,'Students');await page.getByRole('button',{name:'Import Excel',exact:true}).click();await page.getByLabel('Upload Excel',{exact:true}).setInputFiles({name:'TEST-cloud.csv',mimeType:'text/csv',buffer:Buffer.from('Student Name,GR Number,Class,Division,Academic Year,Father Mobile\nTEST Cloud Import,TEST-IMPORT-CLOUD,5,A,2026-27,9000000102')});await page.getByRole('button',{name:'Validate',exact:true}).click();await page.getByLabel('I reviewed all rows and before/after changes. Save only the selected actions.').check();await page.getByRole('button',{name:'Confirm Import',exact:true}).click();await page.getByText('TEST Cloud Import',{exact:true}).first().waitFor();
  const exit=await new Promise((resolve,reject)=>{
   const child=spawn('cmd.exe',['/d','/s','/c','gradlew.bat :app:testDebugUnitTest --tests com.gbsschool.app.NativeRepositoryInteropTest'],{cwd:new URL('../../../android-app/GBSSCHOOL/',import.meta.url),windowsHide:true,env:{...process.env,SCHOOL_NATIVE_INTEROP:projectId,SCHOOL_TEST_EMAIL:email,SCHOOL_TEST_PASSWORD:password,SCHOOL_TEST_TEACHER_ID:id,SCHOOL_TEST_STUDENT_ID:studentId},stdio:['ignore','pipe','pipe']});
   child.stdout.on('data',chunk=>process.stdout.write(chunk));child.stderr.on('data',chunk=>process.stderr.write(chunk));child.on('error',reject);child.on('close',resolve);
  });assert.equal(exit,0,'Native Android repository interoperability test');
  await nav(page,'Attendance');await page.getByLabel('Attendance for TEST Web Student',{exact:true}).waitFor();assert.equal(await page.getByLabel('Attendance for TEST Web Student',{exact:true}).inputValue(),'Present');
  await nav(page,'Teachers');await page.getByRole('cell',{name:'TEST Android Updated',exact:true}).waitFor();await page.getByRole('cell',{name:'TEST Native Created',exact:true}).waitFor();await page.getByRole('cell',{name:'TEST Native UI Teacher',exact:true}).waitFor();
  const row=page.locator('tr').filter({has:page.getByRole('cell',{name:'TEST Android Updated',exact:true})});await row.getByRole('button',{name:'Edit',exact:true}).click();await page.locator('input[name=subject]').fill('TEST Web Revised');await page.getByRole('button',{name:'Save Teacher',exact:true}).click();await page.getByRole('cell',{name:'TEST Web Revised',exact:true}).waitFor();
  assert.equal((await getDoc(doc(db,`schools/${school}/teachers/${id}`))).data().data.subject,'TEST Web Revised');
  page.once('dialog',d=>d.accept());await row.getByRole('button',{name:'Delete',exact:true}).click();await page.getByRole('cell',{name:'TEST Android Updated',exact:true}).waitFor({state:'hidden'});assert.equal((await getDoc(doc(db,`schools/${school}/teachers/${id}`))).data().deleted,true);
  const synced=await getDoc(doc(db,'schools/'+school+'/students/'+studentId));assert.equal(synced.data().data.fatherMobile,'9000000199');
  assert.ok((await getDocs(collection(db,'schools/'+school+'/fees'))).docs.some(d=>d.data().data.paid===60));
  assert.ok((await getDocs(collection(db,'schools/'+school+'/results'))).docs.some(d=>d.data().data.obtainedMarks===85));
  await nav(page,'Students');await page.getByText('TEST Web Student',{exact:true}).first().waitFor();assert.ok((await page.locator('main').innerText()).includes('9000000199'));
  const studentRow=page.locator('tr[data-student-id="'+studentId+'"]');await studentRow.getByRole('button',{name:'Change Division',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel('New division',{exact:true}).fill('B');await dialog.getByLabel('Reason for change').fill('TEST reviewed cloud transfer');await dialog.getByRole('button',{name:'Preview change',exact:true}).click();await dialog.getByLabel('I reviewed this student and the proposed change.').check();await dialog.getByRole('button',{name:'Confirm student change',exact:true}).click();await dialog.waitFor({state:'hidden'});const moved=(await getDoc(doc(db,'schools/'+school+'/students/'+studentId))).data();assert.equal(moved.data.division,'B');assert.ok(moved.data.enrollmentHistory.length);assert.ok(moved.data.movements.length);
  await nav(page,'AcademicYears');await page.getByText('Closed',{exact:true}).filter({visible:true}).waitFor();
  for(const [module,value]of [['Staff','TEST Native Staff'],['Notices','TEST Native Notice'],['Library','TEST Native library'],['Sports','TEST Native sports'],['Trips','TEST Native trips']]){await nav(page,module);await page.getByText(value,{exact:false}).filter({visible:true}).first().waitFor();}
 }finally{await browser?.close();server.kill();await env.cleanup();}
});
