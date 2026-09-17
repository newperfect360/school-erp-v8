import { useLanguage } from "../design/language";
import { useState } from "react";
import { readStored, commitStoredBatch } from "../storage";
import { studentColumns, parseStudentFile, downloadStudentTemplate, exportStudents, exportRows } from "../services/excel";
import { reviewStudentImport, applyStudentImport, updateFields } from "../services/studentImport";
import { PageHeading, EmptyState } from "../design/SchoolUI";
import { notify } from "../components/Feedback";

export default function StudentImport({ onDone, onBack }) {
  const { t } = useLanguage();
  const [file, setFile] = useState(null), [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("create"), [fields, setFields] = useState(updateFields);
  const [columns, setColumns] = useState(studentColumns.map(([, field]) => field));
  const [review, setReview] = useState(null), [choices, setChoices] = useState({}), [overrides, setOverrides] = useState({});
  const [acknowledged, setAcknowledged] = useState(false), [page, setPage] = useState(0);
  const invalidate = () => { setReview(null); setAcknowledged(false); };
  const upload = async event => {
    const uploadFile = event.target.files?.[0]; event.target.value = ""; if (!uploadFile) return;
    setLoading(true); invalidate(); setChoices({}); setOverrides({}); setFile(null); setPage(0);
    try { const parsed = await parseStudentFile(uploadFile); if (!parsed.rows.length) throw new Error("No student rows found."); setFile({ ...parsed, name: uploadFile.name }); }
    catch (error) { notify(error.message); } finally { setLoading(false); }
  };
  const validate = () => {
    try {
      const source = localStorage.getItem("erp_pro_students");
      const existing = source === null ? [] : JSON.parse(source);
      if (!Array.isArray(existing)) throw new Error("Student storage is invalid. Restore a reviewed backup first.");
      setReview({ source, existing, results: reviewStudentImport(file.rows, file.mapping, existing, { mode, fields, overrides }) }); setAcknowledged(false);
    } catch (error) { notify(error.message); }
  };
  const confirm = () => {
    if (!review || !acknowledged) return;
    try {
      const change = applyStudentImport(review.existing, review.results, choices);
      if (!change.added && !change.updated) throw new Error("No rows are selected for import/update.");
      const timestamp = new Date().toISOString(), id = crypto.randomUUID();
      const history = { id, fileName: file.name, importedAt: timestamp, successCount: change.added, updatedCount: change.updated, skippedCount: change.skipped, totalRows: file.rows.length, mode };
      commitStoredBatch({
        erp_pro_students: change.students,
        erp_pro_import_history: [...readStored("erp_pro_import_history", []), history],
        erp_pro_audit: [...readStored("erp_pro_audit", []), { id, action: "Reviewed student Excel import", date: timestamp.slice(0, 10), time: timestamp.slice(11, 19), user: "local-review", details: history }],
      }, { erp_pro_students: review.source });
      notify(`${change.added} imported · ${change.updated} updated · ${change.skipped} skipped`); onDone();
    } catch (error) { notify(error.message); }
  };
  const results = review?.results || [];
  const ready = review && results.every(r => choices[r.index] === "skip" || (!r.errors.length && (!r.duplicate || choices[r.index] === "update")));
  const shown = (review ? results : file?.rows || []).slice(page * 25, (page + 1) * 25);
  return <div className="core-page import-page">
    <button className="school-link" onClick={onBack}>← Student Master</button>
    <PageHeading eyebrow="STUDENT RECORDS" title="Student Excel Import" description="Upload → map columns → preview → validate → review changes → confirm. Nothing is saved before confirmation." />
    <section className="school-panel workflow-panel"><div className="import-actions">
      <button className="school-button secondary" onClick={() => downloadStudentTemplate(columns)}>{t("Download Student Excel Template")}</button>
      <label className="school-button secondary">{t("Upload Excel")}<input aria-label="Upload Excel" type="file" accept=".xlsx,.xls,.csv" onChange={upload} disabled={loading} /></label>
      <button className="school-button secondary" onClick={() => exportStudents(readStored("erp_pro_students", []))}>{t("Export Students")}</button>
    </div><p>.xlsx / .xls / .csv · first worksheet · up to 5 MB / 5,000 rows. Dates: YYYY-MM-DD or DD/MM/YYYY.</p>
    <details><summary>Configure template columns</summary><div className="check-grid">{studentColumns.map(([label, field]) => <label key={field}><input type="checkbox" checked={columns.includes(field)} disabled={["name", "grNo", "className"].includes(field)} onChange={e => setColumns(e.target.checked ? [...columns, field] : columns.filter(f => f !== field))} />{label}</label>)}</div></details>
    <label>{t("Import operation")}<select aria-label="Import operation" value={mode} onChange={e => { setMode(e.target.value); invalidate(); setChoices({}); }}><option value="create">Import new students + review duplicates</option><option value="update">Update Existing Students from Excel</option></select></label>
    <details><summary>Choose fields allowed to update (blank cells never erase data)</summary><div className="check-grid">{updateFields.map(field => <label key={field}><input type="checkbox" checked={fields.includes(field)} onChange={e => { setFields(e.target.checked ? [...fields, field] : fields.filter(f => f !== field)); invalidate(); }} />{studentColumns.find(([, key]) => key === field)?.[0] || field}</label>)}</div></details>
    </section>
    {loading ? <p role="status">Reading workbook…</p> : !file ? <EmptyState icon="upload" title="Bring your existing school list" description="Download the template or upload an old school file. You can map its headers without retyping." /> : <>
      <section className="school-panel workflow-panel"><h3>Column mapping · {file.name}</h3><div className="mapping-grid">{file.headers.map(header => <label key={header}>{header}<select aria-label={`Map ${header}`} value={file.mapping[header] || ""} onChange={e => { setFile({ ...file, mapping: { ...file.mapping, [header]: e.target.value } }); invalidate(); }}><option value="">Skip column</option>{studentColumns.map(([label, field]) => <option key={field} value={field}>{label}</option>)}</select></label>)}</div><button className="school-button" onClick={validate}>{t("Validate")}</button><p>English and Marathi are stored separately. Edit Marathi names below, then validate again. Automatic transliteration is not connected; names are never silently translated.</p></section>
      <section className="school-panel workflow-panel"><h3>Preview Data · {file.rows.length} rows</h3>{review && <p role="status">{results.filter(r => r.errors.length).length} rows with errors · {results.filter(r => r.duplicate).length} existing matches</p>}
        <div className="table-scroll"><table><thead><tr><th>Row</th><th>Student / uploaded values</th><th>Marathi correction</th><th>Validation / changes</th><th>Action</th></tr></thead><tbody>{shown.map((entry, offset) => {
          const index = page * 25 + offset, row = file.rows[index], result = review ? entry : null;
          return <tr key={index} className={result?.errors.length ? "import-invalid" : ""}><td>{row.__row}</td><td><strong>{result?.student.name || row[file.headers.find(h => file.mapping[h] === "name")]}</strong><details><summary>All mapped values</summary>{Object.entries(file.mapping).filter(([, field]) => field).map(([header]) => <div key={header}>{header}: {String(row[header])}</div>)}</details></td><td><input aria-label={`Marathi name row ${row.__row}`} value={overrides[index]?.student_name_mr ?? result?.student.student_name_mr ?? row[file.headers.find(h => file.mapping[h] === "student_name_mr")] ?? ""} onChange={e => { setOverrides({ ...overrides, [index]: { student_name_mr: e.target.value } }); invalidate(); }} /></td><td>{result ? <><ul>{[...result.errors, ...result.warnings].map(message => <li key={message}>{message}</li>)}</ul>{result.duplicate && <p>Existing: {result.duplicate.name} · GR {result.duplicate.grNo}</p>}{result.changes.map(c => <div key={c.field}><b>{c.field}</b>: {String(c.before) || "(blank)"} → {String(c.after)}</div>)}{!result.errors.length && !result.duplicate && "New student — valid"}</> : "Not validated"}</td><td>{result && <select aria-label={`Action row ${row.__row}`} value={choices[index] || (result.duplicate ? "review" : "create")} onChange={e => { setChoices({ ...choices, [index]: e.target.value }); setAcknowledged(false); }}><option value="skip">Skip</option>{result.duplicate ? <><option value="review">Review Manually</option><option value="update">Update Existing</option></> : <option value="create">Create new</option>}</select>}</td></tr>;
        })}</tbody></table></div><div className="import-actions"><button disabled={!page} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} / {Math.ceil(file.rows.length / 25)}</span><button disabled={(page + 1) * 25 >= file.rows.length} onClick={() => setPage(page + 1)}>Next</button></div>
        <div className="import-actions"><button className="school-button secondary" disabled={!review} onClick={() => exportRows(results.map(r => ({ Row: r.rowNumber, GR: r.student.grNo, Errors: r.errors.join("; "), Warnings: r.warnings.join("; "), Duplicate: r.duplicate?.grNo || "" })), "student-import-errors.xlsx")}>{t("Download Error Report")}</button><button disabled={!review} onClick={() => { setChoices(Object.fromEntries(results.filter(r => r.errors.length || r.duplicate).map(r => [r.index, "skip"]))); setAcknowledged(false); }}>Skip all errors and duplicates</button></div>
        <label className="review-ack"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} disabled={!ready} />I reviewed all rows and before/after changes. Save only the selected actions.</label>
        <button className="school-button" onClick={confirm} disabled={!ready || !acknowledged}>{t("Confirm Import")}</button>
      </section>
    </>}
    <section className="school-panel workflow-panel"><h3>{t("Import history")}</h3>{readStored("erp_pro_import_history", []).slice().reverse().slice(0, 20).map(item => <p key={item.id}>{item.fileName} · {item.importedAt} · {item.successCount} added / {item.updatedCount || 0} updated</p>)}{!readStored("erp_pro_import_history", []).length && <p>No imports yet. Confirmed imports will appear here.</p>}</section>
  </div>;
}
