import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,updateDoc,deleteDoc,collection,getDocs} from 'firebase/firestore';
import * as firestoreSdk from 'firebase/firestore';
import {createFirebaseRepository} from '../../src/backend/firebaseRepository.js';

test('activation candidate preserves legacy access while protecting tenant memberships and records',async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-gbs-school',firestore:{host:'127.0.0.1',port:8080,rules:await readFile(new URL('../firestore.activation.rules',import.meta.url),'utf8')}});
 try{
  await env.clearFirestore();
  const root='schools/gbs-school';
  const resources=['students','teachers','attendance','settings','certificates','results'];
  await env.withSecurityRulesDisabled(async ctx=>{
   for(const [uid,role] of [['activation-admin','SUPER_ADMIN'],['activation-teacher','Teacher']])
    await setDoc(doc(ctx.firestore(),`${root}/members/${uid}`),{role,active:true,passwordSetupComplete:true,modules:['Students','Settings'],resources,classIds:['8:A'],studentIds:[]});
  });
  const admin=env.authenticatedContext('activation-admin').firestore();
  const teacher=env.authenticatedContext('activation-teacher').firestore();
  const outsider=env.authenticatedContext('activation-outsider').firestore();
  const anonymous=env.unauthenticatedContext().firestore();
  for(const legacy of ['students','teachers','attendance','notices','settings','templates','documents','fees']){
   const path=`${legacy}/activation-fixture`;
   await assertSucceeds(setDoc(doc(teacher,path),{retained:true}));
   await assertSucceeds(getDoc(doc(admin,path)));
   await assertSucceeds(updateDoc(doc(teacher,path),{retained:false}));
   await assertFails(getDoc(doc(anonymous,path)));
   await assertSucceeds(deleteDoc(doc(teacher,path)));
  }
  await assertSucceeds(setDoc(doc(teacher,'documents/fixture/files/nested'),{retained:true}));
  await assertFails(setDoc(doc(outsider,`${root}/members/activation-outsider`),{role:'SUPER_ADMIN',active:true}));
  await assertFails(updateDoc(doc(teacher,`${root}/members/activation-admin`),{active:false}));
  await assertFails(updateDoc(doc(teacher,`${root}/members/activation-teacher`),{role:'SUPER_ADMIN'}));
  await assertFails(setDoc(doc(outsider,`${root}/members/activation-admin/nested/override`),{role:'SUPER_ADMIN'}));
  await assertFails(getDocs(collection(teacher,`${root}/members`)));
  await assertSucceeds(getDoc(doc(admin,`${root}/members/activation-admin`)));
  await assertSucceeds(updateDoc(doc(admin,`${root}/members/activation-teacher`),{modules:['Students'],resources:['students']}));
  const repo=createFirebaseRepository({db:admin,auth:{currentUser:{uid:'activation-admin'}},schoolId:'gbs-school',firestoreSdk});
  assert.equal((await repo.membership()).role,'SUPER_ADMIN');
  const row={collection:'students',id:'activation-student',classId:'8:A',expectedVersion:0,mutationId:crypto.randomUUID(),data:{id:'activation-student',name:'Emulator Student',grNo:'ACT-1',className:'8',division:'A'}};
  await repo.mutate(row);
  assert.equal((await repo.list('students')).length,1);
  await repo.mutate({...row,expectedVersion:1,mutationId:crypto.randomUUID(),data:{...row.data,name:'Updated'}});
  await repo.mutate({...row,expectedVersion:2,mutationId:crypto.randomUUID(),deleted:true});
  assert.equal((await repo.list('students')).length,0);
  await assertFails(getDoc(doc(outsider,`${root}/students/activation-student`)));
  await assertFails(setDoc(doc(teacher,`${root}/settings/security`),{role:'SUPER_ADMIN'}));
 }finally{await env.cleanup();}
});
