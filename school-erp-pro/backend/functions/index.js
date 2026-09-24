import {onRequest} from 'firebase-functions/v2/https';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore,Timestamp} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import {createHash} from 'node:crypto';
import {platformAction} from './platform.js';
initializeApp();
const db=getFirestore();
const deny=(status,message)=>{throw Object.assign(Error(message),{httpStatus:status});};
const approvedRoles=new Set(['SUPER_ADMIN','SCHOOL_SUPER_ADMIN','SCHOOL_ADMIN','Super Admin','Admin','ADMIN','Headmaster','HEADMASTER','Teacher','TEACHER','Class Teacher','CLASS_TEACHER','Subject Teacher','Clerk','CLERK','Office Staff','STAFF','Sports Teacher','SPORTS_TEACHER','Trip In-charge','Library Staff','LIBRARIAN','Accounts Staff','ACCOUNTANT','VIEW_ONLY']);
async function schoolFor(udise){
 if(!/^\d{11}$/.test(udise||''))deny(400,'Enter the school’s 11-digit UDISE.');
 const found=await db.collection('schools').where('udise','==',udise).limit(2).get();
 if(found.size!==1)deny(404,'School is unavailable. Contact your administrator.');
 const document=found.docs[0],data=document.data();
 if(data.status!=='ACTIVE'||data.tenantId!==document.id)deny(403,'School is unavailable. Contact your administrator.');
 return {id:document.id,udise,schoolNameEn:data.schoolNameEn||'',schoolNameMr:data.schoolNameMr||data.schoolName||'',schoolName:data.schoolName||data.schoolNameMr||data.schoolNameEn||'',institutionName:data.institutionName||data.institutionNameMr||'',logo:data.logo||'',address:data.address||data.addressMr||'',academicYear:data.academicYear||'',status:data.status};
}
async function throttle(req){
 const id=createHash('sha256').update(req.ip||'unknown').digest('hex');
 const ref=db.collection('platform_rate_limits').doc(id),now=Date.now();
 await db.runTransaction(async tx=>{const row=(await tx.get(ref)).data();const fresh=!row||now-row.start>=60000;if(!fresh&&row.count>=60)deny(429,'Too many requests. Please wait a minute.');tx.set(ref,{start:fresh?now:row.start,count:fresh?1:row.count+1,expiresAt:Timestamp.fromMillis(now+86400000)});});
}
export const perfectEduAuth=onRequest({region:'asia-south1',maxInstances:3,minInstances:0,timeoutSeconds:30,memory:'256MiB',cors:process.env.FUNCTIONS_EMULATOR==='true'?true:['https://www.perfectedu.co.in','https://perfectedu.co.in','https://school-erp-jet.vercel.app'],invoker:'public'},async(req,res)=>{
 res.set('Cache-Control','no-store');
 try{
  if(req.method!=='POST')return res.status(405).json({error:'POST required.'});
  if(!req.is('application/json')||Buffer.byteLength(JSON.stringify(req.body||{}))>250000)deny(400,'Invalid request.');
  await throttle(req);
  if(String(req.body?.action||'').startsWith('platform-'))return res.json(await platformAction(req));
  const {action,udise,identifier}=req.body||{};
  const school=await schoolFor(String(udise||'').trim());
  if(action==='school')return res.json({school});
  if(action==='identifier'){
   const value=String(identifier||'').trim();if(!value||value.length>254)deny(400,'Enter your school email or User ID.');
   if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return res.json({email:value.toLowerCase(),school});
   // Only explicitly configured school aliases resolve. Never search other tenants.
   const matches=new Map();
   for(const field of ['username','userId','mobile']){
    const rows=await db.collection(`schools/${school.id}/members`).where(field,'==',field==='mobile'?value:value.toLowerCase()).limit(2).get();
    for(const row of rows.docs)if(row.data().active===true)matches.set(row.id,row.data());
   }
   if(matches.size!==1)deny(401,'Unable to sign in. Check your school and account details.');
   const user=await getAuth().getUser([...matches.keys()][0]);
   if(user.disabled||!user.email)deny(401,'Unable to sign in. Check your school and account details.');
   return res.json({email:user.email,school});
  }
  if(action!=='session')deny(400,'Unknown action.');
  const match=/^Bearer (.+)$/.exec(req.get('Authorization')||'');if(!match)deny(401,'Sign in required.');
  const token=await getAuth().verifyIdToken(match[1],true);
  const membership=await db.doc(`schools/${school.id}/members/${token.uid}`).get(),member=membership.data();
  if(!member?.active||member.passwordSetupComplete!==true||!approvedRoles.has(member.role)||!Array.isArray(member.modules)||!Array.isArray(member.resources))deny(403,'This account has no active access to the selected school.');
  return res.json({school,uid:token.uid,role:member.role,schoolRole:['Super Admin','SUPER_ADMIN','SCHOOL_SUPER_ADMIN'].includes(member.role)?'SCHOOL_SUPER_ADMIN':member.role});
 }catch(error){return res.status(error.httpStatus||401).json({error:error.httpStatus?error.message:'Unable to verify school access. Please sign in again.'});}
});
