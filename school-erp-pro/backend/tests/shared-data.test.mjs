import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,collection,getDocs,query,where,writeBatch,serverTimestamp,updateDoc,deleteDoc} from 'firebase/firestore';
import * as firestoreSdk from 'firebase/firestore';
import {createFirebaseRepository} from '../../src/backend/firebaseRepository.js';
let env;
const projectId='demo-gbs-school';
const school='school-a';
const grants={passwordSetupComplete:true,resources:['students','parents','teachers','attendance','academic_years','homework','exams','results','fees','library','sports','scholarships','trips','certificates','notifications','communication_logs','settings']};
const student=(id,gr,cls='8:A')=>({collection:'students',id,expectedVersion:0,classId:cls,mutationId:crypto.randomUUID(),data:{id,name:'Test Student',grNo:gr,className:cls.split(':')[0],division:cls.split(':')[1]}});
const repo=uid=>createFirebaseRepository({db:env.authenticatedContext(uid).firestore(),auth:{currentUser:{uid}},schoolId:school,firestoreSdk});
before(async()=>{
 env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8080,rules:await readFile(new URL('../firestore.rules',import.meta.url),'utf8')}});
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();
  for(const [uid,role,classIds] of [['admin','Admin',[]],['teacher','Teacher',['8:A']],['other','Teacher',['9:B']]])await setDoc(doc(db,`schools/${school}/members/${uid}`),{...grants,active:true,role,classIds,studentIds:[]});
  await setDoc(doc(db,'schools/school-b/members/outsider'),{...grants,active:true,role:'Admin',classIds:[],studentIds:[]});
 });
});
after(async()=>{await env?.cleanup()});
test('canonical SUPER_ADMIN is authorized and cannot be edited or forged by clients',async()=>{
 await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),`schools/${school}/members/super`),{...grants,active:true,role:'SUPER_ADMIN',modules:['Students'],classIds:[],studentIds:[]}));
 const superRepo=repo('super');await superRepo.membership();await assertSucceeds(superRepo.list('students'));
 await assertFails(setDoc(doc(env.authenticatedContext('teacher').firestore(),`schools/${school}/members/forged`),{...grants,active:true,role:'SUPER_ADMIN'}));
 await assertFails(setDoc(doc(env.authenticatedContext('admin').firestore(),`schools/${school}/members/super`),{...grants,active:false,role:'Teacher'}));
 await assertFails(getDoc(doc(env.authenticatedContext('outsider').firestore(),'legacy/private-record')));
});
test('same stable student record, version checks, unique GR and idempotent retry',async()=>{
 const web=repo('admin'),android=repo('teacher');await web.membership();await android.membership();
 const add=student('student-1','GR1001');await web.mutate(add);
 let rows=await android.list('students');assert.equal(rows.find(r=>r.id==='student-1').data.grNo,'GR1001');
 const edit={...add,expectedVersion:1,mutationId:crypto.randomUUID(),data:{...add.data,fatherMobile:'9000000001'}};
 await android.mutate(edit);await android.mutate(edit);
 rows=await web.list('students');assert.equal(rows.find(r=>r.id==='student-1').data.fatherMobile,'9000000001');
 await assert.rejects(web.mutate({...edit,mutationId:crypto.randomUUID()}),{code:'sync/conflict'});
 await assert.rejects(web.mutate(student('student-2','GR1001')),/already belongs/);
 await assert.rejects(web.mutate({...edit,expectedVersion:2,data:{...edit.data,grNo:'OTHER'}}),/immutable/);
});
test('atomic imports reject duplicate GR and roll back every row on stale versions',async()=>{
 const web=repo('admin');await web.membership();
 const first=student('batch-first','TEST-BATCH-1'),second=student('batch-second','TEST-BATCH-2');
 await web.mutateMany([first,second]);
 const update={...first,expectedVersion:1,mutationId:crypto.randomUUID(),data:{...first.data,name:'TEST revised'}};
 await web.mutate(update);
 await assert.rejects(web.mutateMany([{...second,expectedVersion:1,mutationId:crypto.randomUUID(),data:{...second.data,name:'Must not save'}},{...update,mutationId:crypto.randomUUID()}]),{code:'sync/conflict'});
 assert.equal((await web.read('students',second.id)).data.name,'Test Student');
 await assert.rejects(web.mutateMany([student('batch-dup-a','TEST-DUP-GR'),student('batch-dup-b','TEST-DUP-GR')]),/Duplicate GR/);
 await assert.rejects(web.read('students','batch-dup-a'),/unavailable/);
});
test('SUPER_ADMIN administrative matrix and Teacher/Staff restrictions',async()=>{
 const modules=['Students','Attendance','Teachers','Settings','Formats','Reports','AccessSetup'];
 await env.withSecurityRulesDisabled(async ctx=>{
  for(const [uid,role] of [['matrix-super','SUPER_ADMIN'],['matrix-teacher','Teacher'],['matrix-staff','Office Staff']])
   await setDoc(doc(ctx.firestore(),`schools/${school}/members/${uid}`),{...grants,active:true,role,modules,classIds:['8:A'],studentIds:[]});
 });
 const adminRepo=repo('matrix-super');assert.equal((await adminRepo.membership()).role,'SUPER_ADMIN');
 const add=student('matrix-student','MATRIX-GR');await adminRepo.mutate(add);
 assert.ok((await adminRepo.list('students')).some(row=>row.id===add.id));
 const edit={...add,expectedVersion:1,mutationId:crypto.randomUUID(),data:{...add.data,name:'Updated Student'}};
 await adminRepo.mutate(edit);
 assert.equal((await adminRepo.list('students')).find(row=>row.id===add.id).data.name,'Updated Student');
 for(const collection of ['teachers','settings','certificates','results','attendance']){
  const data=collection==='attendance'?{studentId:add.id,date:'2026-09-21',academicYear:'2026-27',status:'Present'}:{title:'Administrative test'};
  const mutation={collection,id:'matrix-'+collection,classId:collection==='settings'?'':'8:A',expectedVersion:0,mutationId:crypto.randomUUID(),data};
  await adminRepo.mutate(mutation);
  assert.ok((await adminRepo.list(collection)).some(row=>row.id===mutation.id),collection+' read');
  for(const uid of ['matrix-teacher','matrix-staff']){
   if(collection==='attendance'||collection==='results')continue;
   const staff=repo(uid);await staff.membership();
   await assert.rejects(staff.mutate({...mutation,expectedVersion:1,mutationId:crypto.randomUUID(),data:{...data,title:'Unauthorized'}}),collection+' protected');
  }
 }
 const superDb=env.authenticatedContext('matrix-super').firestore();
 await assertSucceeds(updateDoc(doc(superDb,`schools/${school}/members/matrix-staff`),{modules:['Students'],resources:['students']}));
 for(const uid of ['matrix-teacher','matrix-staff']){
  const db=env.authenticatedContext(uid).firestore();
  await assertFails(updateDoc(doc(db,`schools/${school}/members/matrix-super`),{active:false}));
  await assertFails(updateDoc(doc(db,`schools/${school}/members/${uid}`),{role:'SUPER_ADMIN'}));
 }
 await adminRepo.mutate({...edit,expectedVersion:2,mutationId:crypto.randomUUID(),deleted:true});
 assert.ok(!(await adminRepo.list('students')).some(row=>row.id===add.id),'audited soft deletion');
 await assertFails(deleteDoc(doc(superDb,`schools/${school}/students/${add.id}`)));
 await assertFails(getDoc(doc(superDb,'students/legacy-student')));
});
test('teacher can create own class but cannot access other school or class or assign own role',async()=>{
 const teacher=repo('teacher');await teacher.membership();await teacher.mutate(student('student-3','GR1003'));
 await assert.rejects(teacher.mutate(student('student-4','GR1004','9:B')));
 const outsider=env.authenticatedContext('outsider').firestore(),other=env.authenticatedContext('other').firestore();
 await assertFails(getDoc(doc(outsider,`schools/${school}/students/student-1`)));
 await assertFails(getDoc(doc(other,`schools/${school}/students/student-1`)));
 await assertFails(setDoc(doc(other,`schools/${school}/members/other`),{...grants,active:true,role:'Admin',classIds:[],studentIds:[]}));
 await assertFails(getDocs(collection(other,`schools/${school}/students`)));
 await assertSucceeds(getDocs(query(collection(other,`schools/${school}/students`),where('class_id','==','9:B'))));
});
test('audit is mandatory and attendance cannot spoof student class',async()=>{
 const db=env.authenticatedContext('teacher').firestore();
 await assertFails(setDoc(doc(db,`schools/${school}/homework/no-audit`),{id:'no-audit',class_id:'8:A',version:1,updated_at:serverTimestamp(),updated_by:'teacher',deleted:false,data:{title:'Math'}}));
 const teacher=repo('teacher');await teacher.membership();
 const attendance={collection:'attendance',id:'attendance-1',classId:'8:A',expectedVersion:0,mutationId:crypto.randomUUID(),data:{studentId:'student-1',date:'2026-09-18',academicYear:'2026-2027',status:'Absent'}};
 await teacher.mutate(attendance);
 await assert.rejects(teacher.mutate({...attendance,id:'attendance-2',data:{...attendance.data,studentId:'missing'}}));
 const batch=writeBatch(db);batch.update(doc(db,`schools/${school}/audit_logs/attendance_attendance-1_1`),{actor:'other'});await assertFails(batch.commit());
});
