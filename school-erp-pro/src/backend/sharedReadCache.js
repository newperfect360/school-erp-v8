import {cloudEnabled} from './firebaseClient';
import {developmentEnabled} from '@development-auth';

export const sharedOperationalEnabled=cloudEnabled&&!developmentEnabled;
const snapshots=new Map();
let schoolIdentity={};
export function setSharedSchoolIdentity(school={}){schoolIdentity={...school,tenantId:school.id||school.tenantId,schoolName:school.schoolName||school.schoolNameMr||school.schoolNameEn||'',sansthaName:school.institutionName||'',logo:school.logo||''};}
export const sharedKeys={
 students:['erp_pro_students','erp_pro_student_movements','erp_pro_academic_history'],teachers:['erp_pro_teachers','erp_pro_staff','erp_pro_staff_attendance'],
 attendance:['erp_pro_attendance'],academic_years:['erp_pro_academic_years'],
 fees:['erp_pro_fee_ledger'],results:['erp_pro_results'],homework:['erp_pro_homework','erp_pro_classwork'],parents:['erp_pro_parent_meetings','erp_pro_parent_visits','erp_pro_student_checkouts','erp_pro_permission_register'],
 library:['erp_pro_library_books','erp_pro_library_loans'],
 sports:['erp_pro_sports_equipment','erp_pro_sports_athletes','erp_pro_equipment_loans'],
 trips:['erp_pro_trips'],notifications:['erp_pro_notices'],communication_logs:['erp_pro_absence_communications','erp_pro_message_jobs'],
 settings:['schoolSettings','erp_pro_attendance_automation','erp_pro_document_templates'],certificates:['erp_pro_certificates'],
};
const keys=new Set(Object.values(sharedKeys).flat());
export const isSharedKey=key=>sharedOperationalEnabled&&keys.has(key);
export const sharedSnapshot=key=>snapshots.get(key)??null;
export function clearSharedSnapshots(){snapshots.clear();schoolIdentity={};}
export function publishSharedRows(collection,records){
 const rows=records.map(record=>({...record.data,id:record.id,__version:record.version}));
 const put=(key,value)=>snapshots.set(key,JSON.stringify(value));
 if(collection==='settings'){
  const general=rows.find(r=>r.id==='general');
  put('schoolSettings',{...schoolIdentity,...(general||{}),tenantId:schoolIdentity.tenantId,udise:schoolIdentity.udise});
  put('erp_pro_attendance_automation',rows.find(r=>r.id==='attendance-automation')||{});
  put('erp_pro_document_templates',rows.filter(r=>r.kind==='document_template'));
 }else if(collection==='homework'){
  put('erp_pro_homework',rows.filter(r=>(r.kind||'homework')==='homework').map(r=>({...r,homework:r.details??r.homework})));
  put('erp_pro_classwork',rows.filter(r=>r.kind==='classwork'));
 }else if(collection==='parents'){
  put('erp_pro_parent_meetings',rows.filter(r=>r.kind==='meeting'));
  put('erp_pro_parent_visits',rows.filter(r=>r.kind==='visit'));
  put('erp_pro_student_checkouts',rows.filter(r=>r.kind==='student_checkout'));
  put('erp_pro_permission_register',rows.filter(r=>r.kind==='permission'));
 }else if(collection==='students'){
  put('erp_pro_students',rows);
  put('erp_pro_student_movements',rows.flatMap(r=>r.movements||[]));
  put('erp_pro_academic_history',rows.flatMap(r=>r.enrollmentHistory||[]));
 }else if(collection==='teachers'){
  put('erp_pro_teachers',rows.filter(r=>(r.kind||'teacher')==='teacher'));
  put('erp_pro_staff',rows.filter(r=>r.kind==='staff'));
  const days={};for(const row of rows.filter(r=>r.kind==='staff_attendance')){days[row.date]||={rows:[]};days[row.date].rows.push(row);}put('erp_pro_staff_attendance',days);
 }else if(collection==='communication_logs'){
  put('erp_pro_absence_communications',rows.filter(r=>r.kind!=='notification_job'));
  put('erp_pro_message_jobs',rows.filter(r=>r.kind==='notification_job'));
 }else if(collection==='library'){
  put('erp_pro_library_books',rows.filter(r=>(r.kind||'book')==='book'));
  put('erp_pro_library_loans',rows.filter(r=>r.kind==='loan'));
 }else if(collection==='sports'){
  put('erp_pro_sports_equipment',rows.filter(r=>(r.kind||'equipment')==='equipment'));
  put('erp_pro_sports_athletes',rows.filter(r=>r.kind==='athlete'));
  put('erp_pro_equipment_loans',rows.filter(r=>r.kind==='loan'));
 }else if(collection==='attendance'){
  const days={};for(const row of rows){days[row.date]||={};days[row.date][row.studentId]=row.status;}put('erp_pro_attendance',days);
 }else if(sharedKeys[collection])put(sharedKeys[collection][0],rows);
 if(typeof window!=='undefined')window.dispatchEvent(new Event('school-data-changed'));
}
