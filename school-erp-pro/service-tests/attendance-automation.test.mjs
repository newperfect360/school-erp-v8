import test from 'node:test';
import assert from 'node:assert/strict';
import {automationTemplates,mergedAutomation,validateAutomation,daySchedule,classKey,planMessages,messageFor,attendanceEvents,attendanceStats,retryDryRun} from '../src/services/attendanceAutomation.js';
const student={id:'one',name:'Trial Student',className:'8',division:'A',academicYear:'2026-27',fatherMobile:'9000000101',motherMobile:'9000000102',notificationLanguage:'both',notificationChannel:'both'};
const school={schoolName:'Test School'};
const config=()=>mergedAutomation({enabledClasses:[classKey('2026-27','8','A')],enabledEvents:Object.keys(automationTemplates)});
test('calendar: normal, Saturday, Sunday, holiday and special/exam override',()=>{
 const c=config();assert.equal(validateAutomation(c),true);
 assert.equal(daySchedule('2026-09-18',c).end,'12:30');assert.equal(daySchedule('2026-09-19',c).end,'11:00');assert.equal(daySchedule('2026-09-20',c).closed,true);
 c.holidays['2026-09-21']={reason:'Holiday',reopenDate:'2026-09-22'};assert.equal(daySchedule('2026-09-21',c).closed,true);
 c.overrides['2026-09-22']={...c.weekdays,end:'10:30',reason:'Special'};assert.equal(daySchedule('2026-09-22',c).end,'10:30');
 c.overrides['2026-09-20']={...c.weekdays,end:'10:30',reason:'Exam'};assert.equal(daySchedule('2026-09-20',c).closed,false);
 assert.throws(()=>validateAutomation({...c,weekdays:{...c.weekdays,end:'07:00'}}));
 assert.equal(mergedAutomation({dryRun:false}).dryRun,true);
 assert.throws(()=>validateAutomation({...config(),holidays:{'2026-02-30':{reason:'Invalid date',reopenDate:'2026-03-02'}}}));
 assert.throws(()=>validateAutomation({...config(),holidays:{'2026-02-27':{reason:'Invalid reopening',reopenDate:'2026-02-30'}}}));
 assert.throws(()=>validateAutomation({...config(),overrides:{'2026-02-30':{...c.weekdays,reason:'Invalid override'}}}));
 assert.equal(daySchedule('2026-09-21',{...config(),holidays:{'2026-09-21':{closed:false,reason:'Holiday',reopenDate:'2026-09-22'}}}).closed,true);
});
test('all 34 parent and 3 staff templates produce Unicode Marathi and English',()=>{
 assert.equal(Object.keys(automationTemplates).length,37);
 const fields={student_name:'Trial Student',school_name:'Test School',class:'8',division:'A',date:'2026-09-18',time:'08:15',reason:'Family reason',reopen_date:'2026-09-22',amount:'100',fee_type:'Tuition',receipt_no:'R-1',details:'School notice',due_date:'2026-09-23',days:3,percentage:60,staff_name:'Trial Teacher',designation:'Teacher',total:5,present:1,absent:1,late:1,leave:1,duty:1};
 for(const type of Object.keys(automationTemplates)){
  const mr=messageFor(type,fields,config(),'mr'),en=messageFor(type,fields,config(),'en');
  assert.doesNotMatch(mr,/\{[a-z_]+\}/,type);assert.doesNotMatch(en,/\{[a-z_]+\}/,type);
  if(type!=='General Notice')assert.match(mr,/[\u0900-\u097f]/,type);
  assert.ok(messageFor(type,fields,config(),'both').includes(en));
 }
 assert.doesNotMatch(messageFor('School Closed',fields,config(),'en'),/boarded|reached home/i);
});
test('final attendance events: scope, primary/secondary, languages, channels and deduplication',()=>{
 const c=config(),events=attendanceEvents([{...student,status:'Absent'}],'2026-27','2026-09-18');
 assert.equal(planMessages(events,[student],school,mergedAutomation()).length,0);
 const jobs=planMessages(events,[{...student,primaryNotificationContact:'mother',secondaryNotificationContact:'father'}],school,c,[],'teacher');
 assert.equal(jobs.length,4);assert.equal(jobs[0].parentMobile,'+919000000102');assert.ok(jobs.every(j=>j.status==='Queued'&&j.dryRun&&j.initiatedBy==='teacher'));
 assert.equal(planMessages(events,[student],school,c,jobs).length,4);
 assert.equal(planMessages(events,[{...student,motherMobile:student.fatherMobile,secondaryNotificationContact:'mother'}],school,c).length,2);
 assert.equal(planMessages(events,[{...student,className:'9'}],school,c).length,0);
 const changed=attendanceEvents([{...student,status:'Present'}],'2026-27','2026-09-18');assert.equal(planMessages(changed,[student],school,c,jobs).length,4);
});
test('missing contact/fields are failed validations; bounded retries never send',()=>{
 const c=config(),s={...student,fatherMobile:'',motherMobile:'',notificationChannel:'sms'};
 const event=attendanceEvents([{...s,status:'Late'}],'2026-27','2026-09-18');
 let job=planMessages(event,[s],school,c)[0];assert.equal(job.status,'Failed');assert.equal(job.dryRun,true);
 job=retryDryRun(job,[student],school,c);assert.equal(job.status,'Failed');assert.equal(job.attempts,1);
 c.templates.Late={en:'Late arrival for {student_name}',mr:'उशिरा आगमन {student_name}'};
 job=retryDryRun(job,[student],school,c);assert.equal(job.status,'Queued');assert.equal(job.attempts,2);assert.ok(job.dryRun);assert.throws(()=>retryDryRun(job,[student],school,c));
 let failed=planMessages(event,[s],school,config())[0];for(let i=0;i<3;i++)failed=retryDryRun(failed,[s],school,config());assert.throws(()=>retryDryRun(failed,[s],school,config()));
});
test('consecutive absence skips holidays and unmarked days are not assumed absent',()=>{
 const c=config();c.holidays['2026-09-19']={reason:'School holiday',reopenDate:'2026-09-21'};
 const records={'2026-09-18':{one:'Absent'},'2026-09-21':{one:'Absent'},'2026-09-22':{one:'Late'}};
 const a=attendanceStats('one',records,'2026-09-18','2026-09-21',c);assert.equal(a.consecutive,2);assert.equal(a.working,2);assert.equal(a.percentage,0);
 const b=attendanceStats('one',records,'2026-09-18','2026-09-23',c);assert.equal(b.unmarked,1);assert.equal(b.marked,3);assert.equal(b.percentage,33.33);assert.equal(b.consecutive,0);
});
test('staff recipients are opt-in, use separate WhatsApp numbers and deduplicate shared numbers',()=>{
 const c=config();c.managementRecipients=[{id:'head',name:'Head',enabled:true,absence:true,late:false,summary:true,mobile:'9000000101',whatsapp:'9000000102',channel:'both'},{id:'off',enabled:false,absence:true,mobile:'9000000201'}];
 const event={type:'Staff Absent',staff:true,staffId:'t1',key:'staff:date:t1',fields:{staff_name:'Teacher',designation:'Teacher',date:'2026-09-18'}};
 const jobs=planMessages([event],[],school,c);assert.equal(jobs.length,2);assert.equal(jobs[1].parentMobile,'+919000000102');assert.equal(planMessages([{...event,type:'Staff Late'}],[],school,c).length,0);
});
