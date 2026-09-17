export const studentStatuses = ['Active','Promoted','Repeated','Passed Out','School Left','Transferred','TC/LC Issued','Long Absent','Suspended','Archived','Inactive'];
export const inactiveStatuses = ['Passed Out','School Completed','School Left','Transferred','TC/LC Issued','Suspended','Archived','Inactive','Transfer','Leaving','Exit'];
export const lifecycleActive = s => !s.archivedAt && !inactiveStatuses.includes(s.status);
export const enrollment = s => Object.fromEntries(['academicYear','className','division','rollNo','status'].map(k=>[k,s[k]||'']));
export function yearStart(year){const match=/^(\d{4})[-–](\d{2}|\d{4})$/.exec(String(year||''));if(!match)return null;const first=Number(match[1]),last=Number(match[2]);return (last===first+1||last===(first+1)%100)?first:null;}
export function academicSnapshot(student,results,attendance,action,date){
 const start=yearStart(student.academicYear);
 const from=student.enrollmentStartedOn||(start?`${start}-06-01`:date);
 const through=start?`${start+1}-05-31`:date;
 return {studentId:student.id,...enrollment(student),promotionStatus:action,recordedAt:date,attendanceFrom:from,attendanceThrough:through,
  results:results.filter(r=>(r.studentId===student.id||(!r.studentId&&r.grNo===student.grNo))&&r.academicYear===student.academicYear),
  attendance:Object.fromEntries(Object.entries(attendance).filter(([day,rows])=>day>=from&&day<=through&&rows[student.id]).map(([day,rows])=>[day,rows[student.id]]))};
}
export function planMovement(student,change,{results=[],attendance={},date=new Date().toISOString(),actor='local-review'}={}){
 const action=change.action,day=date.slice(0,10);if(!student?.id)throw Error('Student is missing.');if(!change.reason?.trim())throw Error('A reason is required.');
 let next={...student,updatedAt:date},snapshot=null;
 const annual=['Promote','Repeat','Detained','Result Pending'];
 if(annual.includes(action)){
  if(!lifecycleActive(student))throw Error('Restore or reactivate the student before year-end processing.');
  const old=yearStart(student.academicYear),target=yearStart(change.academicYear);
  if(old===null||target!==old+1)throw Error('Use consecutive academic years, for example 2026-27 to 2027-28. Set the current year first.');
  const current=Number(student.className);if(!Number.isInteger(current)||current<1||current>12)throw Error('Standard must be a number from 1 to 12.');
  if(action==='Promote'&&current===12)throw Error('Use Passed Out for standard 12.');
  next={...next,academicYear:change.academicYear,className:String(action==='Promote'?current+1:current),division:change.division??student.division,rollNo:change.rollNo??student.rollNo,status:action==='Promote'?'Promoted':'Repeated',promotionStatus:action,enrollmentStartedOn:`${target}-06-01`};
  snapshot=academicSnapshot(student,results,attendance,action,day);
 }else if(action==='Set Initial Academic Year'){
  if(student.academicYear)throw Error('An academic year already exists. Use year-end processing.');
  if(yearStart(change.academicYear)===null)throw Error('Use a valid academic year, for example 2026-27.');
  next.academicYear=change.academicYear;
 }else if(action==='Academic Year Change'){
  if(!lifecycleActive(student))throw Error('Only enrolled students can change academic year.');
  const target=yearStart(change.academicYear);
  if(target===null)throw Error('Use a valid academic year, for example 2027-28.');
  if(target===yearStart(student.academicYear))throw Error('Choose a different academic year.');
  snapshot=academicSnapshot(student,results,attendance,action,day);
  next={...next,academicYear:change.academicYear,enrollmentStartedOn:`${target}-06-01`};
 }else if(action==='Class Transfer'){
  if(!lifecycleActive(student))throw Error('Only enrolled students can change class.');
  if(!/^(?:[1-9]|1[0-2])$/.test(change.className))throw Error('Choose standard 1–12.');
  snapshot=academicSnapshot(student,results,attendance,action,day);
  next={...next,className:change.className,division:change.division,rollNo:change.rollNo,enrollmentStartedOn:day};
 }else if(['Archive','Delete Student'].includes(action)){
  if(student.archivedAt)throw Error('Student is already archived.');next={...next,statusBeforeArchive:student.status||'Active',status:'Archived',archivedAt:date};
 }else if(action==='Restore'){
  if(!student.archivedAt)throw Error('Student is not archived.');next={...next,status:student.statusBeforeArchive||(student.status&&student.status!=='Archived'?student.status:'Active'),archivedAt:null};
 }else if(['School Left','Transferred','Passed Out','School Completed','TC/LC Issued'].includes(action)){
  if(['Passed Out','School Completed'].includes(action)&&Number(student.className)!==12)throw Error('School completion applies to standard 12.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(change.leavingDate||'')||!Number.isFinite(Date.parse(change.leavingDate))||new Date(change.leavingDate).toISOString().slice(0,10)!==change.leavingDate||change.leavingDate>day)throw Error('Choose a valid leaving date, no later than today.');
  if(change.lcIssueDate&&(!Number.isFinite(Date.parse(change.lcIssueDate))||new Date(change.lcIssueDate).toISOString().slice(0,10)!==change.lcIssueDate||change.lcIssueDate>day))throw Error('Invalid LC issue date.');
  if(action==='TC/LC Issued'&&(!change.lcNumber?.trim()||!change.lcIssueDate))throw Error('LC / TC number and issue date are required.');
  snapshot=academicSnapshot(student,results,attendance,action,day);
  next={...next,status:action==='School Completed'?'Passed Out':action,leavingDate:change.leavingDate,leavingReason:change.reason,lastClass:student.className,lastAttendanceDate:Object.keys(attendance).filter(d=>d<=change.leavingDate&&attendance[d][student.id]).sort().at(-1)||'',transferDestination:change.transferDestination||'',lcNumber:change.lcNumber||student.lcNumber||'',lcIssueDate:change.lcIssueDate||student.lcIssueDate||'',leavingRemarks:change.remarks||''};
 }else if(action==='Set Status'){
  if(!['Active','Long Absent','Suspended','Inactive'].includes(change.status))throw Error('Use the dedicated exit or archive action for this status.');
  if(student.archivedAt)throw Error('Restore archived records first.');next.status=change.status;
 }else throw Error('Unknown lifecycle action.');
 return {student:next,snapshot,movement:{id:crypto.randomUUID(),studentId:student.id,studentName:student.name,grNo:student.grNo,action,type:action,oldValue:enrollment(student),newValue:enrollment(next),reason:change.reason,details:change,actor,createdAt:date,date:day}};
}
export function absenceStats(student,attendance,asOf,yearFrom){
 const rows=Object.entries(attendance).filter(([day])=>day<=asOf&&day>=(yearFrom||'0000')).sort(([a],[b])=>b.localeCompare(a));
 let consecutive=0;for(const[,day]of rows){if(day[student.id]==='Absent')consecutive++;else break;}
 const absent=rows.filter(([,day])=>day[student.id]==='Absent');
 return {absentToday:attendance[asOf]?.[student.id]==='Absent',consecutive,month:absent.filter(([d])=>d.startsWith(asOf.slice(0,7))).length,year:absent.length,lastPresent:rows.find(([,d])=>['Present','Late','Half Day'].includes(d[student.id]))?.[0]||'',lastRecorded:rows.find(([,d])=>d[student.id])?.[0]||''};
}
export const longAbsenceText=(s,days,language='en')=>language==='mr'?`${s.student_name_mr||s.name} सलग ${days} नोंदवलेल्या शालेय दिवसांपासून अनुपस्थित आहे. कृपया शाळेशी संपर्क साधा.`:`${s.name} has been absent for ${days} consecutive recorded school days. Please contact the school.`;
