import {useState} from 'react';
import {lifecycleActive} from '../services/studentLifecycle';
import {yearForDate} from '../services/academicYears';
import {localDate} from '../storage';
import {studentStatuses} from '../services/attendanceAutomation';

export default function SharedAttendanceReview({students,records,save,year,standard,division,date,busy}){
 const [review,setReview]=useState(null),[message,setMessage]=useState('');
 const selected=students.filter(s=>lifecycleActive(s)&&s.academicYear===year&&s.className===standard&&s.division===division);
 const rows=records.filter(r=>r.date===date&&r.academicYear===year&&selected.some(s=>s.id===r.studentId));
 const prepare=()=>{
  if(!date||date>localDate()||yearForDate(date)!==year)return setMessage('Choose a non-future date within the academic year.');
  if(!standard||!division||!selected.length)return setMessage('Choose an enrolled class and division.');
  if(rows.length!==selected.length||rows.some(r=>!studentStatuses.includes(r.status)))return setMessage('Mark every student before final submission.');
  if(rows.some(r=>r.status==='Late'&&!r.arrivalTime||['Permission Leave','Early Leave'].includes(r.status)&&(!r.outTime||!r.reason?.trim())))return setMessage('Complete late arrival and permission details before submitting.');
  setReview({fingerprint:JSON.stringify(rows),rows,year,standard,division,date});setMessage('');
 };
 const submit=async()=>{
  if(!review||review.fingerprint!==JSON.stringify(rows)||review.date!==date||review.year!==year||review.standard!==standard||review.division!==division)return setMessage('Attendance changed. Review again.');
  const ids=new Set(rows.map(r=>r.id));
  const at=new Date().toISOString();
  if(await save(records.map(r=>ids.has(r.id)?{...r,submittedAt:r.submittedAt||at}:r))){setReview(null);setMessage('Shared attendance finalized. Automatic message delivery requires a configured provider.');}
 };
 return <section className="school-panel workflow-panel"><h3>Review shared attendance</h3><p>Each mark is saved to the shared school database. Review the complete class before final submission.</p><button disabled={busy} onClick={prepare}>Review attendance</button>{review&&<><ul>{review.rows.map(r=><li key={r.id}>{students.find(s=>s.id===r.studentId)?.name} · {r.status}</li>)}</ul><button disabled={busy} onClick={submit}>Final Submit attendance</button></>}<p role="status">{message}</p></section>;
}
