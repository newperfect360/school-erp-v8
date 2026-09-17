import {readStored,writeStored,localDate} from '../storage';
import {absenceStats,lifecycleActive,longAbsenceText,yearStart} from './studentLifecycle';
export function prepareLongAbsenceAlerts(date=localDate()){
 const settings=readStored('erp_pro_long_absence_settings',{enabled:false});if(!settings.enabled||(!settings.parent&&!settings.staff))return 0;
 const thresholds=String(settings.thresholds||'1,3,5,7').split(',').map(Number).filter(n=>Number.isInteger(n)&&n>0&&n<=366),attendance=readStored('erp_pro_attendance',{}),alerts=readStored('erp_pro_long_absence_alerts',[]),next=[...alerts];
 for(const s of readStored('erp_pro_students',[]).filter(lifecycleActive)){
  const start=yearStart(s.academicYear),stats=absenceStats(s,attendance,date,start?`${start}-06-01`:`${date.slice(0,4)}-01-01`);
  // Alert only on an explicitly marked absent date; an old streak is not evidence of absence today.
  if(!stats.absentToday)continue;
  for(const days of thresholds.filter(n=>stats.consecutive>=n)){const key=`${s.id}:${stats.lastRecorded}:${days}`;if(next.some(a=>a.key===key))continue;next.push({id:crypto.randomUUID(),key,studentId:s.id,date,days:stats.consecutive,threshold:days,parent:!!settings.parent,staff:settings.staff?(days>=7?'Headmaster / Admin':days>=5?'Teacher':'Class Teacher'):'',message:longAbsenceText(s,stats.consecutive,settings.language),audio:settings.audio||null,status:'Prepared',createdAt:new Date().toISOString(),actor:'local-review'});}
 }
 if(next.length!==alerts.length&&!writeStored('erp_pro_long_absence_alerts',next))throw Error('Absence alerts could not be saved.');return next.length-alerts.length;
}
