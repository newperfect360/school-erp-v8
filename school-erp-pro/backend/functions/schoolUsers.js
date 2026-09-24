import {getAuth} from 'firebase-admin/auth';
import {FieldValue} from 'firebase-admin/firestore';
const deny=(status,message)=>{throw Object.assign(Error(message),{httpStatus:status});};
const privileged=['SUPER_ADMIN','SCHOOL_SUPER_ADMIN','Super Admin'];
const administrators=[...privileged,'Admin','ADMIN','SCHOOL_ADMIN'];
const roles=['SCHOOL_ADMIN','HEADMASTER','TEACHER','CLERK','ACCOUNTANT','LIBRARIAN','SPORTS_TEACHER','STAFF','READ_ONLY'];
export async function schoolUsersAction({db,token,school,member,action,user}){
 if(!administrators.includes(member.role))deny(403,'School administrator permission required.');
 const auth=getAuth(),root=db.doc(`schools/${school.id}`);
 if(action==='school-users'){
  const rows=await root.collection('members').get();return {users:await Promise.all(rows.docs.map(async row=>{let account;try{account=await auth.getUser(row.id);}catch(error){if(error.code!=='auth/user-not-found')throw error;}return {uid:row.id,...row.data(),email:account?.email||row.data().email||'',authDisabled:account?.disabled??true,lastSignIn:account?.metadata.lastSignInTime||null};}))};
 }
 if(action!=='school-save-user')deny(400,'Unknown school user action.');
 if(!user||!user.name?.trim()||!/^\S+@\S+\.\S+$/.test(user.email||'')||!roles.includes(user.role)||typeof user.active!=='boolean')deny(400,'Name, valid email, school role and status are required.');
 for(const key of ['modules','resources','classIds','studentIds'])if(!Array.isArray(user[key])||user[key].length>100||user[key].some(v=>typeof v!=='string'||!v||v.length>100||v.includes('/')))deny(400,`Invalid ${key}.`);
 if(!user.modules.length||!user.resources.length||user.modules.some(m=>!member.modules.includes(m))||user.resources.some(r=>!member.resources.includes(r)))deny(403,'You cannot grant permissions beyond your own school access.');
 if(user.role==='SCHOOL_ADMIN'&&!privileged.includes(member.role))deny(403,'Only the school Super Admin can appoint another school administrator.');
 const email=user.email.trim().toLowerCase(),username=String(user.username||'').trim().toLowerCase(),mobile=String(user.mobile||'').trim();
 if(username&&!/^[a-z0-9._-]{3,64}$/.test(username)||mobile&&!/^\+?[0-9]{10,15}$/.test(mobile))deny(400,'Enter a valid User ID and mobile number.');
 let account;try{account=await auth.getUserByEmail(email);}catch(error){if(error.code!=='auth/user-not-found')throw error;if(user.uid)deny(409,'The existing account email cannot be changed here.');account=await auth.createUser({email,displayName:user.name.trim()});}
 if(user.uid&&user.uid!==account.uid)deny(409,'The existing account email cannot be changed here.');
 if(account.uid===token.uid)deny(409,'You cannot change your own membership through this form.');
 if(account.disabled&&user.active)deny(409,'Authentication account is disabled. Review it through authorized account administration.');
 const target=root.collection('members').doc(account.uid),actorRef=root.collection('members').doc(token.uid);
 await db.runTransaction(async tx=>{
  const actor=(await tx.get(actorRef)).data(),currentSchool=(await tx.get(root)).data(),old=(await tx.get(target)).data();
  if(currentSchool?.status!=='ACTIVE'||actor?.active!==true||actor.passwordSetupComplete!==true||!administrators.includes(actor.role))deny(403,'School administrator access changed. Sign in again.');
  if(user.modules.some(m=>!actor.modules.includes(m))||user.resources.some(r=>!actor.resources.includes(r)))deny(403,'Assigned permissions changed. Review this request.');
  if(privileged.includes(old?.role)||(!privileged.includes(actor.role)&&(administrators.includes(old?.role)||user.role==='SCHOOL_ADMIN')))deny(403,'This administrator membership is protected.');
  const locks=[];
  for(const [field,value]of [['username',username],['mobile',mobile]])if(value){const matches=await tx.get(root.collection('members').where(field,'==',value).limit(2));if(matches.docs.some(row=>row.id!==account.uid))deny(409,`${field} already identifies another user in this school.`);const lock=root.collection('user_keys').doc(`${field}_${encodeURIComponent(value)}`),reserved=await tx.get(lock);if(reserved.exists&&reserved.data().uid!==account.uid)deny(409,`${field} is reserved for another school user.`);locks.push(lock);}
  const data={name:user.name.trim(),email,username,mobile,role:user.role,active:user.active,passwordSetupComplete:true,modules:user.modules,resources:user.resources,classIds:user.classIds,studentIds:user.studentIds,updatedBy:token.uid,updatedAt:FieldValue.serverTimestamp()};
  for(const lock of locks)tx.set(lock,{uid:account.uid});
  tx.set(target,data,{merge:true});const event={actor:token.uid,role:actor.role,schoolId:school.id,targetUid:account.uid,action:old?'school.user.update':'school.user.create',at:FieldValue.serverTimestamp(),before:old?{role:old.role,active:old.active,modules:old.modules,resources:old.resources,classIds:old.classIds||[]}:null,after:{role:data.role,active:data.active,modules:data.modules,resources:data.resources,classIds:data.classIds}};tx.create(db.collection('platform_audit_logs').doc(),event);tx.create(root.collection('audit_logs').doc(),event);
 });return {saved:true,uid:account.uid,email};
}
