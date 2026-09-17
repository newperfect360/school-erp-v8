import FamilyContactCard from './FamilyContactCard';
import {lifecycleActive} from '../services/studentLifecycle';
import AudioRecorder from "./AudioRecorder";
import {readAsset} from "../services/assets";
import { useEffect, useRef, useState } from "react";
import { readStored, useStoredState } from "../storage";
import { notify } from "./Feedback";
import { absenceMessage, communicationKeys, communicationLink, communicationRecord, defaultAbsenceSettings, followupStatuses, parentContacts } from "../services/absenceCommunication";
import "./AbsenceCommunication.css";

export function useAbsenceCommunication(date, students, actor = { id: "admin", name: "Administrator", role: "admin" }) {
  const [history, setHistory, reloadHistory] = useStoredState(communicationKeys.history, []);
  useEffect(()=>{window.addEventListener('communication-history-changed',reloadHistory);return()=>window.removeEventListener('communication-history-changed',reloadHistory)},[reloadHistory]);
  const [followups, setFollowups] = useStoredState(communicationKeys.followups, {});
  const [settings, setSettings] = useStoredState(communicationKeys.settings, defaultAbsenceSettings);
  const [contacts, setContacts] = useState({});
  const [selected, setSelected] = useState([]);
  const [details, setDetails] = useState(null);
  const [batch, setBatch] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [sharing, setSharing] = useState(false);
  const detailsRef = useRef(null);
  const queueRef = useRef(null);
  useEffect(() => {
    if (details) { detailsRef.current?.focus({ preventScroll: true }); detailsRef.current?.scrollIntoView({ block: "start" }); }
  }, [details]);
  useEffect(() => {
    if (batch) { queueRef.current?.focus({ preventScroll: true }); queueRef.current?.scrollIntoView({ block: "start" }); }
  }, [batch]);
  const allowed = ["admin", "teacher"].includes(actor.role);
  const absent = students.filter(s => s.status === "Absent");
  const chosen = absent.filter(s => selected.includes(String(s.id)));
  const contactFor = s => {
    const list = parentContacts(s);
    return list.find(c => c.id === contacts[s.id]) || list.find(c => c.mobile) || list[0];
  };
  const eventsFor = s => history.filter(h => String(h.studentId) === String(s.id) && h.attendanceDate === date);
  const followupFor = s => followups[JSON.stringify([date, String(s.id)])] || { status: "Pending", response: "" };
  const setFollowup = (s, value) => allowed && setFollowups(current => ({ ...current, [JSON.stringify([date, String(s.id)])]: { ...followupFor(s), ...value, updatedBy: actor.id, updatedAt: new Date().toISOString() } }));

  // Re-resolve by immutable Student Master ID at click time, never by row index/name.
  const resolve = (s, contactId = contactFor(s)?.id) => {
    const master = readStored("erp_pro_students", []).find(item => String(item.id) === String(s.id));
    const contact = master && parentContacts(master).find(c => c.id === contactId);
    const day = readStored("erp_pro_attendance", {})[date];
    if (!allowed || !master || !lifecycleActive(master) || day?.[s.id] !== "Absent" || !contact?.mobile) {
      notify("A valid parent contact and saved Absent attendance are required. Check Student Master.");
      return null;
    }
    return { master, contact };
  };

  const prepare = ids => {
    if (!allowed || !settings.autoPrepare) return;
    const drafts = ids.flatMap(id => {
      const s = students.find(item => String(item.id) === String(id));
      if (!s || history.some(h => String(h.studentId) === String(id) && h.attendanceDate === date && h.channel === "notification")) return [];
      return [{ ...communicationRecord(s, contactFor(s) || { name: "Not selected", mobile: "", id: "" }, date, "notification", actor.id), message: absenceMessage(s, date, settings), status: "Prepared — not sent" }];
    });
    if (drafts.length) setHistory(current => [...current, ...drafts]);
  };

  const initiate = (event, s, channel) => {
    const configured=readStored("erp_pro_message_settings",{}).channels; if(configured&&!configured.some(c=>c.id===channel&&c.enabled)){event.preventDefault();notify("This channel is disabled in Automation Settings.");return;}
    const resolved = resolve(s);
    if (!resolved) { event.preventDefault(); return; }
    const { master, contact } = resolved;
    const message = absenceMessage(master, date, settings);
    // Keep the native link activation synchronous for mobile dialers.
    event.currentTarget.href = communicationLink(channel, contact.mobile, message, navigator.userAgent);
    if (!setHistory(current => [...current, communicationRecord(master, contact, date, channel, actor.id, { message: channel === "call" ? "" : message })])) event.preventDefault();
  };

  const shareAudio = async s => {
    const channels=readStored("erp_pro_message_settings",{}).channels;if(channels&&!channels.some(c=>c.id==="audio"&&c.enabled))return notify("Audio channel is disabled in Automation Settings.");
    const resolved = resolve(s);
    if (!resolved || !audioFile || sharing) return;
    if (!navigator.canShare?.({ files: [audioFile] }) || !navigator.share) {
      notify("Audio sharing is unavailable on this device. Download the audio and attach it in the parent's chat."); return;
    }
    const record = { ...communicationRecord(resolved.master, resolved.contact, date, "audio", actor.id), status: "Share sheet requested — recipient unverified", audioName: audioFile.name };
    if (!setHistory(current => [...current, record])) return;
    setSharing(true);
    try {
      await navigator.share({ files: [audioFile], title: "School absence notice" });
    } catch (error) {
      setHistory(current => current.map(h => h.id === record.id ? { ...h, status: error.name === "AbortError" ? "Share cancelled" : "Share failed" } : h));
      if (error.name !== "AbortError") notify("Audio could not be shared. Download and attach it manually.");
    } finally { setSharing(false); }
  };

  const contactSelector = s => {
    const list = parentContacts(s);
    return list.length > 1 ? <label className="contact-choice">Contact for {s.name}<select aria-label={`Parent contact for ${s.name}`} value={contactFor(s)?.id || ""} onChange={e => setContacts(current => ({ ...current, [s.id]: e.target.value }))}>{list.map(c => <option key={c.id} value={c.id}>{c.label} — {c.name}{!c.mobile ? " (invalid number)" : ""}</option>)}</select></label> : <span>{list[0]?.name || "No parent contact in Student Master"}</span>;
  };
  const link = (s, channel, label) => {
    const contact = contactFor(s);
    const href = communicationLink(channel, contact?.mobile, absenceMessage(s, date, settings), navigator.userAgent);
    return href && allowed ? <a className={`contact-action ${channel}`} href={href} target={channel === "whatsapp" ? "_blank" : undefined} rel="noopener noreferrer" onClick={e => initiate(e, s, channel)}>{label}</a> : <button disabled>{label}</button>;
  };
  const quickActions = s => allowed && <div className="absence-quick">{contactSelector(s)}<div className="contact-actions">{link(s, "whatsapp", "WhatsApp")}{link(s, "sms", "SMS")}{link(s, "call", "Call Parent")}<button onClick={() => { setDetails({ id: s.id, date }); }}>Audio</button><button aria-label={`View Communication History for ${s.name}`} onClick={() => setDetails({ id: s.id, date })}>Details</button></div></div>;

  const exportParents = () => {
    const rows = [["Student", "Class", "Date", "Parent", "Contact type", "Parent mobile"]];
    for (const s of chosen) {
      const resolved = resolve(s);
      if (!resolved) return;
      rows.push([resolved.master.name, `${resolved.master.className}/${resolved.master.division || ""}`, date, resolved.contact.name, resolved.contact.label, resolved.contact.mobile]);
    }
    const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `absent-parents-${date}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const audioControls = s => <div className="audio-controls"><label>Audio notice (maximum 10 MB)<input type="file" accept="audio/*" onChange={e => {
    const file = e.target.files?.[0];
    if (file && (!file.type.startsWith("audio/") || file.size > 10 * 1024 * 1024 || !file.size)) { setAudioFile(null); e.target.value = ""; notify("Choose a non-empty audio file up to 10 MB."); return; }
    setAudioFile(file || null);
  }} /></label><AudioRecorder onRecorded={async asset=>{const saved=await readAsset(asset.id);if(saved)setAudioFile(new File([saved.blob],asset.name,{type:asset.type}))}}/>{audioFile && <span>{audioFile.name}</span>}<p>Choose the intended parent in the device share sheet. Audio sharing cannot preselect or verify the recipient.</p>{s && <button disabled={!audioFile || sharing || !contactFor(s)?.mobile} onClick={() => shareAudio(s)}>Send Audio Message</button>}{audioFile && <button onClick={() => { const url = URL.createObjectURL(audioFile); const a = document.createElement("a"); a.href = url; a.download = audioFile.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}>Download audio</button>}</div>;
  const detailStudent = details?.date === date && absent.find(s => String(s.id) === String(details.id));
  const batchStudents = batch?.date === date ? absent.filter(s => batch.ids.includes(String(s.id))) : [];

  const panel = allowed && <section className="absence-panel" aria-label="Absent Student Follow-up">
    <h3>Absent Student Follow-up</h3>
    <p>Contact actions are saved on this browser. Opening an app does not confirm delivery or a connected call.</p>
    {actor.role === "admin" && <details className="absence-settings"><summary>Absence notification settings</summary>
      <label><input type="checkbox" checked={settings.autoPrepare} onChange={e => setSettings({ ...settings, autoPrepare: e.target.checked })} /> Automatically prepare a notification when marked absent</label>
      <label><input type="checkbox" checked={false} disabled /> Automatic sending (provider not connected)</label>
      <p>Notifications can be prepared automatically; sending requires the parent messaging app. Only an authenticated server provider can enable unattended sending.</p>
      <label>Notification language<select value={settings.language} onChange={e => setSettings({ ...settings, language: e.target.value })}><option value="en">English</option><option value="mr">मराठी</option></select></label>
      <label>Message template<textarea value={settings.templates?.[settings.language] ?? defaultAbsenceSettings.templates[settings.language]} onChange={e => setSettings({ ...settings, templates: { ...defaultAbsenceSettings.templates, ...settings.templates, [settings.language]: e.target.value } })} /></label>
      <p>Placeholders: [Student Name], [Standard/Division], [Date]</p>
    </details>}
    {!absent.length ? <p>No absent students for {date}.</p> : <>
      <div className="contact-actions bulk-actions"><label><input type="checkbox" checked={chosen.length === absent.length} onChange={e => setSelected(e.target.checked ? absent.map(s => String(s.id)) : [])} /> Select all absent</label><span>{chosen.length} selected</span>{[["whatsapp", "Send WhatsApp to selected"], ["sms", "Send SMS to selected"], ["audio", "Send common audio notice"]].map(([channel, label]) => <button key={channel} disabled={!chosen.length} onClick={() => setBatch({ channel, date, ids: chosen.map(s => String(s.id)) })}>{label}</button>)}<button disabled={!chosen.length} onClick={exportParents}>Export parent list</button></div>
      <div className="followup-grid">{absent.map(s => { const contact = contactFor(s); const events = eventsFor(s); const followup = followupFor(s); return <article className="followup-card" key={s.id} data-student-id={s.id}>
        <div className="followup-heading"><input type="checkbox" aria-label={`Select ${s.name}`} checked={selected.includes(String(s.id))} onChange={e => setSelected(current => e.target.checked ? [...current, String(s.id)] : current.filter(id => id !== String(s.id)))} />{s.photo ? <img src={s.photo} alt={`${s.name} student photo`} /> : <span className="student-placeholder" aria-label="No student photo">{s.name?.slice(0, 1)}</span>}<div><strong>{s.name}</strong><span>Class {s.className}/{s.division} · GR {s.grNo}</span></div></div>
        <FamilyContactCard student={s} date={date} message={absenceMessage(s,date,settings)} requireAbsent compact/>{quickActions(s)}<div className="parent-number">Parent number: {contact?.mobile || "Missing or invalid"}</div>
        <dl className="contact-progress">{[["whatsapp", "WhatsApp Sent"], ["sms", "SMS Sent"], ["call", "Call Initiated"]].map(([channel, label]) => <div key={channel}><dt>{label}</dt><dd>{events.some(h => h.channel === channel) ? channel === "call" ? "Dialer requested" : "Unconfirmed · composer opened" : "Not initiated"}</dd></div>)}</dl>
        {events.some(h => h.channel === "notification") && <p>Absence notification prepared — not sent</p>}
        <label>Parent Response<textarea aria-label={`Parent Response for ${s.name}`} maxLength={2000} value={followup.response} onChange={e => setFollowup(s, { response: e.target.value })} /></label>
        <label>Follow-up Status<select aria-label={`Follow-up Status for ${s.name}`} value={followup.status} onChange={e => setFollowup(s, { status: e.target.value })}>{followupStatuses.map(status => <option key={status}>{status}</option>)}</select></label>
      </article>; })}</div>
    </>}
    {batchStudents.length > 0 && <section ref={queueRef} tabIndex={-1} className="communication-detail" aria-label="Bulk communication queue"><h4>Selected parent {batch.channel} queue</h4><p>Open each recipient individually to send from your device. Calls are individual only.</p><button onClick={() => setBatch(null)}>Close queue</button>{batch.channel === "audio" && audioControls(null)}{batchStudents.map(s => <div className="batch-recipient" key={s.id}><strong>{s.name}</strong>{contactSelector(s)}{batch.channel === "audio" ? <button disabled={!audioFile || sharing || !contactFor(s)?.mobile} onClick={() => shareAudio(s)}>Share audio for {s.name}</button> : link(s, batch.channel, `Open ${batch.channel} for ${s.name}`)}</div>)}</section>}
    {detailStudent && <section ref={detailsRef} tabIndex={-1} className="communication-detail" aria-label="Communication history"><h4>{detailStudent.name} — Communication History</h4><button onClick={() => setDetails(null)}>Close details</button>{contactSelector(detailStudent)}<p>{absenceMessage(detailStudent, date, settings)}</p>{audioControls(detailStudent)}
      {!history.some(h => String(h.studentId) === String(detailStudent.id)) && <p>No communication history yet.</p>}
      {history.filter(h => String(h.studentId) === String(detailStudent.id)).slice().reverse().map(h => <article className="history-entry" key={h.id}><strong>{h.channel} · {h.status}</strong><p>{h.parentName} · {h.parentMobile} · {h.contactType}</p><p>By {h.initiatedBy} · {new Date(h.initiatedAt).toLocaleString()} · Attendance {h.attendanceDate}{h.callType && ` · ${h.callType}`}</p>{h.message && <p>{h.message}</p>}{h.audioName && <p>{h.audioName}</p>}{h.channel === "call" && <label>Call remark<input aria-label={`Call remark ${h.id}`} list="call-remark-options" value={h.remark} maxLength={1000} onChange={e => setHistory(current => current.map(item => item.id === h.id ? { ...item, remark: e.target.value } : item))} /></label>}</article>)}
      <datalist id="call-remark-options">{["Parent informed", "No answer", "Number busy", "Call back requested", "Wrong number", "Medical reason", "Other"].map(remark => <option key={remark} value={remark} />)}</datalist>
    </section>}
  </section>;
  return { quickActions, panel, prepare };
}
