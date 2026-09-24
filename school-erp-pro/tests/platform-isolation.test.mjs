import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPlatformStore} from '../dev-server/platform-store.mjs';
import {studentReference,resolveReference} from '../src/services/studentReference.js';

test('student QR is tenant-bound and legacy GBS QR cannot select another school',()=>{
 const rows=[{id:'same-id',grNo:'1'}];
 assert.equal(resolveReference(studentReference('same-id','school-a'),rows,'school-b'),null);
 assert.equal(resolveReference(studentReference('same-id','school-a'),rows,'school-a').id,'same-id');
 assert.equal(resolveReference(studentReference('same-id'),rows,'school-b'),null);
 assert.equal(resolveReference(studentReference('same-id'),rows,'gbs-school').id,'same-id');
});

test('tenant isolation: every register, independent school admins, suspended sessions, permissions and branding',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'perfectedu-isolation-'));
 try{
  const api=createPlatformStore(join(dir,'school.json'));
  const platform=await api('platform-login',{username:'admin',password:'admin1234'});
  const schools=[];
  for(const [i,udise] of ['DEMO000001','DEMO000002'].entries()){
   const {school}=await api('platform-save-school',{school:{udise,schoolNameEn:'TEST SCHOOL '+(i?'B':'A'),academicYear:'2026-27',modules:['*']}},platform.token);
   const {user}=await api('platform-save-admin',{schoolId:school.id,user:{username:'admin',email:`admin${i}@example.invalid`,name:'TEST School Admin',active:true},password:'TEST-tenant-'+i+'-password!'},platform.token);
   assert.notEqual(user.uid,'development-admin');
   await api('platform-school-status',{schoolId:school.id,status:'ACTIVE'},platform.token);
   const access=await api('login',{udise,username:'admin',password:'TEST-tenant-'+i+'-password!'});
   schools.push({school,access});
  }
  const [a,b]=schools;
  await assert.rejects(api('login',{udise:b.school.udise,username:'admin',password:'admin1234'}),/own password/);
  await assert.rejects(api('login',{udise:b.school.udise,username:'admin',password:'TEST-tenant-0-password!'}),/Invalid/);
  await assert.rejects(api('platform-schools',{},a.access.token),/Platform/);
  await assert.rejects(api('snapshot',{schoolId:b.school.id},a.access.token),/Cross-school/);
  const keys=['students','teachers','staff','fee_ledger','results','notices','documents','certificates','library_books','sports_equipment','trips','academic_years','absence_communications','audit_logs'];
  for(const {school,access} of schools){
   const entries=Object.fromEntries(keys.map(key=>['erp_pro_'+key,[{id:'same-id',name:school.udise,studentId:'same-id',grNo:'SAME-GR'}]]));
   entries.erp_pro_attendance={'2026-09-23':{'same-id':school.udise}};
   entries.erp_pro_document_templates={custom:school.udise};
   await api('commit',{entries,expected:Object.fromEntries(Object.keys(entries).map(key=>[key,null]))},access.token);
  }
  for(const {school,access} of schools){const result=await api('snapshot',{},access.token);for(const key of keys)assert.equal(result.data['erp_pro_'+key][0].name,school.udise);assert.equal(result.data.erp_pro_attendance['2026-09-23']['same-id'],school.udise);assert.equal(result.data.schoolSettings.tenantId,school.id);assert.equal(result.data.schoolSettings.schoolName,school.schoolNameEn);}
  await assert.rejects(api('commit',{entries:{erp_pro_students:[{id:'bad',schoolId:b.school.id}]},expected:{erp_pro_students:a.access.data.erp_pro_students??null}},a.access.token),/Cross-school record/);
  const created=await api('save-user',{user:{name:'TEST Teacher',username:'teacher',email:'teacher@example.invalid',role:'TEACHER',assignedClass:'8',division:'A',academicYear:'2026-27',modules:['Students','Attendance'],writeModules:['Attendance']},password:'TEST-teacher-password!'},a.access.token);
  assert.ok(created.user.uid);
  const teacher=await api('login',{udise:a.school.udise,username:'teacher',password:'TEST-teacher-password!'});
  await assert.rejects(api('users',{},teacher.token),/Super Admin/);
  await assert.rejects(api('platform-schools',{},teacher.token),/Platform/);
  await api('platform-school-status',{schoolId:a.school.id,status:'SUSPENDED'},platform.token);
  await assert.rejects(api('snapshot',{},a.access.token),/suspended/);
  assert.equal((await api('snapshot',{},b.access.token)).user.schoolId,b.school.id);
  await api('platform-save-school',{school:{...b.school,modules:['Students']}},platform.token);
  const restricted=await api('snapshot',{},b.access.token);
  assert.equal(restricted.data.erp_pro_fee_ledger,undefined);
  await assert.rejects(api('commit',{entries:{erp_pro_fee_ledger:[]},expected:{erp_pro_fee_ledger:null}},b.access.token),/Module disabled/);
  await assert.rejects(api('users',{},b.access.token),/administration is disabled/);
  const registry=JSON.parse(readFileSync(join(dir,'school.json.platform.json'),'utf8'));assert.equal(registry.schools.length,3);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
