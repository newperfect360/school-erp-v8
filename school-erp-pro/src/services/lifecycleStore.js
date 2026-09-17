import {readStored,commitStoredBatch} from '../storage';
import {planMovement,lifecycleActive} from './studentLifecycle';
export const lifecycleKeys=['erp_pro_students','erp_pro_student_movements','erp_pro_academic_history','erp_pro_results','erp_pro_attendance'];
export const lifecycleSource=()=>Object.fromEntries(lifecycleKeys.map(k=>[k,localStorage.getItem(k)]));
export function previewMovements(ids,change){
 const source=lifecycleSource(),students=readStored('erp_pro_students',[]),results=readStored('erp_pro_results',[]),attendance=readStored('erp_pro_attendance',{});
 if(!ids.length)throw Error('Select at least one student.');
 const plans=[...new Set(ids)].map(id=>planMovement(students.find(s=>s.id===id),typeof change==='function'?change(id):change,{results,attendance}));
 const next=students.map(s=>plans.find(p=>p.student.id===s.id)?.student||s);
 const rolls=new Set();for(const s of next.filter(lifecycleActive)){if(!s.rollNo)continue;const key=[s.academicYear,s.className,s.division,String(s.rollNo).trim()].join('|');if(rolls.has(key)&&plans.some(p=>[p.student.academicYear,p.student.className,p.student.division,String(p.student.rollNo).trim()].join('|')===key))throw Error('Duplicate roll number in the destination year/class/division. Change roll numbers before confirming.');rolls.add(key);}
 return {source,plans,students:next};
}
export function commitMovements(preview){
 commitStoredBatch({erp_pro_students:preview.students,erp_pro_student_movements:[...readStored('erp_pro_student_movements',[]),...preview.plans.map(p=>p.movement)],erp_pro_academic_history:[...readStored('erp_pro_academic_history',[]),...preview.plans.filter(p=>p.snapshot).map(p=>({...p.snapshot,id:crypto.randomUUID()}))]},preview.source);
}
