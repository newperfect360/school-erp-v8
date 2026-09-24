import {useState} from 'react';
import {collection,doc,getDoc,getDocs} from 'firebase/firestore';
import {schoolFirebase} from '../backend/firebaseClient';
import {createFirebaseRepository} from '../backend/firebaseRepository';
import {collections,validateMutation} from '../backend/recordProtocol';

export default function SharedSchoolBackup(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[plan,setPlan]=useState(null),[confirmed,setConfirmed]=useState(false);
 async function run(action){setBusy(true);setMessage('');try{await action();}catch(error){setMessage(error.message);}finally{setBusy(false);}}
 async function connection(){const client=schoolFirebase(),repo=createFirebaseRepository(client),member=await repo.membership();if(!['SUPER_ADMIN','Super Admin','SCHOOL_SUPER_ADMIN','Admin','SCHOOL_ADMIN'].includes(member.role))throw Error('School administrator access required.');return {client,repo};}
 async function download(){const {client}=await connection(),data={};
  for(const name of [...collections,'audit_logs','members']){const snapshot=await getDocs(collection(client.db,'schools',client.schoolId,name));data[name]=snapshot.docs.map(row=>({id:row.id,...row.data()}));}
  const school=await getDoc(doc(client.db,'schools',client.schoolId));
  const backup={format:'perfect-education-school-export',version:1,schoolId:client.schoolId,projectId:client.db.app.options.projectId,createdAt:new Date().toISOString(),school:school.data(),includesBinaryAssets:false,atomicSnapshot:false,data};
  const text=JSON.stringify(backup,null,2),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(v=>v.toString(16).padStart(2,'0')).join('');
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`Perfect-Education-${client.schoolId}-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage(`Export downloaded. SHA-256: ${hash}`);
 }
 async function preview(file){setPlan(null);setConfirmed(false);if(!file)return;
  if(file.size>50*1024*1024)throw Error('Review exports larger than 50 MB using the backend backup process.');
  const backup=JSON.parse(await file.text()),{client}=await connection();
  if(backup.format!=='perfect-education-school-export'||backup.version!==1||backup.schoolId!==client.schoolId||backup.projectId!==client.db.app.options.projectId)throw Error('The export must belong to this exact Firebase project and school.');
  const mutations=[],counts=[];
  for(const name of collections){const incoming=backup.data?.[name]||[];if(!Array.isArray(incoming))throw Error(`Invalid collection: ${name}`);const existing=await getDocs(collection(client.db,'schools',client.schoolId,name)),ids=new Set(existing.docs.map(d=>d.id));let retained=0,added=0;
   for(const row of incoming){if(!row||typeof row.id!=='string')throw Error(`Invalid record in ${name}`);if(ids.has(row.id)||row.deleted){retained++;continue;}ids.add(row.id);
    const mutation=validateMutation({collection:name,id:row.id,classId:row.class_id,expectedVersion:0,mutationId:crypto.randomUUID(),data:row.data});mutations.push(mutation);added++;
   }counts.push({name,added,retained});
  }
  if(mutations.length>100)throw Error('This restore contains more than 100 missing records. Use a reviewed backend restore so the full restore can be checked before writing.');
  setPlan({mutations,counts});
 }
 async function restore(){if(!plan||!confirmed)return;const {repo}=await connection();if(plan.mutations.length)await repo.mutateMany(plan.mutations);setPlan(null);setConfirmed(false);setMessage('Missing operational records restored atomically. Existing records, school identity and permissions were not overwritten.');}
 return <section className="school-panel workflow-panel"><h2>School database export and restore</h2><p>Exports the current tenant’s operational records, audit history and membership metadata from Firestore. This manual export is not an atomic database backup and does not include Storage files or Firebase Authentication accounts. Scheduled full backups and file recovery require the backend backup service.</p><button disabled={busy} onClick={()=>run(download)}>Download school database export</button><label>Preview school database restore<input disabled={busy} type="file" accept=".json" onChange={event=>{const file=event.target.files?.[0];event.target.value='';run(()=>preview(file));}}/></label>{plan&&<><h3>Restore preview</h3>{plan.counts.map(row=><p key={row.name}>{row.name}: {row.added} missing, {row.retained} retained/skipped</p>)}<p>Memberships, security configuration, school identity and audit history are never restored through this form. Conflicts stop the entire transaction.</p><label><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Restore missing records only; keep all existing values.</label><button disabled={busy||!confirmed||!plan.mutations.length} onClick={()=>run(restore)}>Confirm school database restore</button></>}<p role="status">{message}</p></section>;
}
