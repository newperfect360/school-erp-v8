import {useContext,useState} from 'react';
import {CommunicationSession} from '../backend/CommunicationSession';
import {useSharedRecords} from '../backend/useSharedRecords';
import {readStored,localDate} from '../storage';
import {staffStatuses,daySchedule} from '../services/attendanceAutomation';
import {configForAttendance} from '../services/attendanceAutomationStore';

export default function SharedStaffAttendance(){
 const session=useContext(CommunicationSession);
 const [records,save,connection]=useSharedRecords('teachers','erp_pro_staff_attendance_rows',{kind:'staff_attendance'});
 const [date,setDate]=useState(localDate()),[draft,setDraft]=useState({}),[reason,setReason]=useState(''),[message,setMessage]=useState(''),[month,setMonth]=useState(localDate().slice(0,7));
 const roster=[...readStored('erp_pro_teachers',[]),...readStored('erp_pro_staff',[])].filter(r=>!r.archivedAt&&r.status!=='Archived');
 const editable=['Super Admin','Admin','Headmaster'].includes(session?.role);
 const rowFor=staff=>records.find(r=>r.employeeId===staff.id&&r.date===date);
 const change=(id,key,value)=>setDraft({...draft,[id]:{...draft[id],[key]:value}});
 async function submit(){
  setMessage('');
  if(!editable)return setMessage('Management permission required.');
  if(!date||date>localDate()||daySchedule(date,configForAttendance()).closed)return setMessage('Choose a working school day, no later than today.');
  const updates=[];
  for(const employee of roster){const previous=rowFor(employee),next={...previous,...draft[employee.id]};
   if(!staffStatuses.includes(next.status)||next.status==='Late'&&!next.inTime)return setMessage('Mark every staff member and record late arrival time.');
   if(next.inTime&&next.outTime&&next.outTime<next.inTime)return setMessage('Out time must follow in time.');
   if(previous&&!draft[employee.id])continue;
   if(previous&&!reason.trim())return setMessage('A correction reason is required.');
   updates.push({...next,id:previous?.id||`staff_${date}_${employee.id}`,employeeId:employee.id,employeeName:employee.name,date,kind:'staff_attendance',recordedBy:session.uid,recordedAt:new Date().toISOString(),correctionReason:previous?reason.trim():'Initial submission'});
  }
  if(!updates.length)return setMessage('No changes to save.');
  if(await save([...records.filter(r=>!updates.some(u=>u.id===r.id)),...updates])){setDraft({});setReason('');setMessage('Staff attendance saved to Firestore with immutable version audit. No notification delivery has been claimed.');}
 }
 function exportMonth(){const rows=records.filter(r=>r.date.startsWith(month));const cells=[['Employee ID','Name','Date','Status','In','Out','Correction reason'],...rows.map(r=>[r.employeeId,r.employeeName,r.date,r.status,r.inTime,r.outTime,r.correctionReason])];const csv=cells.map(row=>row.map(v=>'"'+String(v||'').replace(/^[=+@-]/,"'").replaceAll('"','""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));a.download=`Staff-Attendance-${month}.csv`;a.click();URL.revokeObjectURL(a.href);}
 return <section className="school-panel workflow-panel"><h2>Staff Attendance</h2><label>Date<input type="date" value={date} onChange={e=>{setDate(e.target.value);setDraft({});setReason('');}}/></label><fieldset disabled={!editable||connection.busy}>{roster.map(employee=>{const row={...rowFor(employee),...draft[employee.id]};return <article key={employee.id}><h3>{employee.name}</h3><label>Status<select aria-label={`Staff status ${employee.name}`} value={row.status||''} onChange={e=>change(employee.id,'status',e.target.value)}><option value="">Not marked</option>{staffStatuses.map(s=><option key={s}>{s}</option>)}</select></label>{['inTime','outTime','remark'].map(key=><label key={key}>{key}<input type={key==='remark'?'text':'time'} value={row[key]||''} onChange={e=>change(employee.id,key,e.target.value)}/></label>)}</article>;})}<label>Correction reason<input value={reason} onChange={e=>setReason(e.target.value)}/></label><button onClick={submit} disabled={!roster.length}>Save staff attendance</button></fieldset><p role="status">{message||connection.status}</p><label>Report month<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label><button onClick={exportMonth}>Export monthly staff attendance</button></section>;
}
