export const messageTemplates={
 Present:['[Student Name] is present in school today on [Date].','[Student Name] आज [Date] रोजी शाळेत उपस्थित आहे.'],
 Absent:['Your child [Student Name], Class [Class], is absent today on [Date]. Please contact the school if required.','आपला पाल्य [Student Name], इयत्ता [Class], आज [Date] रोजी अनुपस्थित आहे. आवश्यक असल्यास शाळेशी संपर्क साधा.'],
 Late:['[Student Name] was marked late on [Date].','[Student Name] यांची [Date] रोजी उशिरा उपस्थिती नोंद झाली आहे.'],
 'School Closed':['School has closed and dispersal has started on [Date]. This is not confirmation of individual student checkout.','[Date] रोजी शाळा सुटली असून विद्यार्थ्यांना सोडण्याची प्रक्रिया सुरू झाली आहे. ही वैयक्तिक निर्गमनाची पुष्टी नाही.'],
 'Student Checkout':['[Student Name] has checked out from school at [Time] on [Date]. Recorded mode: [Mode].','[Student Name] यांचे [Date] रोजी [Time] वाजता शाळेतून निर्गमन नोंदवले. प्रकार: [Mode].'],
 Homework:['Homework for [Class]: [Details]. Due: [Due Date].','इयत्ता [Class] साठी गृहपाठ: [Details]. अंतिम दिनांक: [Due Date].'],
 Exam:['School examination notice for [Student Name]: [Details].','[Student Name] साठी परीक्षा सूचना: [Details].'],
 Result:['Result for [Exam] is now available for [Student Name]. Contact the school through approved access.','[Student Name] यांचा [Exam] निकाल उपलब्ध आहे. अधिकृत माध्यमातून शाळेशी संपर्क साधा.'],
 'Fee Receipt':['Fee payment of ₹[Amount] received for [Student Name]. Receipt No: [Receipt].','[Student Name] यांचे ₹[Amount] शुल्क प्राप्त झाले. पावती क्रमांक: [Receipt].'],
 'Fee Reminder':['Fee reminder for [Student Name]: ₹[Amount] is pending. Please contact the school office.','[Student Name] यांचे ₹[Amount] शुल्क बाकी आहे. शालेय कार्यालयाशी संपर्क साधा.'],
 'Library Issue':['[Student Name] has borrowed [Book]. Due date: [Due Date].','[Student Name] यांनी [Book] पुस्तक घेतले आहे. परताव्याचा दिनांक: [Due Date].'],
 'Library Return':['[Book] borrowed by [Student Name] has been returned.','[Student Name] यांनी घेतलेले [Book] पुस्तक परत मिळाले.'],
 'Library Due':['Reminder: [Book] borrowed by [Student Name] was due on [Due Date].','स्मरणपत्र: [Student Name] यांचे [Book] पुस्तक [Due Date] रोजी परत देणे अपेक्षित होते.'],
 Sports:['Sports update for [Student Name]: [Details].','[Student Name] साठी क्रीडा माहिती: [Details].'],
 Scholarship:['Scholarship update for [Student Name]: [Details].','[Student Name] साठी शिष्यवृत्ती माहिती: [Details].'],
 Trip:['Educational trip update: [Details].','शैक्षणिक सहल माहिती: [Details].'],
 'Parent Meeting':['Parent meeting for [Student Name] on [Date] at [Time]. [Details].','[Student Name] साठी पालक भेट [Date] रोजी [Time] वाजता. [Details].'],
 Notice:['School notice: [Details].','शालेय सूचना: [Details].'],
};
export const defaultChannels=[['push','App Notification',false],['whatsappApi','WhatsApp API',false],['smsApi','SMS API',false],['whatsapp','Device WhatsApp Share',true],['sms','Device SMS',true],['call','Manual Call',true],['audio','Audio Message',true]].map(([id,label,enabled])=>({id,label,enabled}));
export const defaultWorkflow={closingTime:'12:30',language:'en',enabled:{},channels:defaultChannels,templates:{}};
export function renderMessage(type,student,details={},settings=defaultWorkflow){const language=settings.language==='mr'?'mr':'en',custom=settings.templates?.[type]?.[language];const template=custom||messageTemplates[type]?.[language==='mr'?1:0]||'[Details]';const fields={'Student Name':language==='mr'?(student.student_name_mr||student.name):student.name,Class:[student.className,student.division].filter(Boolean).join('/'),...details};return template.replace(/\[([^\]]+)\]/g,(_,key)=>String(fields[key]??''));}
export function selectFallback(settings){const channels=(settings.channels||defaultChannels).filter(c=>c.enabled);const automatic=channels.find(c=>['push','whatsappApi','smsApi'].includes(c.id));const device=channels.find(c=>['whatsapp','sms','audio'].includes(c.id));return{channel:device?.id||null,reason:automatic?'Provider not configured. Manual device fallback requires your review.':device?'Manual device action required.':'No messaging channel enabled. Manual calls remain individual.'};}
export function dailyEvents({students,attendance,loans=[],fees=[],meetings=[],date,time,settings}){const events=[];
 for(const s of students){const status=attendance[s.id];if(['Present','Absent','Late'].includes(status)&&settings.enabled?.[status])events.push({type:status,studentId:s.id,key:`attendance:${date}:${s.id}:${status}`,details:{Date:date}})}
 if(settings.enabled?.['School Closed']&&time>=settings.closingTime){for(const s of students)if(attendance[s.id]==='Present')events.push({type:'School Closed',studentId:s.id,key:`closing:${date}:${s.id}`,details:{Date:date}})}
 if(settings.enabled?.['Library Due'])for(const l of loans)if(!l.returned&&l.dueDate&&l.dueDate<date)events.push({type:'Library Due',studentId:l.studentId,key:`library-due:${date}:${l.id}`,details:{Book:l.bookName||l.bookId,'Due Date':l.dueDate}});
 if(settings.enabled?.['Fee Reminder'])for(const f of fees)if(!f.voidedAt&&Number(f.total)>Number(f.paid))events.push({type:'Fee Reminder',studentId:f.studentId,key:`fee-due:${date}:${f.id}`,details:{Amount:(Number(f.total)-Number(f.paid)).toFixed(2)}});
 if(settings.enabled?.['Parent Meeting'])for(const m of meetings)if(m.date===date&&m.time>time&&['Scheduled','Rescheduled'].includes(m.attendance))events.push({type:'Parent Meeting',studentId:m.studentId,key:`meeting:${date}:${m.id}`,details:{Date:m.date,Time:m.time,Details:m.purpose}});
 return events;
}
