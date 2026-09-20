import { useContext, useState } from 'react';
import { CommunicationSession } from '../backend/CommunicationSession';
import { reviewAttendance, finalizeAttendance } from '../services/attendanceAutomationStore';
export default function AttendanceFinalization({ year, standard, division, date, onSaved }) {
  const actor = useContext(CommunicationSession), [review,setReview] = useState(null), [message,setMessage] = useState('');
  return <section className="school-panel workflow-panel"><h3>Draft → Review → Final Submit</h3><p>Ticks save drafts only. Final Submit commits the entire selected class/division and prepares configured dry-run messages once. Live sending is OFF.</p>
    <button onClick={() => { try { setReview(reviewAttendance(year, standard, division, date)); setMessage(''); } catch(error) { setReview(null); setMessage(error.message); } }}>Review attendance</button>
    {review && <><p>{review.year} · {review.standard}/{review.division} · {review.date}</p><ul>{review.rows.map(row => <li key={row.id}>{row.name} · {row.status} {row.arrivalTime} {row.reason}</li>)}</ul><button onClick={() => { try { if (year !== review.year || standard !== review.standard || division !== review.division || date !== review.date) throw Error('Selection changed. Review again.'); const result=finalizeAttendance(review,actor?.uid); setReview(null); setMessage(result.repeated ? 'Already submitted; no duplicate jobs created.' : `Attendance submitted. ${result.count} dry-run message jobs prepared.`); onSaved(); } catch(error) { setMessage(error.message); } }}>Final Submit attendance</button></>}
    <p role="status">{message}</p></section>;
}
