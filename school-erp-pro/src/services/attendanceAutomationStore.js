import {sharedOperationalEnabled} from '../backend/sharedReadCache';
import { readStored, commitStoredBatch, localDate } from '../storage';
import { lifecycleActive } from './studentLifecycle';
import { yearForDate } from './academicYears';
import { automationKey, mergedAutomation, draftKey, draftId, submissionKey, classKey, studentStatuses, attendanceEvents, planMessages, daySchedule, attendanceStats } from './attendanceAutomation';
export const configForAttendance = () => mergedAutomation(readStored(automationKey, {}));
export function markedAbsent(student, date) {
  const draft = sharedOperationalEnabled ? null : readStored(draftKey, {})[draftId(student.academicYear, date, student.id)];
  return (draft?.status || readStored('erp_pro_attendance', {})[date]?.[student.id]) === 'Absent';
}
export function reviewAttendance(year, standard, division, date) {
  if (!year || !standard || !division || !date || date > localDate()) throw Error('Choose an academic year, class, division and a non-future date.');
  if (yearForDate(date) !== year) throw Error('Attendance date must belong to the selected academic year.');
  const students = readStored('erp_pro_students', []).filter(student => lifecycleActive(student) && student.academicYear === year && student.className === standard && (student.division || '') === division);
  if (!students.length) throw Error('No students in this class/year.');
  const config = configForAttendance(), drafts = readStored(draftKey, {}), attendance = readStored('erp_pro_attendance', {});
  if (daySchedule(date, config).closed) throw Error('This date is a holiday. Set an approved special timing override before submitting.');
  const statuses = [...studentStatuses, ...config.customStatuses, 'Leave','Half Day','Medical Leave','Sports Duty','Trip Duty'];
  const prior = readStored(submissionKey, []).find(item => item.groupKey === classKey(year, standard, division) && item.date === date);
  const rows = students.map(student => ({ ...student, ...prior?.rows.find(row => String(row.id) === String(student.id)), ...drafts[draftId(year, date, student.id)], status: drafts[draftId(year, date, student.id)]?.status || attendance[date]?.[student.id] || '' }));
  for (const row of rows) {
    if (!statuses.includes(row.status)) throw Error(`Mark attendance for ${row.name}.`);
    if (row.status === 'Late' && !row.arrivalTime) throw Error(`Record arrival time for ${row.name}.`);
    if (['Permission Leave','Early Leave'].includes(row.status) && !(row.outTime || row.arrivalTime)) throw Error(`Record out time for ${row.name}.`);
    if (['Permission Leave','Early Leave'].includes(row.status) && !row.reason?.trim()) throw Error(`Record the permission reason for ${row.name}.`);
  }
  const expected = Object.fromEntries(['erp_pro_students','erp_pro_attendance','erp_pro_attendance_years',draftKey,submissionKey,'erp_pro_message_jobs',automationKey,'schoolSettings'].map(key => [key, localStorage.getItem(key)]));
  return { year, standard, division, date, rows, expected, groupKey: classKey(year, standard, division), fingerprint: JSON.stringify(rows.map(compactRow)) };
}
const compactRow = row => Object.fromEntries(['id','status','arrivalTime','outTime','reason','remark'].map(key => [key,row[key] || '']));
export function finalizeAttendance(review, actor) {
  if (!actor) throw Error('Verified user required.');
  const current = reviewAttendance(review.year, review.standard, review.division, review.date);
  if (JSON.stringify(current.expected) !== JSON.stringify(review.expected) || current.fingerprint !== review.fingerprint) throw Error('Records changed after review. Review attendance again.');
  const config = configForAttendance(), attendance = readStored('erp_pro_attendance', {}), drafts = readStored(draftKey, {}), submissions = readStored(submissionKey, []), oldJobs = readStored('erp_pro_message_jobs', []);
  const previous = submissions.find(item => item.groupKey === review.groupKey && item.date === review.date);
  if (previous?.fingerprint === review.fingerprint) return { count: 0, repeated: true };
  if (previous) throw Error('This class/date was finalized already. A reviewed correction workflow is required; changing ticks must not send another event.');
  const jobs = planMessages(attendanceEvents(review.rows, review.year, review.date), review.rows, readStored('schoolSettings', {}), config, oldJobs, actor);
  const day = { ...attendance[review.date] };
  for (const row of review.rows) { day[row.id] = row.status; delete drafts[draftId(review.year, review.date, row.id)]; }
  commitStoredBatch({ 'erp_pro_attendance': { ...attendance, [review.date]: day }, [draftKey]: drafts,
    [submissionKey]: [...submissions, { id: crypto.randomUUID(), groupKey: review.groupKey, date: review.date, academicYear: review.year, rows: review.rows.map(compactRow), fingerprint: review.fingerprint, submittedBy: actor, submittedAt: new Date().toISOString(), dryRun: true }],
    erp_pro_message_jobs: jobs,
  }, review.expected);
  return { count: jobs.length - oldJobs.length, repeated: false };
}
export function prepareAutomationDue(now = new Date(), actor = 'scheduler-preview') {
  const config = configForAttendance(), date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`, time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`, schedule = daySchedule(date, config);
  const students = readStored('erp_pro_students', []).filter(lifecycleActive), attendance = readStored('erp_pro_attendance', {}), events = [];
  for (const student of students) {
    if (student.academicYear !== yearForDate(date)) continue;
    if (!schedule.closed && time >= schedule.end) events.push({ type: schedule.special ? 'Emergency School Closure' : schedule.saturday ? 'Saturday School Closed' : 'School Closed', studentId: student.id, key: `closing:${date}:${student.id}`, fields: { date,time:schedule.end,reason:schedule.reason } });
    if (schedule.closed && config.holidays[date]) events.push({ type: 'Holiday', studentId:student.id,key:`holiday:${date}:${student.id}`,fields:{date,reason:schedule.reason,reopen_date:schedule.reopenDate} });
    if ((student.dob || student.DOB || '').slice(5) === date.slice(5)) events.push({type:'Student Birthday',studentId:student.id,key:`birthday:${date}:${student.id}`,fields:{date}});
    const from = Object.keys(attendance).filter(day => day <= date && yearForDate(day) === student.academicYear && attendance[day]?.[student.id]).sort()[0];
    if (!from) continue;
    const stats = attendanceStats(student.id, attendance, from, date, config);
    if (!schedule.closed && stats.consecutive >= Number(config.consecutiveDays)) events.push({type:'Consecutive Absence Alert',studentId:student.id,key:`consecutive:${date}:${student.id}`,fields:{date,days:stats.consecutive}});
    if (stats.marked >= Number(config.minimumMarkedDays) && stats.percentage < Number(config.lowAttendancePercent)) events.push({type:'Attendance Percentage Warning',studentId:student.id,key:`low-attendance:${date}:${student.id}`,fields:{date,percentage:stats.percentage}});
  }
  for (const fee of readStored('erp_pro_fee_ledger',[])) if (!fee.voidedAt && Number(fee.total)>Number(fee.paid)) events.push({type:'Fee Due',studentId:fee.studentId,key:`fee-due:${date}:${fee.id}`,fields:{date,fee_type:fee.type,amount:(Number(fee.total)-Number(fee.paid)).toFixed(2)}});
  const staff = readStored('erp_pro_staff_attendance',{})[date];
  if (!schedule.closed && time >= config.staffSummaryTime && staff) {
    const count = status => staff.rows.filter(row=>row.status===status).length;
    events.push({type:'Staff Daily Summary',staff:true,key:`staff-summary:${date}`,fields:{date,total:staff.rows.length,present:count('Present'),absent:count('Absent'),late:count('Late'),leave:count('On Leave')+count('Half Day')+count('Early Leave'),duty:count('Official Duty')}});
  }
  const source = localStorage.getItem('erp_pro_message_jobs'), previous = readStored('erp_pro_message_jobs', []);
  const jobs = planMessages(events, students, readStored('schoolSettings', {}), config, previous, actor);
  if (jobs.length !== previous.length) commitStoredBatch({ erp_pro_message_jobs: jobs }, { erp_pro_message_jobs: source });
  return jobs.length - previous.length;
}
