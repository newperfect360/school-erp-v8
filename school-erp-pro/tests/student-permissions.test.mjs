import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDemoStore} from '../dev-server/demo-store.mjs';

test('server enforces independent student edit/archive/restore grants and blocks deletion',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'perfectedu-permissions-'));
 try{
  const api=createDemoStore(join(dir,'school.json'));
  const admin=await api('login',{username:'admin',password:'admin1234'});
  const original=[{id:'test-1',name:'TEST विद्यार्थी',grNo:'TEST1',status:'Active'}];
  await api('commit',{entries:{erp_pro_students:original},expected:{erp_pro_students:null}},admin.token);
  const {user}=await api('save-user',{user:{name:'TEST Clerk',username:'clerk',email:'clerk@example.invalid',role:'CLERK',modules:['Students'],writeModules:['Students'],studentActions:['edit']},password:'TEST-only-password!'},admin.token);
  const clerk=await api('login',{username:'clerk',password:'TEST-only-password!'});
  const commit=(before,after)=>api('commit',{entries:{erp_pro_students:after},expected:{erp_pro_students:before}},clerk.token);
  const edited=[{...original[0],name:'TEST Edited विद्यार्थी'}];
  await commit(original,edited);
  await assert.rejects(commit(edited,[]),/delete permission/);
  await assert.rejects(commit(edited,null),/delete permission/);
  await assert.rejects(commit(edited,[...edited,{id:'test-2',grNo:'TEST2'}]),/add permission/);
  const archived=[{...edited[0],status:'Archived',archivedAt:'2026-09-23'}];
  await assert.rejects(commit(edited,archived),/archive permission/);
  await api('save-user',{user:{...user,studentActions:['archive']}},admin.token);
  await assert.rejects(commit(edited,[{...archived[0],name:'Smuggled edit'}]),/edit permission/);
  await commit(edited,archived);
  await assert.rejects(commit(archived,edited),/restore permission/);
  await api('save-user',{user:{...user,studentActions:['restore']}},admin.token);
  await commit(archived,edited);
  assert.deepEqual((await api('snapshot',{},admin.token)).data.erp_pro_students,edited);
  await assert.rejects(api('audit',{},clerk.token),/Super Admin/);
  const {audit}=await api('audit',{},admin.token);
  assert.ok(audit.some(entry=>entry.actorUid===user.uid&&entry.changes.some(change=>change.newValue?.[0]?.name==='TEST Edited विद्यार्थी')));
  assert.ok(audit.some(entry=>entry.userChanges.some(change=>change.newValue.studentActions?.includes('restore'))));
  assert.ok(!JSON.stringify(audit).includes('TEST-only-password!'));
  assert.ok(!JSON.stringify(audit).includes('"hash":'));
  assert.ok(!JSON.stringify(audit).includes('"salt":'));
  await api('commit',{entries:{erp_pro_audit_logs:[]},expected:{erp_pro_audit_logs:null}},admin.token);
  assert.ok((await api('audit',{},admin.token)).audit.length>audit.length,'client audit writes cannot erase server history');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
