import {useSharedRecords} from '../backend/useSharedRecords';
import { useContext, useEffect, useState } from 'react';
import { CommunicationSession } from '../backend/CommunicationSession';
import { callOutcomes, communicationKeys, followupStatuses } from '../services/absenceCommunication';
import { commitStoredBatch, readStored } from '../storage';
import { notify } from './Feedback';

export default function CallFollowup({ student, date, callId, onSaved }) {
  const actor = useContext(CommunicationSession);
  const [sharedHistory,saveSharedHistory,connection]=useSharedRecords("communication_logs",communicationKeys.history);
  const [, refresh] = useState(0), [open, setOpen] = useState(false), [outcome, setOutcome] = useState(''), [remark, setRemark] = useState('');
  const [historyCallId, setHistoryCallId] = useState(null);
  useEffect(() => { const reload = () => refresh(value => value + 1); window.addEventListener('communication-history-changed', reload); return () => window.removeEventListener('communication-history-changed', reload); }, []);
  const events = (connection.shared?sharedHistory:readStored(communicationKeys.history, [])).map(row=>({...row,channel:String(row.channel||"").toLowerCase(),attendanceDate:row.attendanceDate||row.date,parentName:row.parentName||row.calledPerson,parentMobile:row.parentMobile||row.mobile,initiatedAt:row.initiatedAt||(row.date+"T"+(row.time||"00:00:00"))})).filter(row => String(row.studentId) === String(student.id));
  const call = events.find(row => row.id === (historyCallId || callId) && row.attendanceDate === date && row.channel === "call");
  const key = JSON.stringify([date, String(student.id)]);
  const followup = connection.shared ? events.filter(row=>row.attendanceDate===date&&row.followupStatus).sort((a,b)=>String(b.remarkedAt||b.initiatedAt).localeCompare(String(a.remarkedAt||a.initiatedAt))).map(row=>({status:row.followupStatus}))[0] : readStored(communicationKeys.followups, {})[key];
  const status = followup?.status || (events.some(row => row.attendanceDate === date && row.channel === 'call') ? 'Contact Attempted' : 'Not Contacted');
  const save = async () => {
    if (!actor?.uid || !call || !callOutcomes.includes(outcome)) return notify('Choose a call outcome. A signed-in user is required.');
    try {
      const historySource = localStorage.getItem(communicationKeys.history), followupSource = localStorage.getItem(communicationKeys.followups);
      const history = readStored(communicationKeys.history, []), followups = readStored(communicationKeys.followups, {});
      if (!history.some(row => row.id === call.id && row.studentId === call.studentId)) throw Error('Call record changed. Reopen history.');
      const nextStatus = outcome === 'Parent Contacted' ? 'Parent Contacted' : ['Medical Reason','Family Reason'].includes(outcome) ? 'Reason Confirmed' : ['No Answer','Busy','Switched Off'].includes(outcome) ? 'No Response' : 'Follow-up Required';
      if(connection.shared){
        if(!await saveSharedHistory(sharedHistory.map(row=>row.id===call.id?{...row,outcome,remark:remark.trim(),followupStatus:nextStatus,remarkedBy:actor.uid,remarkedAt:new Date().toISOString()}:row)))return;
      }else commitStoredBatch({
        [communicationKeys.history]: history.map(row => row.id === call.id ? { ...row, outcome, remark: remark.trim(), remarkedBy: actor.uid, remarkedAt: new Date().toISOString() } : row),
        [communicationKeys.followups]: { ...followups, [key]: { ...followups[key], status: nextStatus, response: remark.trim(), updatedBy: actor.uid, updatedAt: new Date().toISOString() } },
      }, { [communicationKeys.history]: historySource, [communicationKeys.followups]: followupSource });
      window.dispatchEvent(new Event('communication-history-changed')); setOpen(true); setOutcome(''); setRemark(''); setHistoryCallId(null); onSaved();
    } catch (error) { notify(error.message); }
  };
  const changeStatus = async value => {
    if (!actor?.uid || !followupStatuses.includes(value)) return;
    if(connection.shared){const id=student.id+'_'+date+'_followup';const old=sharedHistory.find(r=>r.id===id);const record={...old,id,studentId:student.id,channel:'followup',kind:'followup',attendanceDate:date,followupStatus:value,remarkedBy:actor.uid,remarkedAt:new Date().toISOString()};await saveSharedHistory(old?sharedHistory.map(r=>r.id===id?record:r):[...sharedHistory,record]);return;}
    try { const source = localStorage.getItem(communicationKeys.followups); commitStoredBatch({ [communicationKeys.followups]: { ...readStored(communicationKeys.followups, {}), [key]: { ...followup, status: value, updatedBy: actor.uid, updatedAt: new Date().toISOString() } } }, { [communicationKeys.followups]: source }); window.dispatchEvent(new Event('communication-history-changed')); } catch (error) { notify(error.message); }
  };
  return <div className="call-followup"><label>Follow-up status<select aria-label={`Contact status for ${student.name}`} value={status} onChange={event => changeStatus(event.target.value)}>{followupStatuses.map(value => <option key={value}>{value}</option>)}</select></label>
    <button onClick={() => setOpen(!open)}>Contact History</button>
    {call && <div className="call-outcome"><strong>Follow up: {call.parentName} · {call.parentMobile}</strong><p>Dialer requested; connection and duration are not verified.</p>
      <label>Call outcome<select aria-label="Call outcome" value={outcome} onChange={event => setOutcome(event.target.value)}><option value="">Select outcome</option>{callOutcomes.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Call remark<textarea aria-label="Call follow-up remark" maxLength={1000} value={remark} onChange={event => setRemark(event.target.value)}/></label><button onClick={save}>Save call follow-up</button>
    </div>}
    {open && <section aria-label={`Contact history for ${student.name}`}><h4>Communication History</h4>{!events.length && <p>No contact attempts yet.</p>}{events.slice().reverse().map(row => <article key={row.id}><strong>{row.channel} · {row.parentName} · {row.contactType}</strong><p>{row.parentMobile} · {new Date(row.initiatedAt).toLocaleString()} · User {row.initiatedBy}</p><p>{row.outcome || row.status} {row.remark}</p>{row.channel==='call'&&row.attendanceDate===date&&<button onClick={()=>{setHistoryCallId(row.id);setOutcome(row.outcome||'');setRemark(row.remark||'')}}>Record follow-up for {row.parentName}</button>}</article>)}</section>}
  </div>;
}
