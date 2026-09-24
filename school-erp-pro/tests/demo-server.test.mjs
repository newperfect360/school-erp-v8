import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import demoServer,{createDemoStore} from '../dev-server/demo-store.mjs';
import {Readable} from 'node:stream';
test('shared demo: user lifecycle, hashed passwords, scoped permissions, duplicate GR, conflicts and persistence',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'gbs-demo-test-')),file=join(directory,'school.json');
 try{
 const api=createDemoStore(file),owner=await api('login',{username:'dilippawar2207@gmail.com',password:'admin1234'}),token=owner.token;
 await api('commit',{entries:{erp_pro_students:[{id:'test-a',grNo:'TEST-1',name:'TEST विद्यार्थी',className:'8',division:'A',academicYear:'2026-27'},{id:'test-b',grNo:'TEST-2',name:'TEST Other class',className:'9',division:'B',academicYear:'2026-27'}]},expected:{erp_pro_students:null}},token);
 const created=await api('save-user',{user:{name:'TEST Teacher',username:'test-teacher',email:'teacher@example.invalid',role:'TEACHER',active:true,assignedClass:'8',division:'A',academicYear:'2026-27',modules:['Students','Attendance','Communications']},password:'TEST-only-password!42'},token);
 assert.ok(!('hash' in created.user));assert.ok(!readFileSync(file,'utf8').includes('TEST-only-password!42'));
 const teacher=await api('login',{username:'test-teacher',password:'TEST-only-password!42'});assert.equal(teacher.data.erp_pro_students.length,1);
 await assert.rejects(api('users',{},teacher.token),/Super Admin required/);
 await assert.rejects(api('commit',{entries:{schoolSettings:{hacked:true}},expected:{schoolSettings:null}},teacher.token),/Permission denied/);
 await api('commit',{entries:{erp_pro_attendance:{'2026-09-23':{'test-a':'Absent'}}},expected:{erp_pro_attendance:null}},teacher.token);
 const snapshot=await api('snapshot',{},token);assert.equal(snapshot.data.erp_pro_attendance['2026-09-23']['test-a'],'Absent');
 await assert.rejects(api('commit',{entries:{erp_pro_students:[]},expected:{erp_pro_students:null}},token),/changed/);
 await assert.rejects(api('commit',{entries:{erp_pro_students:[...snapshot.data.erp_pro_students,{id:'test-c',grNo:'TEST-1'}]},expected:{erp_pro_students:snapshot.data.erp_pro_students}},token),/Duplicate/);
 await api('save-user',{user:{...created.user,active:false}},token);await assert.rejects(api('snapshot',{},teacher.token),/inactive/);
 const restored=createDemoStore(file),newLogin=await restored('login',{username:'admin',password:'admin1234'});assert.equal(newLogin.data.erp_pro_students.length,2);
 }finally{rmSync(directory,{recursive:true,force:true});}
});
test('HTTP body preserves Marathi characters split across network chunks',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'gbs-demo-unicode-'));
 try{
  let middleware;demoServer({enabled:true,file:join(directory,'school.json')}).configureServer({middlewares:{use:(_,handler)=>{middleware=handler;}}});
  const send=async(path,body,token='')=>{
   const bytes=Buffer.from(JSON.stringify(body));const req=Readable.from(Array.from(bytes,byte=>Buffer.from([byte])));
   req.method='POST';req.url='/'+path;req.headers={authorization:'Bearer '+token};let result;
   await middleware(req,{setHeader(){},end(text){result=JSON.parse(text);}});return result;
  };
  const owner=await send('login',{username:'admin',password:'admin1234'});
  const name='TEST विद्यार्थी शिक्षक उपस्थिती';
  const saved=await send('commit',{entries:{erp_pro_students:[{id:'TEST-UTF8',grNo:'TEST-UTF8',name}]},expected:{erp_pro_students:null}},owner.token);
  assert.equal(saved.data.erp_pro_students[0].name,name);
 }finally{rmSync(directory,{recursive:true,force:true});}
});
