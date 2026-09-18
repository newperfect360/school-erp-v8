import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,collection,getDocs,query,where,writeBatch,serverTimestamp} from 'firebase/firestore';
import {createFirebaseRepository} from '../../src/backend/firebaseRepository.js';
let env;
const projectId='demo-gbs-school';
const school='school-a';
const student=(id,gr,cls='8:A')=>({collection:'students',id,expectedVersion:0,classId:cls,mutationId:crypto.randomUUID(),data:{id,name:'Test Student',grNo:gr,className:cls.split(':')[0],division:cls.split(':')[1]}});
const repo=uid=>createFirebaseRepository({db:env.authenticatedContext(uid).firestore(),auth:{currentUser:{uid}},schoolId:school});
before(async()=>{
 env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8080,rules:await readFile(new URL('../firestore.rules',import.meta.url),'utf8')}});
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();
  for(const [uid,role,classIds] of [['admin','Admin',[]],['teacher','Teacher',['8:A']],['other','Teacher',['9:B']]])await setDoc(doc(db,`schools/${school}/members/${uid}`),{active:true,role,classIds,studentIds:[]});
  await setDoc(doc(db,'schools/school-b/members/outsider'),{active:true,role:'Admin',classIds:[],studentIds:[]});
 });
});
after(async()=>{await env?.cleanup()});
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
test('teacher can create own class but cannot access other school or class or assign own role',async()=>{
 const teacher=repo('teacher');await teacher.membership();await teacher.mutate(student('student-3','GR1003'));
 await assert.rejects(teacher.mutate(student('student-4','GR1004','9:B')));
 const outsider=env.authenticatedContext('outsider').firestore(),other=env.authenticatedContext('other').firestore();
 await assertFails(getDoc(doc(outsider,`schools/${school}/students/student-1`)));
 await assertFails(getDoc(doc(other,`schools/${school}/students/student-1`)));
 await assertFails(setDoc(doc(other,`schools/${school}/members/other`),{active:true,role:'Admin',classIds:[],studentIds:[]}));
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
