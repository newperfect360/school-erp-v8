import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
const fail=(status,message)=>{throw Object.assign(Error(message),{httpStatus:status});};
const resources=['students','parents','teachers','attendance','academic_years','homework','exams','results','fees','library','sports','scholarships','trips','certificates','notifications','communication_logs','settings'];
const fields=['schoolNameEn','schoolNameMr','udise','schoolCode','tenantId','institutionName','schoolType','board','medium','address','city','taluka','district','state','pin','principal','mobile','alternateMobile','email','adminEmail','academicYear','logo','status','plan'];
export async function platformAction(req){
 const db=getFirestore(),auth=getAuth();
 const match=/^Bearer (.+)$/.exec(req.get('Authorization')||'');if(!match)fail(401,'Platform sign-in required.');
 const token=await auth.verifyIdToken(match[1],true);
 const authority=(await db.doc(`platform_members/${token.uid}`).get()).data();
 if(authority?.active!==true||!['PLATFORM_SUPER_ADMIN','PLATFORM_SUPPORT'].includes(authority.role))fail(403,'Platform administrator permission required.');
 const {action,schoolId,school,user}=req.body;
 if(authority.role==='PLATFORM_SUPPORT'&&!['platform-session','platform-list'].includes(action))fail(403,'Platform support has read-only school directory and aggregate statistics access.');
 const audit=(verb,id,extra={})=>({actor:token.uid,action:verb,schoolId:id||'',at:FieldValue.serverTimestamp(),...extra});
 const schoolRef=()=>{if(!/^[a-z0-9][a-z0-9-]{1,62}$/.test(schoolId||''))fail(400,'Invalid tenant ID.');return db.doc(`schools/${schoolId}`);};
 if(action==='platform-session')return {role:authority.role,email:token.email};
 if(action==='platform-authorities'){
  const rows=await db.collection('platform_members').get();
  const users=await Promise.all(rows.docs.map(async row=>{let account;try{account=await auth.getUser(row.id);}catch(error){if(error.code!=='auth/user-not-found')throw error;}return {uid:row.id,email:account?.email||'',role:row.data().role,active:row.data().active===true,authDisabled:account?.disabled??true,lastSignIn:account?.metadata.lastSignInTime||null};}));return {users};
 }
 if(action==='platform-save-authority'){
  if(!user?.email||!['PLATFORM_SUPER_ADMIN','PLATFORM_SUPPORT'].includes(user.role)||typeof user.active!=='boolean')fail(400,'Choose an existing account, platform role and status.');
  let account;try{account=await auth.getUserByEmail(user.email.trim().toLowerCase());}catch(error){if(error.code==='auth/user-not-found')fail(404,'Create the authorized account securely in Firebase Authentication first. No account was created.');throw error;}
  if(account.disabled&&user.active)fail(409,'The existing Authentication account is disabled.');
  if(account.uid===token.uid&&(user.role!=='PLATFORM_SUPER_ADMIN'||!user.active))fail(409,'You cannot remove your own platform administrator access.');
  await db.runTransaction(async tx=>{const owner=await tx.get(db.doc(`platform_members/${token.uid}`));if(owner.data()?.active!==true||owner.data()?.role!=='PLATFORM_SUPER_ADMIN')fail(403,'Platform authority changed. Sign in again.');
   const target=db.doc(`platform_members/${account.uid}`),old=(await tx.get(target)).data();tx.set(target,{role:user.role,active:user.active,updatedAt:FieldValue.serverTimestamp(),updatedBy:token.uid},{merge:true});tx.create(db.collection('platform_audit_logs').doc(),audit('platform.authority.update','',{targetUid:account.uid,before:old?{role:old.role,active:old.active}:null,after:{role:user.role,active:user.active}}));});
  return {saved:true,uid:account.uid};
 }
 if(action==='platform-list'){
  const rows=await db.collection('schools').get();
  const userIds=new Set((await db.collection('platform_members').get()).docs.map(d=>d.id));
  const schools=await Promise.all(rows.docs.map(async d=>{
   const groups=await Promise.all(['students','teachers','staff','members'].map(async name=>{const snap=await d.ref.collection(name).get();if(name==='members')snap.docs.forEach(r=>userIds.add(r.id));return snap.docs.filter(r=>r.data().deleted!==true);}));
   const staffIds=new Set([...groups[2],...groups[1].filter(r=>r.data().data?.kind==='staff')].map(r=>r.id));
   const {logo:_logo,...data}=d.data();return {...data,id:d.id,studentCount:groups[0].length,teacherCount:groups[1].filter(r=>(r.data().data?.kind||'teacher')==='teacher').length,staffCount:staffIds.size,userCount:groups[3].length};
  }));return {schools:authority.role==='PLATFORM_SUPPORT'?schools.map(s=>Object.fromEntries(['id','schoolNameEn','schoolNameMr','udise','status','district','createdAt','studentCount','teacherCount','staffCount','userCount'].map(key=>[key,s[key]??null]))):schools,totalPlatformUsers:userIds.size};
 }
 if(action==='platform-logs'){const logs=await db.collection('platform_audit_logs').orderBy('at','desc').limit(100).get();return {logs:logs.docs.map(d=>({id:d.id,...d.data(),at:d.data().at?.toDate().toISOString()}))};}
 if(action==='platform-settings'){const ref=db.doc('platform_settings/general');if(req.body.settings){const s=req.body.settings;if(typeof s.supportEmail!=='string'||typeof s.platformName!=='string')fail(400,'Invalid settings.');const batch=db.batch();batch.set(ref,{supportEmail:s.supportEmail.slice(0,254),platformName:s.platformName.slice(0,100)},{merge:true});batch.create(db.collection('platform_audit_logs').doc(),audit(action));await batch.commit();}return {settings:(await ref.get()).data()||{platformName:'Perfect Education',supportEmail:''}};}
 if(action==='platform-save-school'){
  if(!school||!/^\d{11}$/.test(school.udise)||!/^[a-z0-9][a-z0-9-]{1,62}$/.test(school.tenantId||'')||!school.schoolNameEn?.trim()||!school.schoolCode?.trim())fail(400,'School name, unique code, tenant ID and 11-digit UDISE are required.');
  const data=Object.fromEntries(fields.map(k=>[k,String(school[k]||'').trim()]));
  if(!['ACTIVE','INACTIVE'].includes(data.status))fail(400,'Choose Active or Inactive.');
  if(data.logo.length>200000||data.logo&&!/^data:image\/(png|jpeg|webp);base64,/.test(data.logo))fail(400,'Use a PNG/JPEG/WebP logo smaller than 140 KB.');
  const ref=db.doc(`schools/${data.tenantId}`),editing=!!school.id;
  if(editing&&school.id!==data.tenantId)fail(400,'Tenant ID is permanent.');
  await db.runTransaction(async tx=>{
   const existing=await tx.get(ref);
   if(editing!==existing.exists)fail(409,editing?'School unavailable.':'Tenant ID already exists.');
   for(const key of ['udise','schoolCode']){const matches=await tx.get(db.collection('schools').where(key,'==',data[key]));if(matches.docs.some(d=>d.id!==ref.id))fail(409,`${key} already belongs to another school.`);}
   // Deterministic reservations also serialize concurrent creates for the same identity.
   const locks=['udise','schoolCode'].map(key=>db.doc(`platform_school_keys/${key}_${encodeURIComponent(data[key])}`));
   for(const lock of locks){const held=await tx.get(lock);if(held.exists&&held.data().schoolId!==ref.id)fail(409,'School identifier is already reserved.');}
   for(const lock of locks)tx.set(lock,{schoolId:ref.id});
   tx.set(ref,{...data,schoolId:ref.id,schoolName:data.schoolNameMr||data.schoolNameEn,...(!editing?{createdAt:FieldValue.serverTimestamp()}:{}),updatedAt:FieldValue.serverTimestamp()},{merge:true});
   tx.create(db.collection('platform_audit_logs').doc(),audit(editing?'school.update':'school.create',ref.id));
  });return {schoolId:ref.id};
 }
 const ref=schoolRef(),snapshot=await ref.get();if(!snapshot.exists)fail(404,'School not found.');
 if(action==='platform-school'){
  const collection=req.body.collection;
  if(collection&&!resources.includes(collection)&&!['staff','notices','documents','templates','classes','divisions','enrollments'].includes(collection))fail(400,'Unsupported collection.');
  const rows=collection?await ref.collection(collection).limit(200).get():null;
  await db.collection('platform_audit_logs').add(audit('school.inspect',ref.id,{collection:collection||''}));
  return {school:{id:ref.id,...snapshot.data()},records:rows?rows.docs.filter(d=>!d.data().deleted).map(d=>({id:d.id,...d.data()})):[],limit:200};
 }
 if(action==='platform-status'){
  if(!['ACTIVE','INACTIVE'].includes(req.body.status))fail(400,'Invalid status.');
  const batch=db.batch();batch.update(ref,{status:req.body.status,updatedAt:FieldValue.serverTimestamp()});batch.create(db.collection('platform_audit_logs').doc(),audit('school.status',ref.id,{status:req.body.status}));await batch.commit();return {saved:true};
 }
 if(action==='platform-users'){const rows=await ref.collection('members').get();return {users:rows.docs.map(d=>({uid:d.id,...d.data()}))};}
 if(action==='platform-save-admin'){
  if(!user?.email||!user.name?.trim()||!Array.isArray(user.modules)||!user.modules.length)fail(400,'Name, email and permitted modules are required.');
  const email=user.email.trim().toLowerCase();let account;
  try{account=await auth.getUserByEmail(email);}catch(e){if(e.code!=='auth/user-not-found')throw e;account=await auth.createUser({email,displayName:user.name.trim()});}
  if(account.disabled)fail(409,'This existing Firebase account is disabled. Review it before granting access.');
  const memberRef=ref.collection('members').doc(account.uid);
  await db.runTransaction(async tx=>{const previous=await tx.get(memberRef);if(previous.exists&&['SUPER_ADMIN','SCHOOL_SUPER_ADMIN','Super Admin'].includes(previous.data().role))fail(409,'Existing Super Admin membership is preserved.');
   tx.set(memberRef,{name:user.name.trim(),email,mobile:String(user.mobile||''),role:'SCHOOL_ADMIN',active:user.active!==false,passwordSetupComplete:true,modules:user.modules.filter(x=>typeof x==='string'),resources,classIds:[],studentIds:[]},{merge:true});
   tx.create(db.collection('platform_audit_logs').doc(),audit('school.admin.save',ref.id,{targetUid:account.uid}));});
  return {uid:account.uid,email,resetRequired:true};
 }
 fail(400,'Unknown platform action.');
}
