import {collection,doc,getDoc,getDocs,query,where,onSnapshot,runTransaction,serverTimestamp} from 'firebase/firestore';
import {ref,uploadBytes,getBlob} from 'firebase/storage';
import {collections,validateMutation,conflictError} from './recordProtocol';

const admin=member=>['Admin','Super Admin'].includes(member.role);
const globalCollections=['academic_years','notifications','settings'];
export function createFirebaseRepository({db,storage,auth,schoolId}){
 const root=`schools/${schoolId}`;
 let member=null;
 const user=()=>{if(!auth.currentUser)throw Error('Sign in to your school account.');return auth.currentUser};
 const record=(name,id)=>doc(db,root,name,id);
 async function membership(){const snapshot=await getDoc(doc(db,root,'members',user().uid));if(!snapshot.exists()||snapshot.data().active!==true)throw Error('This account has no active school membership.');member={uid:user().uid,...snapshot.data()};return member}
 function queries(name){
  if(!collections.includes(name)||!member)throw Error('Load verified membership before reading school data.');
  const base=collection(db,root,name);if(admin(member))return [base];
  const list=[];
  if(globalCollections.includes(name)||(name==='library'&&member.role==='Library Staff'))list.push(query(base,where('class_id','==','')));
  for(let i=0;i<(member.classIds||[]).length;i+=30)list.push(query(base,where('class_id','in',member.classIds.slice(i,i+30))));
  for(let i=0;i<(member.studentIds||[]).length;i+=30)list.push(query(base,where(name==='students'?'id':'data.studentId','in',member.studentIds.slice(i,i+30))));
  return list;
 }
 function watch(name,onRows,onError){const buckets=new Map();const items=queries(name);if(!items.length)onRows([]);return items.map((q,index)=>onSnapshot(q,snapshot=>{buckets.set(index,snapshot.docs.map(d=>d.data()));const rows=new Map([...buckets.values()].flat().map(r=>[r.id,r]));onRows([...rows.values()].filter(r=>!r.deleted))},onError)).reduce((stop,next)=>()=>{stop();next()},()=>{})}
 async function list(name){const snapshots=await Promise.all(queries(name).map(q=>getDocs(q)));return [...new Map(snapshots.flatMap(s=>s.docs.map(d=>[d.id,d.data()]))).values()].filter(r=>!r.deleted)}
 async function mutate(input){
  const mutation=validateMutation(input),uid=user().uid;
  if(!member||member.uid!==uid)throw Error('School membership must be refreshed.');
  return runTransaction(db,async transaction=>{
   const target=record(mutation.collection,mutation.id),snapshot=await transaction.get(target),previous=snapshot.exists()?snapshot.data():null;
   const version=previous?.version||0;
   if(version!==mutation.expectedVersion){
    if(version===mutation.expectedVersion+1){const event=await transaction.get(record('audit_logs',`${mutation.collection}_${mutation.id}_${version}`));if(event.exists()&&event.data().mutation_id===mutation.mutationId)return previous}
    throw conflictError();
   }
   let indexRef=null;
   if(mutation.collection==='students'){
    indexRef=record('student_gr',mutation.data.grNo.toLowerCase());const index=await transaction.get(indexRef);
    if(index.exists()&&index.data().student_id!==mutation.id)throw Error('This GR number already belongs to another student.');
    if(previous&&previous.data.grNo!==mutation.data.grNo)throw Error('GR number is immutable after cloud creation.');
    if(index.exists())indexRef=null;
   }
   const next={id:mutation.id,class_id:mutation.classId||'',version:version+1,updated_at:serverTimestamp(),updated_by:uid,deleted:!!mutation.deleted,data:mutation.data};
   transaction.set(target,next);
   if(indexRef)transaction.set(indexRef,{student_id:mutation.id});
   transaction.set(record('audit_logs',`${mutation.collection}_${mutation.id}_${version+1}`),{collection:mutation.collection,record_id:mutation.id,version:version+1,actor:uid,at:serverTimestamp(),mutation_id:mutation.mutationId});
   return next;
  });
 }
 async function upload(studentId,file){user();if(!studentId||studentId.includes('/'))throw Error('A student ID is required for protected storage.');if(file.size>10*1024*1024)throw Error('Maximum file size is 10 MB.');const path=`${root}/students/${studentId}/${crypto.randomUUID()}`;await uploadBytes(ref(storage,path),file,{contentType:file.type});return {path,name:file.name||'attachment',type:file.type,size:file.size}}
 async function download(path){user();if(!path.startsWith(root+'/students/'))throw Error('File belongs to another school.');return getBlob(ref(storage,path),10*1024*1024)}
 return {membership,watch,list,mutate,upload,download};
}
