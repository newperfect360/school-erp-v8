import {readFileSync,writeFileSync,existsSync,mkdirSync,renameSync,statSync,copyFileSync} from 'node:fs';
import {dirname,join,basename} from 'node:path';
import {randomUUID,randomBytes} from 'node:crypto';
import {createDemoStore,roles,keyModules} from './demo-store.mjs';

const fail=(message,status=403)=>{throw Object.assign(Error(message),{status});};
const write=(file,value)=>{mkdirSync(dirname(file),{recursive:true});writeFileSync(file+'.next',JSON.stringify(value,null,2));renameSync(file+'.next',file);};
const normalize=value=>String(value||'').trim().toUpperCase();
const fields=['schoolNameEn','schoolNameMr','institutionName','institutionNameMr','address','district','taluka','state','pin','logo','institutionLogo','email','mobile','academicYear','schoolType','medium','subscriptionStatus','softwareVersion'];
const schoolSettings=school=>({tenantId:school.id,schoolId:school.id,identityRevision:'tenant-v1',schoolName:school.schoolNameMr||school.schoolNameEn,schoolNameMr:school.schoolNameMr,schoolNameEn:school.schoolNameEn,sansthaName:school.institutionNameMr||school.institutionName,institutionNameMr:school.institutionNameMr,institutionNameEn:school.institutionName,address:school.address,addressMr:school.address,logo:school.logo||'',institutionLogo:school.institutionLogo||'',udise:school.udise,academicYear:school.academicYear,email:school.email,contactNumber:school.mobile});

