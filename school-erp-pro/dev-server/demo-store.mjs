import {readFileSync, mkdirSync, writeFileSync, renameSync, existsSync,copyFileSync,openSync,closeSync,unlinkSync,createReadStream,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {randomBytes, randomUUID, scryptSync, timingSafeEqual} from 'node:crypto';
import {checkStudentPermissions, studentActions} from './student-permissions.mjs';

export const roles=['SUPER_ADMIN','ADMIN','HEADMASTER','TEACHER','CLASS_TEACHER','SPORTS_TEACHER','CLERK','ACCOUNTANT','LIBRARIAN','STAFF','VIEW_ONLY'];
export const keyModules={students:'Students',student_movements:'Lifecycle',academic_history:'Lifecycle',teachers:'Teachers',staff:'Staff',attendance:'Attendance',attendance_years:'Attendance',attendance_drafts:'Attendance',attendance_submissions:'Attendance',staff_attendance:'Staff',fee_ledger:'Fees',results:'Results',notices:'Notices',library_books:'Library',library_loans:'Library',sports_equipment:'Sports',sports_athletes:'Sports',equipment_loans:'Sports',trips:'Trips',academic_years:'AcademicYears',academic_context:'AcademicYears',absence_communications:'Communications',permission_register:'Attendance',message_jobs:'Communications',homework:'Homework'};
const hash=password=>{const salt=randomBytes(16).toString('hex');return {salt,hash:scryptSync(password,salt,64).toString('hex')};};
const matches=(password,user)=>!!user?.hash&&timingSafeEqual(Buffer.from(user.hash,'hex'),scryptSync(password,user.salt,64));
const publicUser=({hash:_,salt:__,...user})=>user;
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
function replaceFile(from,to){for(let attempt=0;;attempt++){try{renameSync(from,to);return;}catch(error){if(!['EPERM','EACCES','EBUSY'].includes(error.code)||attempt===9)throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,30);}}}
export function createDemoStore(file,{allowAdminUsername=false}={}){
  mkdirSync(dirname(file),{recursive:true});
  let state=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{schoolId:'gbs-school',users:[],data:{erp_pro_academic_context:{current:'2026-27'}},revision:0};
  const sessions=new Map(),attempts=new Map();
  let auditContext=null;
  const persist=next=>{if(auditContext)next={...next,securityAudit:[...(state.securityAudit||[]),{id:randomUUID(),schoolId:state.schoolId||'gbs-school',actorUid:auditContext.uid,action:auditContext.action,targetUid:auditContext.targetUid||null,userChanges:(next.users||[]).filter(u=>canonical(u)!==canonical(state.users.find(old=>old.uid===u.uid))).map(u=>({uid:u.uid,oldValue:state.users.find(old=>old.uid===u.uid)?publicUser(state.users.find(old=>old.uid===u.uid)):null,newValue:publicUser(u)})),at:new Date().toISOString(),changes:[...new Set([...Object.keys(state.data||{}),...Object.keys(next.data||{})])].filter(key=>canonical(next.data[key])!==canonical(state.data[key])).map(key=>({module:key,oldValue:state.data[key]??null,newValue:next.data[key]??null}))}]};writeFileSync(file+'.next',JSON.stringify(next),{mode:0o600});if(existsSync(file))copyFileSync(file,file+'.previous');replaceFile(file+'.next',file);state=next;};
  const admin={uid:'development-admin',email:'dilippawar2207@gmail.com',name:'Development Super Admin',role:'SUPER_ADMIN',active:true,modules:['*']};
  function session(token){const entry=sessions.get(token);if(!entry||entry.expires<Date.now())fail('Sign in to the demo server.',401);const user=entry.uid===admin.uid?admin:state.users.find(u=>u.uid===entry.uid);if(!user?.active||user.archived)fail('Account inactive.',403);return publicUser(user);}
  function allowed(user,key,write=false){if(user.role==='SUPER_ADMIN')return true;if(write&&user.role==='VIEW_ONLY')return false;const module=key==='schoolSettings'?'Settings':keyModules[key.replace(/^erp_pro_/,'')];return !!module&&user.modules.includes(module)&&(!write||(user.writeModules||(['ADMIN','HEADMASTER'].includes(user.role)?user.modules:['Attendance','Communications','Homework','Results'])).includes(module))&&!(write&&['Settings','AcademicYears','Backup'].includes(module)&&!['ADMIN','HEADMASTER'].includes(user.role));}
  function visible(user,key,value){
    if(value==null)return value;
    if(user.role==='SUPER_ADMIN'||!user.assignedClass)return value;
    const studentIds=new Set((state.data.erp_pro_students||[]).filter(s=>s.className===user.assignedClass&&(!user.division||s.division===user.division)&&(!user.academicYear||s.academicYear===user.academicYear)).map(s=>String(s.id)));
    if(key==='erp_pro_students')return (value||[]).filter(s=>studentIds.has(String(s.id)));
    if(key==='erp_pro_attendance')return Object.fromEntries(Object.entries(value||{}).map(([date,rows])=>[date,Object.fromEntries(Object.entries(rows).filter(([id])=>studentIds.has(id)))]));
    if(key==='erp_pro_attendance_drafts')return Object.fromEntries(Object.entries(value||{}).filter(([id])=>{try{return studentIds.has(String(JSON.parse(id)[2]));}catch{return false;}}));
    if(key==='erp_pro_attendance_submissions')return (value||[]).filter(row=>{try{const [year,standard,division]=JSON.parse(row.groupKey);return standard===user.assignedClass&&(!user.division||division===user.division)&&(!user.academicYear||year===user.academicYear);}catch{return false;}});
    if(Array.isArray(value))return value.filter(row=>!row.studentId||studentIds.has(String(row.studentId)));
    return value;
  }
  function data(user){return Object.fromEntries(Object.entries(state.data).filter(([key])=>allowed(user,key)).map(([key,value])=>[key,visible(user,key,value)]));}
  const versions=()=>Object.fromEntries(Object.keys(state.data).map(key=>[key,state.versions?.[key]||1]));
  function handle(path,body={},token=''){
    if(path==='login'){
      const identifier=String(body.username||'').trim().toLowerCase(),password=String(body.password||''),attempt=attempts.get(identifier)||{count:0,until:0};
      if(!identifier)fail('User ID required.',401);
      if(attempt.until>Date.now())fail('Too many attempts. Wait five minutes.',429);
      const user=['admin',admin.email].includes(identifier)&&password==='admin1234'?admin:state.users.find(u=>[u.email?.toLowerCase(),u.username?.toLowerCase(),u.mobile].includes(identifier));
      if(!user||!user.active||user.archived||(user!==admin&&!matches(password,user))){attempt.count++;if(attempt.count>=5){attempt.until=Date.now()+300000;attempt.count=0;}attempts.set(identifier,attempt);fail('Invalid development username or password.',401);}
      attempts.delete(identifier);const token=randomBytes(32).toString('hex');sessions.set(token,{uid:user.uid,expires:Date.now()+8*60*60*1000});return {token,user:publicUser(user),data:data(user),revision:state.revision,versions:versions()};
    }
    const user=session(token);
    auditContext={uid:user.uid,action:path==='save-user'?(body.password?'USER_SAVE_PASSWORD_RESET':'USER_SAVE'):path==='password'?'PASSWORD_CHANGE':path.toUpperCase(),targetUid:body.user?.uid};
    if(path==='audit'){if(user.role!=='SUPER_ADMIN')fail('Super Admin required.',403);return {audit:state.securityAudit||[]};}
    if(path==='logout'){sessions.delete(token);return {ok:true};}
    if(path==='snapshot')return {data:data(user),revision:state.revision,versions:versions(),user};
    if(path==='password'){
      if(user.uid===admin.uid)fail('The fixed demo owner credential is controlled by development mode. Production passwords are unchanged.');
      const stored=state.users.find(u=>u.uid===user.uid);if(!matches(String(body.current||''),stored))fail('Current password is incorrect.');
      if(String(body.next||'').length<12)fail('Use at least 12 characters.');
      persist({...state,users:state.users.map(u=>u.uid===user.uid?{...u,...hash(body.next)}:u)});for(const [key,value]of sessions)if(value.uid===user.uid)sessions.delete(key);return {ok:true};
    }
    if(path==='users') {if(user.role!=='SUPER_ADMIN')fail('Super Admin required.',403);return {users:[admin,...state.users.map(publicUser)]};}
    if(path==='save-user'){
      if(user.role!=='SUPER_ADMIN')fail('Super Admin required.',403);
      const input=body.user||{},existing=state.users.find(u=>u.uid===input.uid);
      if(input.uid===admin.uid)fail('The demo owner cannot be changed.');
      if(!input.name?.trim()||!input.username?.trim()||!/^\S+@\S+\.\S+$/.test(input.email||'')||!roles.includes(input.role))fail('Name, username, valid email and role are required.');
      if(['TEACHER','CLASS_TEACHER'].includes(input.role)&&(!input.assignedClass?.trim()||!input.division?.trim()))fail('Assign a class and division for this teacher account.');
      const identifiers=[input.username,input.email].map(v=>v.toLowerCase().trim());
      if(identifiers.some(id=>(allowAdminUsername?[admin.email]:['admin',admin.email]).includes(id))||state.users.some(u=>u.uid!==input.uid&&[u.username,u.email].some(v=>identifiers.includes(v.toLowerCase()))))fail('Email or username already exists.');
      if((!existing||body.password)&&String(body.password||'').length<12)fail('Temporary passwords must have at least 12 characters.');
      const fields=['name','marathiName','employeeId','mobile','whatsapp','email','username','role','assignedClass','division','academicYear'];
      const record={...existing,...Object.fromEntries(fields.map(k=>[k,String(input[k]||'').trim()])),createdAt:existing?.createdAt||new Date().toISOString(),uid:existing?.uid||randomUUID(),active:input.active!==false,archived:!!input.archived,otpEnabled:false,writeModules:Array.isArray(input.writeModules)?input.writeModules.filter(v=>typeof v==='string'&&v!=='*'):['Attendance','Communications','Homework','Results'],modules:Array.isArray(input.modules)?input.modules.filter(v=>typeof v==='string'&&v!=='*'):[]};
      if(input.studentActions!==undefined){if(!Array.isArray(input.studentActions)||input.studentActions.some(action=>!studentActions.includes(action)||action==='delete'))fail('Invalid student permissions.');record.studentActions=[...new Set(input.studentActions)];}
      if(body.password)Object.assign(record,hash(body.password));
      persist({...state,users:[...state.users.filter(u=>u.uid!==record.uid),record]});if(body.password)for(const [key,value]of sessions)if(value.uid===record.uid)sessions.delete(key);return {user:publicUser(record)};
    }
    if(path==='commit'){
      const entries=body.entries||{},expected=body.expected||{};
      if(!Object.keys(entries).length)fail('No changes supplied.');
      const next={...state.data};
      for(const [key,value]of Object.entries(entries)){
        if(!/^(erp_pro_[A-Za-z0-9_]+|schoolSettings)$/.test(key)||!allowed(user,key,true))fail('Permission denied for '+key,403);
        const current=visible(user,key,state.data[key]??null);
        if(!(key in expected)||canonical(current)!==canonical(expected[key]))fail('Record changed on another device ('+key+'). Reload before saving.',409);
        if(value!==null&&(typeof value!=='object'))fail('Invalid record data.');
        if(key==='erp_pro_students')checkStudentPermissions(user,current,value);
        if(key==='erp_pro_students'&&Array.isArray(value)){
          const ids=new Set(),grs=new Set();for(const row of value){const gr=String(row.grNo||'').trim().toLowerCase();if(!row.id||ids.has(String(row.id))||(gr&&grs.has(gr)))fail('Duplicate Student ID or GR number.');ids.add(String(row.id));if(gr)grs.add(gr);}
        }
        if(user.assignedClass&&user.role!=='SUPER_ADMIN'){
          const ids=new Set((visible(user,'erp_pro_students',state.data.erp_pro_students)||[]).map(s=>String(s.id)));
          if(key==='erp_pro_attendance'){
            const merged=structuredClone(state.data[key]||{});
            for(const date of new Set([...Object.keys(current||{}),...Object.keys(value||{})])){
              const proposed=value?.[date]||{};if(Object.keys(proposed).some(id=>!ids.has(id)))fail('Student outside assigned class.',403);
              merged[date]||={};for(const id of ids)delete merged[date][id];Object.assign(merged[date],proposed);
            }next[key]=merged;
          }else if(key==='erp_pro_attendance_drafts'){
            if(Object.keys(value||{}).some(id=>{try{return !ids.has(String(JSON.parse(id)[2]));}catch{return true;}}))fail('Draft outside assigned class.',403);
            const remaining=Object.fromEntries(Object.entries(state.data[key]||{}).filter(([id])=>!Object.hasOwn(current||{},id)));next[key]={...remaining,...value};
          }else if(Array.isArray(value)){
            if(value.some(row=>key==='erp_pro_students'?!ids.has(String(row.id)):(row.studentId&&!ids.has(String(row.studentId)))||(Array.isArray(row.rows)&&row.rows.some(student=>!ids.has(String(student.id))))))fail('Student outside assigned class.',403);
            const visibleIds=new Set((current||[]).map(row=>row.id));next[key]=[...(state.data[key]||[]).filter(row=>!visibleIds.has(row.id)),...value];
          }else if(['erp_pro_attendance_years'].includes(key)){next[key]={...state.data[key],...value};}
          else fail('This scoped setting requires an administrator.',403);
        }else if(value===null)delete next[key];else next[key]=value;
      }
      const nextVersions={...versions()};for(const key of Object.keys(entries))if(canonical(state.data[key])!==canonical(next[key]))nextVersions[key]=state.revision+2;
      persist({...state,data:next,revision:state.revision+1,versions:nextVersions});return {data:data(user),revision:state.revision,versions:versions()};
    }
    fail('Unknown demo action.',404);
  }
  return async(...args)=>{
    let lock;try{lock=openSync(file+'.lock','wx');}catch{fail('Demo store is busy. Retry the save.',409);}
    try{auditContext=null;if(existsSync(file))state=JSON.parse(readFileSync(file,'utf8'));return handle(...args);}finally{auditContext=null;closeSync(lock);unlinkSync(file+'.lock');}
  };
}

