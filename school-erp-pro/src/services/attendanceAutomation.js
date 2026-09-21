import { normalizeParentMobile, parentContacts } from './absenceCommunication.js';

export const automationKey = 'erp_pro_attendance_automation';
export const draftKey = 'erp_pro_attendance_drafts';
export const submissionKey = 'erp_pro_attendance_submissions';
export const studentStatuses = ['Present','Absent','Late','Permission Leave','Approved Leave','Sick Leave','Early Leave','Official Duty'];
export const staffStatuses = ['Present','Absent','Late','On Leave','Half Day','Official Duty','Early Leave'];
export const defaultTiming = { start: '07:30', end: '12:30', attendanceCutoff: '08:00', lateCutoff: '07:40' };
export const automationDefaults = { dryRun: true, enabledClasses: [], language: 'mr', weeklyHolidays: [0],
  weekdays: defaultTiming, saturday: { ...defaultTiming, end: '11:00' }, overrides: {}, holidays: {},
  templates: {}, enabledEvents: ['Absent','Late','Permission Leave','Early Leave'], customStatuses: [],
  consecutiveDays: 2, lowAttendancePercent: 75, minimumMarkedDays: 3, maxRetries: 3, staffSummaryTime: '12:45', managementRecipients: [],
};
const parent = (en, mr) => [`Dear Parent,\n${en}\n– {school_name}`, `आदरणीय पालक,\n${mr}\n– {school_name}`];
export const automationTemplates = {
  Present: parent('Your child {student_name} has been marked present at school today, {date}.','आपला पाल्य {student_name} आज दिनांक {date} रोजी शाळेत उपस्थित झाला/झाली आहे.'),
  Absent: parent('Your child {student_name}, Class {class}-{division}, is absent from school today, {date}. Kindly inform the school of the reason for absence.','आपला पाल्य {student_name} इयत्ता {class}-{division} आज दिनांक {date} रोजी शाळेत अनुपस्थित आहे. कृपया अनुपस्थितीचे कारण शाळेला कळवावे.'),
  Late: parent('Your child {student_name} arrived late at school today, {date}, at {time}.','आपला पाल्य {student_name} आज दिनांक {date} रोजी {time} वाजता शाळेत उशिरा उपस्थित झाला/झाली आहे.'),
  'Approved Leave': parent('Approved leave has been recorded for {student_name} on {date}.','{student_name} यांची दिनांक {date} रोजी मंजूर रजा नोंदविण्यात आली आहे.'),
  'Sick Leave': parent('Sick leave has been recorded for {student_name} on {date}.','{student_name} यांची दिनांक {date} रोजी आजारपणाची रजा नोंदविण्यात आली आहे.'),
  'Permission Leave': parent('Permission leave has been recorded for {student_name} on {date}. Reason: {reason}.','{student_name} यांची दिनांक {date} रोजी परवानगीची रजा नोंदविण्यात आली आहे. कारण: {reason}.'),
  'Early Leave': parent('Your child {student_name} has been permitted to leave school at {time} on {date} due to {reason}.','आपला पाल्य {student_name} यास आज दिनांक {date} रोजी {time} वाजता {reason} या कारणास्तव शाळेतून जाण्याची परवानगी देण्यात आली आहे.'),
  'Written Application Leave': parent('Your child {student_name} submitted a written application and was granted permission to leave school on {date}.','आपल्या पाल्याने {student_name} दिनांक {date} रोजी लेखी अर्ज सादर करून शाळेतून जाण्याची परवानगी घेतली आहे.'),
  'School Closed': parent("School has closed for the day. Kindly ensure your child's safe journey home.",'आजची शाळा सुटली आहे. आपल्या पाल्याच्या सुरक्षित घरी पोहोचण्याबाबत कृपया आवश्यक ती काळजी घ्यावी.'),
  Holiday: parent('The school will remain closed on {date} due to {reason}. School will reopen on {reopen_date} at the regular time.','दिनांक {date} रोजी {reason} निमित्त शाळेला सुट्टी राहील. शाळा दिनांक {reopen_date} रोजी नियमित वेळेत सुरू होईल.'),
  'Emergency School Closure': parent('School closes at {time} on {date} due to {reason}. Please make appropriate arrangements.','दिनांक {date} रोजी {reason} या कारणास्तव शाळा {time} वाजता सुटेल. कृपया आवश्यक व्यवस्था करावी.'),
  'Fee Received': parent('We have received ₹{amount} towards {fee_type} for your child on {date}. Receipt No. {receipt_no}.','आपल्या पाल्याची {fee_type} शुल्क रक्कम ₹{amount} दिनांक {date} रोजी प्राप्त झाली आहे. पावती क्र. {receipt_no}.'),
  'Fee Due': parent('An amount of ₹{amount} towards {fee_type} is pending for your child. Kindly pay the amount within the scheduled period.','आपल्या पाल्याची ₹{amount} इतकी {fee_type} शुल्क रक्कम प्रलंबित आहे. कृपया नियोजित मुदतीत शुल्क जमा करावे.'),
  'Homework Assigned': parent('Homework for {student_name}: {details}. Due: {due_date}.','{student_name} यांचा गृहपाठ: {details}. पूर्ण करण्याची तारीख: {due_date}.'),
  'Homework Pending': parent('Homework is pending for {student_name}: {details}.','{student_name} यांचा गृहपाठ अपूर्ण आहे: {details}.'),
  'Exam Notice': parent('Examination notice: {details}. Date: {date}.','परीक्षेची सूचना: {details}. दिनांक: {date}.'),
  'Exam Reminder': parent('Examination reminder for {student_name}: {details}. Date: {date}.','{student_name} यांना परीक्षेची आठवण: {details}. दिनांक: {date}.'),
  'Result Published': parent('The result for {student_name} is available. {details}','{student_name} यांचा निकाल उपलब्ध आहे. {details}'),
  'Parent Meeting': parent('Parent meeting on {date} at {time}. {details}','दिनांक {date} रोजी {time} वाजता पालक सभा आहे. {details}'),
  'Sports Practice': parent('Sports practice for {student_name}: {details}.','{student_name} यांचा क्रीडा सराव: {details}.'),
  'Sports Competition': parent('Sports competition information for {student_name}: {details}.','{student_name} यांच्यासाठी क्रीडा स्पर्धेची माहिती: {details}.'),
  'Educational Trip': parent('Educational trip information: {details}.','शैक्षणिक सहलीची माहिती: {details}.'),
  'Trip Departure': parent('The school has confirmed this trip departure update: {details}.','शाळेने सहल प्रस्थानाबाबत ही माहिती नोंदविली आहे: {details}.'),
  'Trip Update': parent('Educational trip update: {details}.','शैक्षणिक सहलीची अद्ययावत माहिती: {details}.'),
  'Trip Return': parent('The school has confirmed this trip return update: {details}.','शाळेने सहलीच्या परतीबाबत ही माहिती नोंदविली आहे: {details}.'),
  'Certificate Ready': parent('The requested certificate for {student_name} is ready. {details}','{student_name} यांचे मागणी केलेले प्रमाणपत्र तयार आहे. {details}'),
  'Document Required': parent('Please submit the following documents for {student_name}: {details}.','{student_name} यांच्यासाठी पुढील कागदपत्रे सादर करावीत: {details}.'),
  'Student Achievement': parent('Congratulations to {student_name}: {details}.','{student_name} यांचे अभिनंदन: {details}.'),
  'General Notice': parent('{details}','{details}'),
  'Emergency Notice': parent('Urgent school notice: {details}.','शाळेची तातडीची सूचना: {details}.'),
  'Student Birthday': parent('Happy birthday to {student_name}. Best wishes from the school.','{student_name} यांना वाढदिवसाच्या हार्दिक शुभेच्छा. शाळेतर्फे उज्ज्वल भविष्यासाठी शुभेच्छा.'),
  'Consecutive Absence Alert': parent('{student_name} has been absent for {days} consecutive school days. Please contact the school.','{student_name} सलग {days} शालेय दिवस अनुपस्थित आहेत. कृपया शाळेशी संपर्क साधावा.'),
  'Attendance Percentage Warning': parent('Recorded attendance for {student_name} is {percentage}%. Please contact the school.','{student_name} यांची नोंदवलेली उपस्थिती {percentage}% आहे. कृपया शाळेशी संपर्क साधावा.'),
  'Staff Absent': ['Notice:\n{staff_name} ({designation}) has been marked absent on {date}.\n– {school_name}','सूचना:\n{staff_name} ({designation}) यांची दिनांक {date} रोजी अनुपस्थिती नोंदविण्यात आली आहे.\n– {school_name}'],
  'Staff Late': ['Notice:\n{staff_name} ({designation}) reported late today, {date}, at {time}.\n– {school_name}','सूचना:\n{staff_name} ({designation}) आज दिनांक {date} रोजी {time} वाजता उशिरा उपस्थित झाले आहेत.\n– {school_name}'],
  'Staff Daily Summary': ['Staff attendance {date}: Total {total}; Present {present}; Absent {absent}; Late {late}; Leave {leave}; Official Duty {duty}.\n– {school_name}','कर्मचारी उपस्थिती {date}: एकूण {total}; उपस्थित {present}; अनुपस्थित {absent}; उशिरा {late}; रजा {leave}; शासकीय कार्य {duty}.\n– {school_name}'],
};
automationTemplates['Saturday School Closed'] = [...automationTemplates['School Closed']];
export const classKey = (year, standard, division) => JSON.stringify([year, standard, division || '']);
export const draftId = (year, date, studentId) => JSON.stringify([year, date, String(studentId)]);
export function mergedAutomation(value = {}) { return structuredClone({ ...automationDefaults, ...value, dryRun: true, weekdays: { ...defaultTiming, ...value.weekdays }, saturday: { ...automationDefaults.saturday, ...value.saturday } }); }
const validTime = time => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time || '');
const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date || '') && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date;
export function validateAutomation(config) {
  for (const timing of [config.weekdays, config.saturday, ...Object.values(config.overrides)]) {
    if (![timing.start,timing.end,timing.attendanceCutoff,timing.lateCutoff].every(validTime) || timing.end <= timing.start || timing.lateCutoff < timing.start || timing.attendanceCutoff < timing.start || timing.lateCutoff > timing.end || timing.attendanceCutoff > timing.end) throw Error('Choose valid start/end/cutoff times within the school day.');
  }
  if (!validTime(config.staffSummaryTime) || !Number.isInteger(Number(config.consecutiveDays)) || config.consecutiveDays < 1 || config.consecutiveDays > 366 || config.lowAttendancePercent < 0 || config.lowAttendancePercent > 100 || config.maxRetries < 0 || config.maxRetries > 10) throw Error('Invalid alert threshold, retry limit or summary time.');
  if (!Array.isArray(config.enabledClasses) || !Array.isArray(config.weeklyHolidays) || config.weeklyHolidays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw Error('Invalid class or holiday configuration.');
  if (!Number.isInteger(Number(config.maxRetries)) || !Number.isFinite(Number(config.lowAttendancePercent)) || !Number.isInteger(Number(config.minimumMarkedDays)) || config.minimumMarkedDays < 1) throw Error('Invalid retry limit or minimum marked days.');
  if (!Array.isArray(config.customStatuses) || config.customStatuses.some(status => typeof status !== 'string' || !status.trim())) throw Error('Custom statuses must have names.');
  for (const [date, timing] of Object.entries(config.overrides)) if (!validDate(date) || !timing.reason?.trim()) throw Error('Each special/exam timing needs a valid date and reason.');
  for (const [date, holiday] of Object.entries(config.holidays)) if (!validDate(date) || !holiday.reason?.trim() || !validDate(holiday.reopenDate) || holiday.reopenDate <= date) throw Error('Each holiday needs a valid date, reason and later valid reopening date.');
  return true;
}
export function daySchedule(date, config) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date) throw Error('Invalid date.');
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (config.holidays[date]) return { ...config.holidays[date], closed: true };
  if (config.overrides[date]) return { ...config.overrides[date], closed: false, special: true };
  return { ...(weekday === 6 ? config.saturday : config.weekdays), closed: config.weeklyHolidays.includes(weekday), saturday: weekday === 6 };
}
export function messageFor(type, fields, config, language) {
  const templates = config.templates[type] || {}, pair = automationTemplates[type];
  if (!pair && !templates.en && !templates.mr) throw Error(`Unknown template: ${type}`);
  const render = lang => String(templates[lang] ?? pair?.[lang === 'mr' ? 1 : 0] ?? '').replace(/\{([a-z_]+)\}/g, (token, key) => fields[key] === undefined || fields[key] === '' ? token : String(fields[key]));
  return language === 'both' ? `${render('mr')}\n\n${render('en')}` : render(language === 'mr' ? 'mr' : 'en');
}
export function planMessages(events, students, school, config, previous = [], actor = '') {
  const jobs = [...previous], ids = new Set(previous.map(job => job.key));
  for (const event of events) {
    if (!config.enabledEvents.includes(event.type)) continue;
    // An event's recipients are frozen when first prepared; changed preferences
    // must not cause the scheduler to prepare the same event again.
    if (previous.some(job=>job.eventKey===event.key)) continue;
    const student = students.find(row => String(row.id) === String(event.studentId));
    if (student && !config.enabledClasses.includes(classKey(student.academicYear, student.className, student.division))) continue;
    const recipients = event.staff ? config.managementRecipients.filter(row => row.enabled && (event.type === 'Staff Absent' ? row.absence : event.type === 'Staff Late' ? row.late : row.summary)) : student ? (() => {
      const contacts = parentContacts(student, student.primaryNotificationContact || 'father').filter(row => row.mobile);
      const primary = contacts.find(row => row.id === student.primaryNotificationContact) || contacts[0];
      const secondary = contacts.find(row => row.id === student.secondaryNotificationContact && row.mobile !== primary?.mobile);
      return (primary ? [primary,secondary].filter(Boolean) : [{id:'missing',name:'Parent contact missing',mobile:''}]).map(row => ({ ...row, language: student.notificationLanguage || config.language, channel: student.notificationChannel || config.templates[event.type]?.channel || 'sms' }));
    })() : [];
    for (const recipient of recipients) {
      const channels = recipient.channel === 'both' ? ['sms','whatsapp'] : [recipient.channel === 'whatsapp' ? 'whatsapp' : 'sms'];
      for (const channel of channels) {
        const mobile = normalizeParentMobile(channel === 'whatsapp' && recipient.whatsapp ? recipient.whatsapp : recipient.mobile);
        const key = JSON.stringify([event.key, mobile || recipient.id, channel]); if (ids.has(key)) continue;
        const fields = { school_name: school.schoolName, student_name: student?.name, class: student?.className, division: student?.division || '-', ...event.fields };
        const message = messageFor(event.type, fields, config, recipient.language || config.language);
        const missing = message.match(/\{[a-z_]+\}/g) || [];
        jobs.push({ id: crypto.randomUUID(), key, eventKey: event.key, type: event.type, sourceEvent:event, contactId:recipient.id, language:recipient.language||config.language, studentId: student?.id, staffId: event.staffId, studentName: student?.name || event.fields.staff_name || 'Staff summary', recipient: recipient.name, parentMobile: mobile, parentName: recipient.name, message, channel, status: mobile && !missing.length ? 'Queued' : 'Failed', dryRun: true, attempts: 0, failureReason: !mobile ? 'Valid recipient mobile required' : missing.length ? `Missing fields: ${missing.join(', ')}` : 'DRY RUN — not sent', initiatedBy: actor, initiatedAt: new Date().toISOString(), date: event.fields.date });
        ids.add(key);
      }
    }
  }
  return jobs;
}
export function retryDryRun(job,students,school,config) {
  if(!job.dryRun||job.status!=='Failed'||(job.attempts||0)>=config.maxRetries)throw Error('Job is not eligible for retry.');
  const student=students.find(s=>String(s.id)===String(job.studentId));
  const contact=job.sourceEvent.staff?config.managementRecipients.find(r=>r.id===job.contactId&&r.enabled):student&&parentContacts(student,student.primaryNotificationContact).find(c=>job.contactId==='missing'?!!c.mobile:c.id===job.contactId);
  const mobile=normalizeParentMobile(job.channel==='whatsapp'&&contact?.whatsapp?contact.whatsapp:contact?.mobile);
  const message=messageFor(job.type,{school_name:school.schoolName,student_name:student?.name,class:student?.className,division:student?.division||'-',...job.sourceEvent.fields},config,job.language);
  const missing=message.match(/\{[a-z_]+\}/g)||[];
  const scope=student?config.enabledClasses.includes(classKey(student.academicYear,student.className,student.division)):!!contact;
  const valid=scope&&config.enabledEvents.includes(job.type)&&mobile&&!missing.length;
  return {...job,parentMobile:mobile,recipient:contact?.name||job.recipient,message,attempts:(job.attempts||0)+1,lastAttemptAt:new Date().toISOString(),status:valid?'Queued':'Failed',failureReason:valid?'DRY RUN — not sent':!scope?'Recipient or trial scope disabled':!mobile?'Valid recipient mobile required':`Disabled event or missing fields: ${missing.join(', ')}`};
}
export function attendanceEvents(rows, year, date) {
  return rows.map(row => ({ type: row.status, studentId: row.id, key: `final-attendance:${year}:${date}:${row.id}`, fields: { date, time: row.status==='Late'?row.arrivalTime:row.outTime||row.arrivalTime, reason: row.reason } }));
}
export function attendanceStats(studentId, records, from, through, config) {
  const counts = { working: 0, present: 0, absent: 0, late: 0, leave: 0, unmarked: 0, consecutive: 0 };
  for (let date = from, guard = 0; date <= through && guard++ < 732; date = new Date(Date.parse(`${date}T12:00:00Z`) + 86400000).toISOString().slice(0,10)) {
    if (daySchedule(date, config).closed) continue;
    counts.working++; const status = records[date]?.[studentId];
    if (status === 'Absent') { counts.absent++; counts.consecutive++; } else { counts.consecutive = 0; if (status === 'Present' || status === 'Official Duty') counts.present++; else if (status === 'Late') counts.late++; else if (status) counts.leave++; else counts.unmarked++; }
  }
  const marked = counts.working - counts.unmarked;
  return { ...counts, marked, percentage: marked ? Math.round((counts.present + counts.late) / marked * 10000) / 100 : null };
}