/** Development platform only. Every public session is bound to one audience/tenant. */
export function createPlatformStore(legacyFile){
 const directory=dirname(legacyFile),registryFile=join(directory,basename(legacyFile)+'.platform.json'),stores=new Map(),sessions=new Map();
 if(!existsSync(registryFile)){
  const old=existsSync(legacyFile)?JSON.parse(readFileSync(legacyFile,'utf8')):null;
  const identity=JSON.parse(readFileSync(new URL('../../assets/school-identity.json',import.meta.url),'utf8'));
  const config=old?.data?.schoolSettings||{};
  const school={...config,logo:config.logo||'data:image/jpeg;base64,'+readFileSync(new URL('../../assets/school-logo.jpg',import.meta.url)).toString('base64'),institutionLogo:config.institutionLogo||'',email:config.email||'',mobile:config.contactNumber||'',id:'gbs-school',udise:config.udise||'',schoolNameEn:config.schoolNameEn||'',schoolNameMr:config.schoolName||identity.schoolNameMr,institutionNameMr:config.sansthaName||identity.institutionNameMr,address:config.address||identity.addressMr,academicYear:'2026-27',status:'ACTIVE',subscriptionStatus:'DEVELOPMENT',modules:['*'],createdAt:new Date().toISOString(),legacy:true};
  if(old){
   const backup=legacyFile+'.pre-perfectedu-'+Date.now();copyFileSync(legacyFile,backup);
   if(readFileSync(backup,'utf8')!==readFileSync(legacyFile,'utf8'))fail('Migration backup verification failed.');
   const counts=Object.fromEntries(Object.entries(old.data||{}).map(([k,v])=>[k,Array.isArray(v)?v.length:Object.keys(v||{}).length]));
   // Link the existing whole store to its permanent tenant; keep every record and ID.
   old.data.schoolSettings={...schoolSettings(school),...config,tenantId:'gbs-school',schoolId:'gbs-school'};
   old.schoolId='gbs-school';write(legacyFile,old);
   write(join(directory,'perfectedu-migration.json'),{at:new Date().toISOString(),backup,schoolId:'gbs-school',before:counts,after:counts,recordIdsPreserved:true,operation:'Link existing store; add tenant identity to settings only'});
  }
  write(registryFile,{schema:1,schools:[school],audit:[{at:new Date().toISOString(),action:'LINK_EXISTING_SCHOOL',schoolId:school.id}],softwareVersion:'1.0.0-demo-test'});
 }
 const registry=()=>JSON.parse(readFileSync(registryFile,'utf8'));
 const file=school=>school.id==='gbs-school'?legacyFile:join(directory,basename(legacyFile)+'.tenants',school.id+'.json');
 const store=school=>{if(!stores.has(school.id))stores.set(school.id,createDemoStore(file(school),{allowAdminUsername:school.id!=='gbs-school'}));return stores.get(school.id);};
 const owner=async school=>store(school)('login',{username:'admin',password:'admin1234'});
 const publicSchool=s=>Object.fromEntries(['id','udise','schoolNameEn','schoolNameMr','address','logo','status'].map(k=>[k,s[k]||'']));
 const enabledKey=(school,key)=>key==='schoolSettings'||school.modules.includes('*')||school.modules.includes(keyModules[key.replace(/^erp_pro_/,'')]);
 const decorated=(result,school)=>({...result,...(result.data?{data:Object.fromEntries(Object.entries(result.data).filter(([key])=>enabledKey(school,key)))}:{}),school:publicSchool(school),...(result.user?{user:{...result.user,schoolId:school.id,tenantId:school.id,udise:school.udise,schoolRole:result.user.role==='SUPER_ADMIN'?'SCHOOL_SUPER_ADMIN':result.user.role,modules:school.modules.includes('*')?(result.user.role==='SUPER_ADMIN'?['*']:result.user.modules):result.user.modules.includes('*')||result.user.role==='SUPER_ADMIN'?school.modules:result.user.modules.filter(m=>school.modules.includes(m))}}:{})});
 const audit=(state,action,schoolId,actor)=>{state.audit.push({id:randomUUID(),at:new Date().toISOString(),action,schoolId,actor});write(registryFile,state);};
 let queue=Promise.resolve();
 const handle=async(path,body={},token='')=>{
  let state=registry();
  if(path==='resolve-school'){
   const school=state.schools.find(s=>s.udise&&s.udise===normalize(body.udise));
   if(!school||school.status!=='ACTIVE')fail('School not found or inactive.',404);
   return {school:publicSchool(school)};
  }
  if(path==='platform-login'){
   const original=state.schools.find(s=>s.id==='gbs-school');
   const result=await store(original)('login',body);
   if(result.user.uid!=='development-admin')fail('Platform administrator required.');
   const id=randomBytes(32).toString('hex');sessions.set(id,{audience:'platform',expires:Date.now()+8*3600000});
   return {token:id,role:'PLATFORM_SUPER_ADMIN'};
  }
  if(path==='login'){
   const code=normalize(body.udise);
   // Preserve only the existing owner's explicitly authorized development shortcut.
   const school=state.schools.find(s=>code?s.udise===code:s.id==='gbs-school');
   if(!school||school.status!=='ACTIVE')fail('School not found or inactive.',401);
   const identifier=String(body.username||'').toLowerCase().trim();
   if(!code&&!['admin','dilippawar2207@gmail.com'].includes(identifier))fail('School UDISE is required.',401);
   if(school.id!=='gbs-school'&&['dilippawar2207@gmail.com'].includes(identifier))fail('Use this school’s own user account.',401);
   // The fixed legacy owner must never authenticate another school.
   if(school.id!=='gbs-school'&&identifier==='admin'&&body.password==='admin1234')fail('Use this school’s own password.',401);
   const result=await store(school)('login',body);
   if(school.id!=='gbs-school'&&result.user.uid==='development-admin')fail('School-specific account required.',401);
   const id=randomBytes(32).toString('hex');sessions.set(id,{audience:'school',schoolId:school.id,inner:result.token,expires:Date.now()+8*3600000});
   return {...decorated(result,school),token:id};
  }
  const session=sessions.get(token);if(!session||session.expires<Date.now())fail('Sign in again.',401);
  if(path==='logout'){sessions.delete(token);return {ok:true};}
  if(path.startsWith('platform-')){
   if(session.audience!=='platform')fail('Platform administrator required.');
   if(path==='platform-schools')return {schools:state.schools.map(s=>{const content=existsSync(file(s))?JSON.parse(readFileSync(file(s),'utf8')):{};return {...s,studentCount:content.data?.erp_pro_students?.length||0,staffCount:(content.data?.erp_pro_teachers?.length||0)+(content.data?.erp_pro_staff?.length||0),storageBytes:existsSync(file(s))?statSync(file(s)).size:0,userCount:content.users?.length||0};}),audit:state.audit,roles};
   if(path==='platform-save-school'){
    const input=body.school||{},existing=state.schools.find(s=>s.id===input.id),udise=normalize(input.udise);
    if(!/^\d{11}$/.test(udise)&&!/^DEMO\d{6}$/.test(udise))fail('Enter an 11-digit UDISE or an explicit DEMO code.',400);
    if(existing?.udise&&existing.udise!==udise)fail('The registered UDISE is permanent.',400);
    if(state.schools.some(s=>s.id!==existing?.id&&s.udise===udise))fail('UDISE already belongs to a school.',409);
    if(!input.schoolNameEn?.trim()&&!input.schoolNameMr?.trim())fail('School name required.',400);
    const school={...existing,...Object.fromEntries(fields.map(k=>[k,String(input[k]??existing?.[k]??'').trim()])),id:existing?.id||'school-'+randomUUID(),udise,status:existing?.status||'INACTIVE',modules:Array.isArray(input.modules)?input.modules:existing?.modules||['*'],createdAt:existing?.createdAt||new Date().toISOString()};
    if(!existing){write(file(school),{schoolId:school.id,users:[],data:{schoolSettings:schoolSettings(school),erp_pro_academic_context:{current:school.academicYear||'2026-27'}},revision:0});}
    else {
     const access=await owner(school),settings=access.data.schoolSettings||{};
     await store(school)('commit',{entries:{schoolSettings:{...settings,...schoolSettings(school)}},expected:{schoolSettings:access.data.schoolSettings??null}},access.token);
    }
    state.schools=[...state.schools.filter(s=>s.id!==school.id),school];audit(state,existing?'EDIT_SCHOOL':'CREATE_SCHOOL',school.id,'platform');return {school};
   }
   const school=state.schools.find(s=>s.id===body.schoolId);if(!school)fail('School not found.',404);
   if(path==='platform-enter-school'){
    if(school.status!=='ACTIVE')fail('Activate this school before entering it.');
    const result=await owner(school),id=randomBytes(32).toString('hex');sessions.set(id,{audience:'school',schoolId:school.id,inner:result.token,expires:Date.now()+3600000});audit(state,'PLATFORM_ENTER_SCHOOL',school.id,'platform');return {...decorated(result,school),token:id};
   }
   if(path==='platform-school-status'){
    if(!['ACTIVE','INACTIVE','SUSPENDED','ARCHIVED'].includes(body.status))fail('Invalid school status.',400);
    const content=existsSync(file(school))?JSON.parse(readFileSync(file(school),'utf8')):{};
    if(body.status==='ACTIVE'&&school.id!=='gbs-school'&&!content.users?.some(u=>u.active&&!u.archived&&u.role==='SUPER_ADMIN'))fail('Create an active School Master Admin before activation.',400);
    school.status=body.status;audit(state,'STATUS_'+body.status,school.id,'platform');return {school};
   }
   if(path==='platform-school-users'){
    const access=await owner(school);return store(school)('users',{},access.token);
   }
   if(path==='platform-save-admin'){
    const access=await owner(school);
    const result=await store(school)('save-user',{user:{...body.user,role:'SUPER_ADMIN',modules:['*'],active:body.user?.active!==false},password:body.password},access.token);
    audit(state,'SAVE_SCHOOL_ADMIN',school.id,'platform');return decorated(result,school);
   }
   fail('Unknown platform action.',404);
  }
  if(session.audience!=='school')fail('School login required.');
  const school=state.schools.find(s=>s.id===session.schoolId);
  if(!school||school.status!=='ACTIVE')fail('School access suspended.',403);
  if((body.schoolId&&body.schoolId!==school.id)||(body.tenantId&&body.tenantId!==school.id)||(body.udise&&normalize(body.udise)!==school.udise))fail('Cross-school request denied.');
  if(!['snapshot','commit','password','users','save-user','audit'].includes(path))fail('Unknown school action.',404);
  if(['users','save-user'].includes(path)&&!school.modules.includes('*')&&!school.modules.includes('AccessSetup'))fail('User administration is disabled for this school.');
  if(path==='save-user')body={...body,user:{...body.user,role:body.user?.role==='SCHOOL_SUPER_ADMIN'?'SUPER_ADMIN':body.user?.role}};
  if(path==='commit')for(const [key,value] of Object.entries(body.entries||{})){
   if(!enabledKey(school,key))fail('Module disabled by platform administrator.');
   const rows=Array.isArray(value)?value:[value];for(const row of rows)if(row&&((row.schoolId&&row.schoolId!==school.id)||(row.tenantId&&row.tenantId!==school.id)))fail('Cross-school record denied.');
  }
  const result=await store(school)(path,body,session.inner);
  if(result.users)result.users=result.users.filter(user=>school.id==='gbs-school'||user.uid!=='development-admin').map(user=>({...user,schoolId:school.id,tenantId:school.id,udise:school.udise,status:user.active?'ACTIVE':'INACTIVE',userId:user.uid,permissions:user.modules}));
  return decorated(result,school);
 };
 return (...args)=>{const result=queue.then(()=>handle(...args));queue=result.catch(()=>{});return result;};
}
