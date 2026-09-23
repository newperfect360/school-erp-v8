import {readStored,commitStoredBatch} from '../storage';
import {submissionKey,studentStatuses} from './attendanceAutomation';

export function correctSubmittedAttendance(snapshot,studentId,patch,reason,actor) {
  if(!actor?.uid || !['Super Admin','SUPER_ADMIN','Admin','ADMIN','Headmaster','HEADMASTER'].includes(actor.role))throw Error('Management permission required for a finalized attendance correction.');
  if(!reason.trim())throw Error('A correction reason is required.');
  const keys=[submissionKey,'erp_pro_attendance','erp_pro_message_jobs'];
  const expected=Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)]));
  const submissions=readStored(submissionKey,[]),index=submissions.findIndex(row=>row.id===snapshot.id);
  if(index<0 || JSON.stringify(submissions[index])!==JSON.stringify(snapshot))throw Error('Attendance changed. Reopen the correction form.');
  const previous=snapshot.rows.find(row=>row.id===studentId);
  if(!previous)throw Error('Student is not in this submitted register.');
  if(Object.keys(patch).some(key=>!['status','arrivalTime','outTime','reason','remark'].includes(key)))throw Error('Student identity cannot be changed.');
  if(!studentStatuses.includes(patch.status))throw Error('Select a valid attendance status.');
  const time=/^([01]\d|2[0-3]):[0-5]\d$/;
  if(patch.status==='Late'&&!time.test(patch.arrivalTime||''))throw Error('Late attendance requires a valid arrival time.');
  if(['Permission Leave','Early Leave'].includes(patch.status)&&(!time.test(patch.outTime||'')||!patch.reason?.trim()))throw Error('Permission/early leave requires out time and reason.');
  const after={...previous,...patch},at=new Date().toISOString();
  const rows=snapshot.rows.map(row=>row.id===studentId?after:row);
  submissions[index]={...snapshot,rows,fingerprint:JSON.stringify(rows.map(row=>Object.fromEntries(['id','status','arrivalTime','outTime','reason','remark'].map(key=>[key,row[key]||''])))),revisions:[...(snapshot.revisions||[]),{studentId,before:previous,after,reason:reason.trim(),actor:actor.uid,at}]};
  const attendance=readStored('erp_pro_attendance',{});
  // Retain all historical messages; mark unsent drafts stale instead of sending a correction automatically.
  const jobs=readStored('erp_pro_message_jobs',[]).map(job=>String(job.studentId)===String(studentId)&&[...studentStatuses,"School Closed"].includes(job.type)&&(job.details?.Date===snapshot.date||job.fields?.date===snapshot.date||job.sourceEvent?.fields?.date===snapshot.date||job.date===snapshot.date)&&!['Sent','Delivered'].includes(job.status)?{...job,invalidatedAt:at,failureReason:'Attendance corrected. Review and prepare a new message.'}:job);
  commitStoredBatch({[submissionKey]:submissions,erp_pro_attendance:{...attendance,[snapshot.date]:{...attendance[snapshot.date],[studentId]:after.status}},erp_pro_message_jobs:jobs},expected);
}