export default function demoServer({enabled,file,factory=createDemoStore}){
  return {name:'school-demo-server',apply:'serve',configureServer(server){
    if(!enabled)return;const handle=factory(file);
    server.middlewares.use('/__school_demo',async(req,res)=>{
      res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
      try{
        if(req.url==='/apk'&&['GET','HEAD'].includes(req.method)){
          const apk=fileURLToPath(new URL('../../android-app/GBSSCHOOL/app/build/outputs/apk/debug/app-debug.apk',import.meta.url));
          if(!existsSync(apk))fail('Build the debug APK first.',404);
          res.setHeader('Content-Type','application/vnd.android.package-archive');res.setHeader('Content-Disposition','attachment; filename="Perfect-Education-debug.apk"');res.setHeader('Content-Length',statSync(apk).size);
          if(req.method==='HEAD')return res.end();return createReadStream(apk).on('error',()=>res.destroy()).pipe(res);
        }
        if(req.method!=='POST')fail('POST required.',405);
        const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)fail('Cross-origin access denied.',403);
        const chunks=[];let bytes=0;for await(const chunk of req){const buffer=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);bytes+=buffer.length;if(bytes>30*1024*1024)fail('Request too large.',413);chunks.push(buffer);}const raw=Buffer.concat(chunks).toString('utf8');
        const result=await handle(req.url.split('?')[0].replace(/^\//,''),raw?JSON.parse(raw):{},String(req.headers.authorization||'').replace(/^Bearer /,''));res.end(JSON.stringify(result));
      }catch(error){res.statusCode=error.status||400;res.end(JSON.stringify({error:error.message}));}
    });
  }};
}
