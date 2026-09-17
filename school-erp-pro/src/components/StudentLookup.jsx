import { useEffect, useRef, useState } from "react";
import { notify } from "./Feedback";

export function resolveStudentReference(reference, students) {
  let id = ""; const value = reference.trim();
  try { if (value.startsWith("schoolerp:student:v1:")) id = decodeURIComponent(value.slice(21)); } catch { return null; }
  const matches = students.filter(s => !s.archivedAt && (id ? String(s.id) === id : String(s.grNo) === value));
  return matches.length === 1 ? matches[0] : null;
}
export default function StudentLookup({ students, onSelect }) {
  const [value, setValue] = useState(""), [scanning, setScanning] = useState(false), video = useRef(null), stream = useRef(null), timer = useRef(null);
  const stop = () => { clearTimeout(timer.current); stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; setScanning(false); };
  useEffect(() => () => { clearTimeout(timer.current); stream.current?.getTracks().forEach(track => track.stop()); }, []);
  const find = input => { const student = resolveStudentReference(input, students); if (!student) return notify("No unique active student matches this QR / GR reference."); onSelect(student); stop(); };
  const scan = async () => {
    if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) return notify("Camera QR scanning is unsupported here. Use a scanner that types the QR value, or enter GR below.");
    try { setScanning(true); const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }); stream.current = media; if (!video.current) { stop(); return; } video.current.srcObject = media; await video.current.play(); const detector = new window.BarcodeDetector({ formats: ["qr_code"] }); const tick = async () => { if (!stream.current) return; try { const codes = await detector.detect(video.current); if (codes.length) { setValue(codes[0].rawValue); find(codes[0].rawValue); stop(); return; } } catch { /* Try the next decoded frame. */ } timer.current = setTimeout(tick, 300); }; tick(); } catch { stop(); notify("Camera could not be opened. Enter a GR or scanned reference instead."); }
  };
  return <details className="workflow-panel"><summary>Scan QR / auto-fill student</summary><div className="domain-toolbar"><label>Student QR reference or GR<input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); find(value); } }} /></label><button type="button" onClick={() => find(value)}>Identify student</button><button type="button" onClick={scan}>Scan camera QR</button></div>{scanning && <div><video ref={video} playsInline muted style={{ width: "100%", maxWidth: 400 }} /><button onClick={stop}>Stop camera</button></div>}</details>;
}
