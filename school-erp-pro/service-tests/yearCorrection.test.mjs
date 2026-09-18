import test from 'node:test';
import assert from 'node:assert/strict';
import { planMovement } from '../src/services/studentLifecycle.js';

test('academic year correction freezes the previous year without promoting or moving linked evidence',()=>{
 const student={id:'stable-id',grNo:'GR99',name:'Review Student',className:'8',division:'A',rollNo:'7',academicYear:'2026-27',status:'Active'};
 const results=[{id:'marks',studentId:student.id,academicYear:'2026-27',obtainedMarks:40}];
 const attendance={'2026-09-17':{[student.id]:'Present'}};
 const before=JSON.stringify({student,results,attendance});
 const plan=planMovement(student,{action:'Academic Year Change',academicYear:'2027-28',reason:'Reviewed correction'},{results,attendance,date:'2026-09-17T12:00:00.000Z'});
 assert.equal(plan.student.id,student.id);assert.equal(plan.student.className,'8');assert.equal(plan.student.academicYear,'2027-28');assert.equal(plan.snapshot.academicYear,'2026-27');assert.deepEqual(plan.snapshot.results,results);assert.equal(plan.snapshot.attendance['2026-09-17'],'Present');assert.equal(JSON.stringify({student,results,attendance}),before);
 assert.throws(()=>planMovement(student,{action:'Academic Year Change',academicYear:'2026-27',reason:'Same year'}),/different/);
 assert.throws(()=>planMovement(student,{action:'Academic Year Change',academicYear:'2027-30',reason:'Invalid'}),/valid academic/);
 assert.throws(()=>planMovement({...student,status:'School Left'},{action:'Academic Year Change',academicYear:'2027-28',reason:'Invalid'}),/enrolled/);
});
