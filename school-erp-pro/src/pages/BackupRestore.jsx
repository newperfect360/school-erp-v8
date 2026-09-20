import { useLanguage } from "../design/language";
import CleanupBackup from '../components/CleanupBackup';
import { useState } from "react";
import { readStored, commitStoredBatch } from "../storage";
import { PageHeading } from "../design/SchoolUI";
import { notify } from "../components/Feedback";
import { canonical, normalizeDate } from "../services/studentImport";

const allowed = key => /^erp_pro_[a-zA-Z0-9_]+$/.test(key) && !/password|token|credential|users/i.test(key) || key === "schoolSettings";
const cleanSettings = data => Object.fromEntries(Object.entries(data).filter(([key]) => !/token|password|secret|apiKey/i.test(key)));
export default function BackupRestore() {
  const { t } = useLanguage();
  const [preview, setPreview] = useState(null), [confirmed, setConfirmed] = useState(false);
  const download = () => { const data = {}; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (allowed(key)) { const value = JSON.parse(localStorage.getItem(key)); data[key] = JSON.stringify(key === "schoolSettings" ? cleanSettings(value) : value); } } const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 2, createdAt: new Date().toISOString(), includesBinaryAssets: false, data }, null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = "school-records-backup.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; setPreview(null); setConfirmed(false);
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("Backup file must be smaller than 20 MB.");
      const backup = JSON.parse(await file.text()); if (!backup.data || Array.isArray(backup.data) || typeof backup.data !== "object") throw new Error("Invalid school backup structure.");
      const entries = {}, expected = {}, rows = [];
      for (const [key, raw] of Object.entries(backup.data)) {
        if (!allowed(key)) { rows.push({ key, action: "Excluded: unrelated data or credentials" }); continue; }
        let incoming = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!incoming || typeof incoming !== "object") throw new Error(`Invalid ${key}.`);
        if (key === "erp_pro_students" && !Array.isArray(incoming)) throw new Error("Student backup must contain a record array.");
        if (key === "schoolSettings" && Array.isArray(incoming)) throw new Error("School settings must be an object.");
        if (Array.isArray(incoming) && incoming.some(row => !row || typeof row !== "object" || Array.isArray(row) || !row.id)) throw new Error(`${key}: every imported record needs an ID.`);
        if (key === "schoolSettings") incoming = cleanSettings(incoming);
        const source = localStorage.getItem(key), current = source === null ? null : JSON.parse(source);
        if (key === "erp_pro_students") {
          if (current !== null && !Array.isArray(current)) throw new Error("Existing Student Master is invalid; restore stopped.");
          const records = [...(current || [])], ids = new Set(records.map(row => String(row.id)));
          for (const row of incoming) {
            if (ids.has(String(row.id))) continue;
            if (!canonical(row.name) || !canonical(row.grNo) || !canonical(row.className)) throw new Error("Restored students require name, GR number and class.");
            const collision = records.some(old => canonical(old.grNo) === canonical(row.grNo) || (row.admissionNo && canonical(old.admissionNo) === canonical(row.admissionNo)) || (normalizeDate(row.dob) && normalizeDate(old.dob) === normalizeDate(row.dob) && canonical(old.name) === canonical(row.name)));
            if (collision) throw new Error(`Student identity conflict for GR ${row.grNo}. Use the reviewed student import to reconcile this record.`);
            records.push(row); ids.add(String(row.id));
          }
        }
        expected[key] = source;
        if (current === null) { entries[key] = incoming; rows.push({ key, action: "Add missing collection" }); }
        else if (Array.isArray(current) && Array.isArray(incoming)) {
          if (incoming.some(r => !r || typeof r !== "object" || !r.id)) throw new Error(`${key}: every imported record needs an ID.`);
          const seen = new Set(current.map(r => String(r.id))), added = []; let conflicts = 0;
          for (const row of incoming) { if (seen.has(String(row.id))) { conflicts++; continue; } seen.add(String(row.id)); added.push(row); }
          entries[key] = [...current, ...added]; rows.push({ key, action: `${added.length} new records; ${conflicts} existing IDs retained without overwriting` });
        } else rows.push({ key, action: "Existing object retained. Manual reconciliation required." });
      }
      setPreview({ entries, expected, rows });
    } catch (error) { notify(error.message); }
  };
  const restore = () => { if (!preview || !confirmed) return; try { commitStoredBatch(preview.entries, preview.expected); setPreview(null); notify("Missing records merged. Existing IDs were not overwritten. Reopen modules to load the restored records."); } catch (error) { notify(error.message); } };
  return <div className="core-page"><PageHeading eyebrow="DATA CARE" title="Backup, restore & audit" description="Download school records and review a non-destructive merge before restoring." /><CleanupBackup /><section className="school-panel workflow-panel"><p>JSON backups contain React school records, not IndexedDB attachments or legacy root-app data. Download important attachment/audio files separately. Provider credentials are excluded.</p><button onClick={() => { try { download(); } catch (error) { notify(`Backup stopped: ${error.message}`); } }}>Download school backup</button><label>Preview backup restore<input type="file" accept=".json" onChange={upload} /></label></section>{preview && <section className="school-panel workflow-panel"><h3>Restore preview</h3>{preview.rows.map(row => <p key={row.key}><b>{row.key}</b> — {row.action}</p>)}<label className="review-ack"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Merge new records only; retain every existing ID and value.</label><button disabled={!confirmed || !Object.keys(preview.entries).length} onClick={restore}>Confirm non-destructive restore</button><button onClick={() => setPreview(null)}>{t("Cancel")}</button></section>}<section className="school-panel workflow-panel"><h3>Local audit history</h3><p>This is browser-local activity history, not an immutable server audit.</p>{readStored("erp_pro_audit", []).slice().reverse().map(log => <p key={log.id}>{log.date} {log.time} · {log.user} · {log.action}</p>)}{!readStored("erp_pro_audit", []).length && <p>No audit events yet.</p>}</section></div>;
}
