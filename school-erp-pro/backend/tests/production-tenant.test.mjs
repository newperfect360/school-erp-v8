import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,updateDoc} from 'firebase/firestore';
import * as firestoreSdk from 'firebase/firestore';
import {createFirebaseRepository} from '../../src/backend/firebaseRepository.js';
import {spawn} from 'node:child_process';
import {chromium} from '../../node_modules/@playwright/test/index.mjs';

test('production tenant rules and deployed function handler: valid school, verified auth, cross-tenant denial',{skip:process.env.PERFECTEDU_TENANT_TEST!=='true',timeout:180000},async()=>{
 assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
 const env=await initializeTestEnvironment({projectId:'demo-gbs-school',firestore:{host:'127.0.0.1',port:8080,rules:await readFile(new URL('../firestore.production.rules',import.meta.url),'utf8')}});
 try{
  await env.clearFirestore();
  const password=crypto.randomUUID()+'!Aa8';
  const auth=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`test-${crypto.randomUUID()}@example.invalid`,password,returnSecureToken:true})}).then(r=>r.json());
  assert.ok(auth.idToken);
  const resources=['students','teachers','attendance','fees','results','settings','notifications','library','sports','trips','certificates'];
  await env.withSecurityRulesDisabled(async ctx=>{
   for(const [id,udise]of [['gbs-school','27190113523'],['other-school','11111111111']])await setDoc(doc(ctx.firestore(),'schools',id),{tenantId:id,status:'ACTIVE',udise,schoolName:'TEST '+id});
   for(const [school,uid,role]of [['gbs-school',auth.localId,'SUPER_ADMIN'],['other-school','other-admin','SCHOOL_SUPER_ADMIN'],['gbs-school','teacher','Teacher']])await setDoc(doc(ctx.firestore(),`schools/${school}/members/${uid}`),{active:true,passwordSetupComplete:true,role,modules:['Students'],resources,classIds:['8:A'],studentIds:[]});
   await setDoc(doc(ctx.firestore(),'students/legacy-test'),{name:'TEST LEGACY'});
  });
  const admin=env.authenticatedContext(auth.localId).firestore(),other=env.authenticatedContext('other-admin').firestore(),teacher=env.authenticatedContext('teacher').firestore(),anonymous=env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(admin,'students/legacy-test')));
  for(const client of [other,teacher,anonymous])await assertFails(getDoc(doc(client,'students/legacy-test')));
  await assertFails(updateDoc(doc(teacher,`schools/gbs-school/members/${auth.localId}`),{role:'Teacher'}));
  await assertFails(updateDoc(doc(teacher,'schools/gbs-school/members/teacher'),{role:'SUPER_ADMIN'}));
  for(const name of resources){await assertFails(getDoc(doc(other,`schools/gbs-school/${name}/test`)));await assertFails(setDoc(doc(other,`schools/gbs-school/${name}/test`),{value:'attack'}));}
  const repo=createFirebaseRepository({db:admin,auth:{currentUser:{uid:auth.localId}},schoolId:'gbs-school',firestoreSdk});await repo.membership();
  const data={id:'TEST-STUDENT',name:'TEST Student',grNo:'TEST-GR',className:'8',division:'A'};
  await repo.mutate({collection:'students',id:data.id,classId:'8:A',expectedVersion:0,mutationId:crypto.randomUUID(),data});
  assert.equal((await repo.read('students',data.id)).data.name,'TEST Student');
  await repo.mutate({collection:'students',id:data.id,classId:'8:A',expectedVersion:1,mutationId:crypto.randomUUID(),data:{...data,name:'TEST Edited'}});
  const call=async(body,token)=>{const r=await fetch('http://127.0.0.1:5001/demo-gbs-school/asia-south1/perfectEduAuth',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
  const school=await call({action:'school',udise:'27190113523'});assert.equal(school.status,200);assert.equal(school.data.school.id,'gbs-school');
  assert.equal((await call({action:'session',udise:'27190113523'},auth.idToken)).status,200);
  assert.equal((await call({action:'session',udise:'11111111111'},auth.idToken)).status,403);
  assert.equal((await call({action:'session',udise:'27190113523'})).status,401);
  const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5298','--strictPort'],{cwd:new URL('../../',import.meta.url),stdio:'ignore',windowsHide:true,env:{...process.env,DEV_ADMIN_LOGIN:'false',VITE_SCHOOL_DATA_MODE:'firebase',VITE_SCHOOL_ID:'gbs-school',VITE_FIREBASE_PROJECT_ID:'demo-gbs-school',VITE_FIREBASE_API_KEY:'emulator-only',VITE_FIREBASE_APP_ID:'emulator-web',VITE_FIREBASE_AUTH_DOMAIN:'demo-gbs-school.firebaseapp.com',VITE_FIREBASE_EMULATORS:'true',VITE_TENANT_AUTH_URL:'http://127.0.0.1:5001/demo-gbs-school/asia-south1/perfectEduAuth'}});
  let browser;
  try{
   for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:5298/login')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
   browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();await page.goto('http://127.0.0.1:5298/login');
   await page.getByLabel('School UDISE Code',{exact:true}).fill('27190113523');await page.getByLabel('Email',{exact:true}).fill(auth.email);
   await page.locator('.perfectedu-school-preview').waitFor();assert.match(await page.locator('.perfectedu-school-preview').innerText(),/TEST gbs-school/);
   await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Login',exact:true}).click();await page.locator('.portal-shell').waitFor({timeout:30000});
   assert.match(await page.locator('.perfectedu-tenant-banner').innerText(),/27190113523/);
   assert.ok(!(await page.locator('body').innerText()).includes('School sign-in configuration is required'));
   await page.reload();try{await page.locator('.portal-shell').waitFor({timeout:10000});}catch(error){console.log('Reload state:',await page.locator('body').innerText());console.log('Selected school:',await page.evaluate(()=>sessionStorage.getItem('perfectedu_selected_udise')));throw error;}
  }finally{if(browser)await browser.close();server.kill();}
  await env.withSecurityRulesDisabled(ctx=>updateDoc(doc(ctx.firestore(),'schools/gbs-school'),{status:'SUSPENDED'}));
  await assertFails(getDoc(doc(admin,'schools/gbs-school/students/TEST-STUDENT')));
  assert.equal((await call({action:'school',udise:'27190113523'})).status,403);
 }finally{await env.cleanup();}
});
