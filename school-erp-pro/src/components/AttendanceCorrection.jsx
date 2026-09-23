import {useContext,useState} from 'react';
import {CommunicationSession} from '../backend/CommunicationSession';
import {readStored} from '../storage';
import {submissionKey,classKey,studentStatuses} from '../services/attendanceAutomation';
import {correctSubmittedAttendance} from '../services/attendanceCorrections';

export default function AttendanceCorrection({year,standard,division,date,onSaved}) {
 const actor=useContext(CommunicationSession),[snapshot,setSnapshot]=useState(null),[studentId,setStudentId]=useState(''),[form,setForm]=useState({}),[reason,setReason]=useState(''),[message,setMessage]=useState('');
 if(!['Super Admin','SUPER_ADMIN','Admin','ADMIN','Headmaster','HEADMASTER'].includes(actor?.role))return null;
 const current=readStored(submissionKey,[]).find(row=>row.date===date&&row.groupKey===classKey(year,standard,division));
 if(!current)return null;
 const students=readStored('erp_pro_students',[]);
 const select=(id,source=snapshot)=>{setStudentId(id);const row=source.rows.find(r=>r.id===id);setForm(Object.fromEntries(['status','arrivalTime','outTime','reason','remark'].map(k=>[k,row?.[k]||''])));setReason('');};
 return <section className="school-panel workflow-panel"><h3>Finalized attendance corrections</h3><p>Management corrections retain the original mark, user, time and reason. No message is sent automatically.</p><button onClick={()=>{setSnapshot(current);select(current.rows[0].id,current);setMessage('')}}>Correct finalized attendance</button>
 {snapshot&&<><label>Correction student<select value={studentId} onChange={e=>select(e.target.value)}>{snapshot.rows.map(row=><option key={row.id} value={row.id}>{students.find(s=>s.id===row.id)?.name||row.id}</option>)}</select></label><label>Corrected attendance status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{studentStatuses.map(s=><option key={s}>{s}</option>)}</select></label>{['arrivalTime','outTime','reason','remark'].map(key=><label key={key}>Correction {key}<input type={key.endsWith('Time')?'time':'text'} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<label>Attendance correction reason<input value={reason} onChange={e=>setReason(e.target.value)}/></label><button onClick={()=>{try{if(current.id!==snapshot.id)throw Error('Selection changed. Reopen the correction form.');correctSubmittedAttendance(snapshot,studentId,form,reason,actor);setSnapshot(null);setMessage('Correction saved with original mark and audit history.');onSaved();}catch(error){setMessage(error.message)}}}>Save attendance correction</button><button onClick={()=>setSnapshot(null)}>Cancel correction</button></>}
 <p role="status">{message}</p>{(current.revisions||[]).map((revision,index)=><p key={index}>{revision.at} · {revision.actor} · {revision.before.status} → {revision.after.status} · {revision.reason}</p>)}</section>;
}
