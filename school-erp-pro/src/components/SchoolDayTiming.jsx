import {daySchedule} from '../services/attendanceAutomation';
import {configForAttendance} from '../services/attendanceAutomationStore';
import {useLanguage} from '../design/language';

export default function SchoolDayTiming({date}) {
  const {t}=useLanguage();
  if(!date)return null;
  let schedule;
  try { schedule=daySchedule(date,configForAttendance()); } catch { return <p role="alert">{t('Choose a valid date.','वैध दिनांक निवडा.')}</p>; }
  return <section className="school-panel workflow-panel" aria-label="Selected school day timing">
    <h3>{t('School timing','शाळेची वेळ')} · {date}</h3>
    {schedule.closed ? <p>{t('Holiday — attendance cannot be finalized. No school-closing notification will be prepared.','सुट्टी — उपस्थिती अंतिम करता येणार नाही. शाळा सुटल्याची सूचना तयार होणार नाही.')} {schedule.reason}</p> : <>
      <p>{t('School start','शाळा सुरू')}: <strong>{schedule.start}</strong> · {t('School end','शाळा सुटण्याची वेळ')}: <strong>{schedule.end}</strong></p>
      <p>{t('Attendance cutoff','उपस्थिती नोंदीची अंतिम वेळ')}: <strong>{schedule.attendanceCutoff}</strong> · {t('Late-mark cutoff','उशिरा येण्याची वेळ मर्यादा')}: <strong>{schedule.lateCutoff}</strong></p>
      {schedule.special&&<p>{schedule.kind||t('Special timing','विशेष वेळ')} · {schedule.reason}</p>}
      <p>{t('Review actual arrival times before marking Late. Cutoffs do not automatically mark unrecorded students absent or send messages.','उशिराची नोंद करण्यापूर्वी प्रत्यक्ष आगमन वेळ तपासा. वेळ मर्यादेमुळे नोंद नसलेले विद्यार्थी आपोआप अनुपस्थित होत नाहीत किंवा संदेश पाठवले जात नाहीत.')}</p>
    </>}
  </section>;
}
