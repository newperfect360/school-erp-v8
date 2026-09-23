import test from 'node:test';
import assert from 'node:assert/strict';
import {reviseFee} from '../src/services/feeLedger.js';
const rows=[{id:'TEST-fee',studentId:'TEST-student',type:'Tuition',date:'2026-09-23',receipt:'TEST-R1',total:100,paid:80}];
const time='2026-09-23T06:00:00.000Z';
test('correction keeps student ID, old amount, reason and actor without mutating source',()=>{
 const result=reviseFee(rows,'TEST-fee',{paid:70},'TEST correction','TEST-user',time);
 assert.equal(result[0].studentId,rows[0].studentId);assert.equal(rows[0].paid,80);assert.equal(result[0].revisions[0].before.paid,80);assert.equal(result[0].revisions[0].actor,'TEST-user');
});
test('invalid money, duplicate receipts and student reassignment rejected',()=>{
 for(const patch of [{paid:101},{paid:-1},{paid:NaN},{paid:0.001},{studentId:'another'}])assert.throws(()=>reviseFee(rows,'TEST-fee',patch,'TEST reason','TEST-user',time));
 assert.throws(()=>reviseFee([...rows,{id:'TEST-other',receipt:'TAKEN'}],'TEST-fee',{receipt:'taken'},'TEST reason','TEST-user',time));
 assert.throws(()=>reviseFee(rows,'TEST-fee',{paid:70},'','TEST-user',time));
});
test('void retains the receipt and prevents further editing',()=>{
 const result=reviseFee(rows,'TEST-fee',{voidedAt:time},'TEST void','TEST-user',time);
 assert.equal(result.length,1);assert.equal(result[0].revisions[0].action,'Void');assert.equal(result[0].paid,80);
 assert.throws(()=>reviseFee(result,'TEST-fee',{paid:70},'TEST reason','TEST-user',time));
});
test('local calendar date accepted even while UTC is previous day',()=>{
 const now=new Date(2026,8,23,0,5);assert.doesNotThrow(()=>reviseFee(rows,'TEST-fee',{paid:70},'TEST midnight','TEST-user',now.toISOString()));
});
