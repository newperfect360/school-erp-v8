import {cloudEnabled} from './firebaseClient';
import {developmentEnabled} from '@development-auth';

export const sharedOperationalEnabled=cloudEnabled&&!developmentEnabled;
const snapshots=new Map();
export const sharedKeys={
 students:['erp_pro_students','erp_pro_student_movements','erp_pro_academic_history'],teachers:['erp_pro_teachers','erp_pro_staff'],
 attendance:['erp_pro_attendance'],academic_years:['erp_pro_academic_years'],
 fees:['erp_pro_fee_ledger'],results:['erp_pro_results'],homework:['erp_pro_homework'],
 library:['erp_pro_library_books','erp_pro_library_loans'],
 sports:['erp_pro_sports_equipment','erp_pro_sports_athletes','erp_pro_equipment_loans'],
 trips:['erp_pro_trips'],notifications:['erp_pro_notices'],communication_logs:['erp_pro_absence_communications'],
};
const keys=new Set(Object.values(sharedKeys).flat());
export const isSharedKey=key=>sharedOperationalEnabled&&keys.has(key);
export const sharedSnapshot=key=>snapshots.get(key)??null;
export function clearSharedSnapshots(){snapshots.clear();}
export function publishSharedRows(collection,records){
 const rows=records.map(record=>({...record.data,id:record.id,__version:record.version}));
 const put=(key,value)=>snapshots.set(key,JSON.stringify(value));
 if(collection==='students'){
  put('erp_pro_students',rows);
  put('erp_pro_student_movements',rows.flatMap(r=>r.movements||[]));
  put('erp_pro_academic_history',rows.flatMap(r=>r.enrollmentHistory||[]));
 }else if(collection==='teachers'){
  put('erp_pro_teachers',rows.filter(r=>(r.kind||'teacher')==='teacher'));
  put('erp_pro_staff',rows.filter(r=>r.kind==='staff'));
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
}
