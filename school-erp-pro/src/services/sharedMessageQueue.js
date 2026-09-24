import {createFirebaseRepository} from '../backend/firebaseRepository';
import {schoolFirebase} from '../backend/firebaseClient';

// Only prepares shared dry-run jobs. No client can claim provider delivery here.
export async function saveSharedMessageJobs(jobs,previous=[]){
 const client=schoolFirebase(),repo=createFirebaseRepository(client);await repo.membership();
 const mutations=[];
 for(const job of jobs){
  const old=previous.find(item=>item.key===job.key);
  if(old&&JSON.stringify(old)===JSON.stringify(job))continue;
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(job.key)))).map(v=>v.toString(16).padStart(2,'0')).join('');
  const id=old?.id||`notice_${hash}`;
  const {__version,...data}=job;
  let classId='';if(job.studentId)classId=(await repo.read('students',job.studentId)).class_id;
  mutations.push({collection:'communication_logs',id,classId,expectedVersion:old?.__version||0,mutationId:crypto.randomUUID(),data:JSON.parse(JSON.stringify({...data,id,kind:'notification_job',dryRun:true,initiatedBy:client.auth.currentUser.uid}))});
 }
 // Stable event keys + version-zero creation prevent two clients queuing duplicates.
 for(let start=0;start<mutations.length;start+=100)await repo.mutateMany(mutations.slice(start,start+100));
 return mutations.length;
}
