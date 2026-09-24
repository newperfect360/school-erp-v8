import {useState} from 'react';
import {readStored} from '../storage';
import {currentAcademicYear,normalizeYear} from '../services/academicYears';

export default function ClassDivisionSettings({rows,onSave}) {
 const blank=()=>({className:'',division:'',academicYear:currentAcademicYear()});
 const [form,setForm]=useState(blank),[query,setQuery]=useState(''),[message,setMessage]=useState('');
 const referenced=row=>readStored('erp_pro_students',[]).some(s=>s.className===row.className&&s.division===row.division&&s.academicYear===row.academicYear);
 const save=async()=>{
  const next={...form,className:form.className.trim(),division:form.division.trim().toUpperCase(),academicYear:normalizeYear(form.academicYear)};
  if(!/^(?:[1-9]|1[0-2])$/.test(next.className)||!next.division||next.division.length>20||!next.academicYear)return setMessage('Enter class 1-12, division and a valid academic year.');
  if(rows.some(r=>r.id!==next.id&&!r.archivedAt&&r.className===next.className&&r.division===next.division&&r.academicYear===next.academicYear))return setMessage('This class/division already exists for the year.');
  const previous=rows.find(r=>r.id===next.id);
  if(previous&&referenced(previous)&&['className','division','academicYear'].some(k=>previous[k]!==next[k]))return setMessage('Students use this class/division. Use the reviewed student class/year change first.');
  next.id ||= crypto.randomUUID();
  if(await onSave(form.id?rows.map(r=>r.id===form.id?{...r,...next}:r):[...rows,next])){setForm(blank());setMessage('Class/division saved. Student records were not changed.');}
 };
 return <section className="school-panel workflow-panel"><h2>Class / Division Master</h2><div className="form-grid">{[['className','Master class'],['division','Master division'],['academicYear','Master academic year']].map(([key,label])=><label key={key}>{label}<input value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}</div><button onClick={save}>Save class / division</button>{form.id&&<button onClick={()=>setForm(blank())}>Cancel class edit</button>}<label>Search classes / divisions<input value={query} onChange={e=>setQuery(e.target.value)}/></label>{rows.filter(r=>!r.archivedAt&&[r.className,r.division,r.academicYear].join(' ').toLowerCase().includes(query.toLowerCase())).map(row=><article key={row.id}><p>{row.className} / {row.division} / {row.academicYear}</p><button onClick={()=>{setForm({...row});setMessage('')}}>Edit class / division</button><button onClick={async()=>{if(referenced(row))return setMessage('Students still use this class/division. No records were removed.');if(window.confirm('Archive this class/division configuration?')){if(onSave(rows.map(r=>r.id===row.id?{...r,archivedAt:new Date().toISOString()}:r))){setForm(blank());setMessage('Class/division archived.');}}}}>Archive class / division</button></article>)}<p role="status">{message}</p></section>;
}
