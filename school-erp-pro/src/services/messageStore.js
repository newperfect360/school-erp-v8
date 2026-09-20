import {prepareAutomationDue,configForAttendance} from './attendanceAutomationStore';
import {planMessages,automationTemplates} from './attendanceAutomation';
import {lifecycleActive} from './studentLifecycle';
import {readStored,writeStored,localDate} from '../storage';
import {parentContacts} from './absenceCommunication';
import {defaultWorkflow,renderMessage,selectFallback} from './messageWorkflow';
export const workflowKey='erp_pro_message_settings',jobsKey='erp_pro_message_jobs';
export function preparedJobIssue(job){
 if(job.dryRun)return 'Dry-run preview only. No device or provider dispatch is permitted.';
 const student=readStored('erp_pro_students',[]).find(s=>String(s.id)===String(job.studentId)&&lifecycleActive(s));if(!student)return 'Student is missing or archived. Reopen Student Master.';
 if(['Present','Absent','Late'].includes(job.type)&&readStored('erp_pro_attendance',{})[job.details?.Date]?.[job.studentId]!==job.type)return 'Attendance changed after preparation. Prepare a new message from the register.';
 if(job.type==='School Closed'&&readStored('erp_pro_attendance',{})[job.details?.Date]?.[job.studentId]!=='Present')return 'Present attendance no longer matches this closing draft.';
 if(job.type==='Library Due'){const id=job.key.split(':').slice(2).join(':'),loan=readStored('erp_pro_library_loans',[]).find(l=>String(l.id)===id);if(!loan||loan.returned||loan.dueDate!==job.details?.['Due Date'])return 'Library loan changed or was returned. Review the current loan.';}
 if(job.type==='Fee Reminder'){const id=job.key.split(':').slice(2).join(':'),fee=readStored('erp_pro_fee_ledger',[]).find(f=>String(f.id)===id);if(!fee||Number(fee.total)-Number(fee.paid)!==Number(job.details?.Amount))return 'Outstanding fee changed. Prepare a new message from Fees.';}
 return '';
}
export function queueMessages(events,{force=false}={}){
 const aliases={'Fee Receipt':'Fee Received','Fee Reminder':'Fee Due','Homework':'Homework Assigned'};
 const modern=events.filter(e=>automationTemplates[aliases[e.type]||e.type]);
 if(modern.length){const previous=readStored(jobsKey,[]);const next=planMessages(modern.map(e=>({...e,type:aliases[e.type]||e.type,fields:{date:e.details?.Date||localDate(),time:e.details?.Time,amount:e.details?.Amount,receipt_no:e.details?.Receipt,fee_type:e.details?.['Fee Type'],details:e.details?.Details,due_date:e.details?.['Due Date'],...e.fields}})),readStored('erp_pro_students',[]).filter(lifecycleActive),readStored('schoolSettings',{}),configForAttendance(),previous,'event-preview');if(next.length!==previous.length&&!writeStored(jobsKey,next))throw Error('Could not save dry-run queue.');const rest=events.filter(e=>!modern.includes(e));return next.length-previous.length+(rest.length?queueMessages(rest,{force}):0);}
const settings=readStored(workflowKey,defaultWorkflow),students=readStored('erp_pro_students',[]),jobs=readStored(jobsKey,[]),keys=new Set(jobs.map(j=>j.key)),added=[];for(const event of events){if(keys.has(event.key)||(!force&&!settings.enabled?.[event.type]))continue;const student=students.find(s=>String(s.id)===String(event.studentId)&&lifecycleActive(s));if(!student)continue;const contact=parentContacts(student).find(c=>c.mobile);const fallback=selectFallback(settings);added.push({id:crypto.randomUUID(),...event,studentId:student.id,studentName:student.name,parentName:contact?.name||'',parentMobile:contact?.mobile||'',message:renderMessage(event.type,student,event.details,settings),audio:settings.templates?.[event.type]?.audio||null,channel:fallback.channel||'none',status:'Prepared',failureReason:contact?fallback.reason:'Valid parent contact required in Student Master.',initiatedBy:'local-review',initiatedAt:new Date().toISOString()});keys.add(event.key)}if(added.length&&!writeStored(jobsKey,[...jobs,...added]))throw Error('Notification drafts could not be saved. School record may already be saved; review the queue.');return added.length;}
export function prepareDailyMessages(now=new Date()){return prepareAutomationDue(now);}
