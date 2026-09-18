import {enrollment,academicSnapshot} from '../services/studentLifecycle';
import {suggestMarathiName} from "../services/bilingualStudent";
import {normalizeStudentRow} from "../services/excel";
import { useLanguage } from "../design/language";
import { useState } from "react";
import { readStored, commitStoredBatch } from "../storage";
import { studentColumns, parseStudentFile, downloadStudentTemplate, exportStudents, exportRows } from "../services/excel";
import { reviewStudentImport, applyStudentImport, updateFields } from "../services/studentImport";
import { PageHeading, EmptyState } from "../design/SchoolUI";
import { notify } from "../components/Feedback";
import {matchPhotos,imageData} from '../services/photoImport';

export default function StudentImport({ onDone, onBack, onNavigate }) {
  const { t } = useLanguage();
  const [file, setFile] = useState(null), [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("create"), [fields, setFields] = useState(updateFields);
  const [columns, setColumns] = useState(studentColumns.map(([, field]) => field));
  const [review, setReview] = useState(null), [choices, setChoices] = useState({}), [overrides, setOverrides] = useState({});
  const [acknowledged, setAcknowledged] = useState(false), [page, setPage] = useState(0);
  const [photos,setPhotos]=useState([]),[photoField,setPhotoField]=useState('photoNumber'),[photoPlan,setPhotoPlan]=useState(null),[photoChoices,setPhotoChoices]=useState({}),[photoBusy,setPhotoBusy]=useState(false);
  const invalidate = () => { setReview(null); setPhotoPlan(null); setAcknowledged(false); };
  const resetPhotos = () => {setPhotoPlan(null);setAcknowledged(false)};
  const previewPhotos = async () => {
    setPhotoBusy(true);resetPhotos();
    try {
      if(photos.length>500)throw Error('Select at most 500 photos per import.');
      const change=applyStudentImport(review.existing,review.results,choices);
      const touched=new Set(change.students.filter(s=>!review.existing.some(old=>old.id===s.id)).map(s=>s.id));
      review.results.filter(r=>r.duplicate&&choices[r.index]==='update').forEach(r=>touched.add(r.duplicate.id));
      const matched=matchPhotos(change.students,photos,photoField);let total=0;
      for(const row of matched.rows){
        if(!row.error&&!touched.has(row.student.id))row.error='Student is not selected in this Excel import';
        if(!row.error)try{row.photo=await imageData(photos[row.index]);total+=row.photo.length;if(total>8*1024*1024)throw Error('Photo batch too large. Use a smaller batch.')}catch(e){row.error=e.message}
      }
      setPhotoChoices(Object.fromEntries(matched.rows.map(r=>[r.index,r.error||r.existing?'review':'attach'])));
      const matchedIds=new Set(matched.rows.filter(r=>!r.error).map(r=>r.student.id));
      setPhotoPlan({change,rows:matched.rows,missing:[...touched].filter(id=>!matchedIds.has(id)).length});
    }catch(e){notify(e.message)}finally{setPhotoBusy(false)}
  };
  const upload = async event => {
    const uploadFile = event.target.files?.[0]; event.target.value = ""; if (!uploadFile) return;
    setLoading(true); invalidate(); setChoices({}); setOverrides({}); setFile(null); setPage(0);
    try { const parsed = await parseStudentFile(uploadFile); if (!parsed.rows.length) throw new Error("No student rows found."); setFile({ ...parsed, name: uploadFile.name }); setOverrides({}); }
    catch (error) { notify(error.message); } finally { setLoading(false); }
  };
  const suggestedOverrides = Object.fromEntries((file?.rows||[]).map((row,index)=>{const student=normalizeStudentRow(row,file.mapping);return [index,overrides[index]??(!student.student_name_mr?{student_name_mr:suggestMarathiName(student.name)||''}:{})]}));
  const validate = () => {
    try {
      const source = localStorage.getItem("erp_pro_students");
      const existing = source === null ? [] : JSON.parse(source);
      if (!Array.isArray(existing)) throw new Error("Student storage is invalid. Restore a reviewed backup first.");
      setReview({ source, existing, results: reviewStudentImport(file.rows, file.mapping, existing, { mode, fields, overrides: suggestedOverrides }) }); resetPhotos();
    } catch (error) { notify(error.message); }
  };
  const confirm = () => {
    if (!review || !acknowledged) return;
    try {
      if(photos.length&&(!photoPlan||photoPlan.rows.some(r=>photoChoices[r.index]!=='skip'&&(r.error||photoChoices[r.index]!=='attach'))))throw Error('Review photo matches and explicitly skip invalid photos first.');
      const change = photos.length ? {...photoPlan.change,students:photoPlan.change.students.map(s=>({...s}))} : applyStudentImport(review.existing, review.results, choices);
      const attached=photos.length?photoPlan.rows.filter(r=>photoChoices[r.index]==='attach'&&!r.error):[];
      const photoMap=new Map(attached.map(r=>[r.student.id,r.photo]));
      change.students=change.students.map(s=>photoMap.has(s.id)?{...s,photo:photoMap.get(s.id),photoUpdatedAt:new Date().toISOString()}:s);
      if (!change.added && !change.updated) throw new Error("No rows are selected for import/update.");
      const timestamp = new Date().toISOString(), id = crypto.randomUUID();
      const history = { id, fileName: file.name, importedAt: timestamp, successCount: change.added, updatedCount: change.updated, skippedCount: change.skipped, totalRows: file.rows.length, mode };
      commitStoredBatch({
        erp_pro_students: change.students,
        ...(attached.length?{erp_pro_photo_import_history:[...readStored('erp_pro_photo_import_history',[]),{id:crypto.randomUUID(),at:timestamp,field:photoField,studentIds:[...photoMap.keys()],count:attached.length,fileName:file.name}]}:{}),
        erp_pro_student_movements:[...readStored('erp_pro_student_movements',[]),...change.students.flatMap(s=>{const old=review.existing.find(p=>p.id===s.id);if(old&&JSON.stringify(enrollment(old))===JSON.stringify(enrollment(s)))return [];return [{id:crypto.randomUUID(),studentId:s.id,studentName:s.name,grNo:s.grNo,action:old?'Class Changed (reviewed Excel update)':'Added',type:old?'Class Changed':'Added',oldValue:old?enrollment(old):null,newValue:enrollment(s),reason:'Reviewed Excel import '+file.name,actor:'local-review',createdAt:timestamp}]})],
        erp_pro_academic_history:[...readStored('erp_pro_academic_history',[]),...review.existing.flatMap(old=>{const s=change.students.find(p=>p.id===old.id);return s&&JSON.stringify(enrollment(old))!==JSON.stringify(enrollment(s))?[{id:crypto.randomUUID(),...academicSnapshot(old,readStored('erp_pro_results',[]),readStored('erp_pro_attendance',{}),'Reviewed Excel update',timestamp.slice(0,10))}]:[]})],
        erp_pro_import_history: [...readStored("erp_pro_import_history", []), history],
        erp_pro_audit: [...readStored("erp_pro_audit", []), { id, action: "Reviewed student Excel import", date: timestamp.slice(0, 10), time: timestamp.slice(11, 19), user: "local-review", details: history }],
      }, { erp_pro_students: review.source });
      notify(`${change.added} imported · ${change.updated} updated · ${change.skipped} skipped`); onDone();
    } catch (error) { notify(error.message); }
  };
  const results = review?.results || [];
  const ready = review && results.every(r => choices[r.index] === "skip" || (!r.errors.length && (!r.duplicate || choices[r.index] === "update")));
  const photosReady=!photos.length||(photoPlan&&photoPlan.rows.every(r=>photoChoices[r.index]==='skip'||(!r.error&&photoChoices[r.index]==='attach')));
  const shown = (review ? results : file?.rows || []).slice(page * 25, (page + 1) * 25);
  return <div className="core-page import-page">
    <button className="school-link" onClick={onBack}>← Student Master</button>
    <PageHeading eyebrow="STUDENT RECORDS" title="Student Excel Import" description="Upload → map columns → preview → validate → review changes → confirm. Nothing is saved before confirmation." />
    <fieldset className="import-workflow-fields" disabled={photoBusy}>
    <ol className="import-progress" aria-label="Import steps">{["Download template", "Upload & preview", "Column mapping", "Validate & Marathi review", "Duplicate & photo check", "Confirm import"].map((step,i)=><li key={step}><b>{i+1}</b>{step}</li>)}</ol><section className="school-panel workflow-panel"><div className="import-actions">
      <button className="school-button secondary" onClick={() => downloadStudentTemplate(columns)}>{t("Download Student Excel Template")}</button>
      <label className="school-button secondary">{t("Upload Excel")}<input aria-label="Upload Excel" type="file" accept=".xlsx,.xls,.csv" onChange={upload} disabled={loading} /></label>
      <button disabled={!file} onClick={()=>{const next={...overrides};for(const [index,row] of (file?.rows||[]).entries()){const student=normalizeStudentRow(row,file.mapping),name=suggestMarathiName(student.name);if(name&&!student.student_name_mr&&!next[index]?.student_name_mr)next[index]={...next[index],student_name_mr:name}}setOverrides(next);invalidate();notify("Limited offline suggestions filled for known names. Validate and manually review every Marathi spelling. Unknown names need manual entry.")}}>Suggest Marathi names (review required)</button><button className="school-button secondary" onClick={() => exportStudents(readStored("erp_pro_students", []))}>{t("Export Students")}</button>
    </div><p>.xlsx / .xls / .csv · first worksheet · up to 5 MB / 5,000 rows. Dates: YYYY-MM-DD or DD/MM/YYYY.</p>
    <details><summary>Configure template columns</summary><div className="check-grid">{studentColumns.map(([label, field]) => <label key={field}><input type="checkbox" checked={columns.includes(field)} disabled={["name", "grNo", "className"].includes(field)} onChange={e => setColumns(e.target.checked ? [...columns, field] : columns.filter(f => f !== field))} />{label}</label>)}</div></details>
    <label>{t("Import operation")}<select aria-label="Import operation" value={mode} onChange={e => { setMode(e.target.value); invalidate(); setChoices({}); }}><option value="create">Import new students + review duplicates</option><option value="update">Update Existing Students from Excel</option></select></label>
    <details><summary>Choose fields allowed to update (blank cells never erase data)</summary><div className="check-grid">{updateFields.map(field => <label key={field}><input type="checkbox" checked={fields.includes(field)} onChange={e => { setFields(e.target.checked ? [...fields, field] : fields.filter(f => f !== field)); invalidate(); }} />{studentColumns.find(([, key]) => key === field)?.[0] || field}</label>)}</div></details>
    </section>
    {loading ? <p role="status">Reading workbook…</p> : !file ? <EmptyState icon="upload" title="Bring your existing school list" description="Download the template or upload an old school file. You can map its headers without retyping." /> : <>
      <section className="school-panel workflow-panel"><h3>Column mapping · {file.name}</h3><div className="mapping-grid">{file.headers.map(header => <label key={header}>{header}<select aria-label={`Map ${header}`} value={file.mapping[header] || ""} onChange={e => { setFile({ ...file, mapping: { ...file.mapping, [header]: e.target.value } }); invalidate(); }}><option value="">Skip column</option>{studentColumns.map(([label, field]) => <option key={field} value={field}>{label}</option>)}</select></label>)}</div><button className="school-button" onClick={validate}>{t("Validate")}</button><p>English and Marathi are stored separately. Edit Marathi names below, then validate again. Known names receive offline suggestions. Unknown spellings and general content translation require manual review; no external service is contacted.</p></section>
      <section className="school-panel workflow-panel"><h3>Preview Data · {file.rows.length} rows</h3>{review && <p role="status">{results.filter(r => r.errors.length).length} rows with errors · {results.filter(r => r.duplicate).length} existing matches</p>}
        <div className="table-scroll"><table><thead><tr><th>Row</th><th>Student / uploaded values</th><th>Marathi correction</th><th>Validation / changes</th><th>Action</th></tr></thead><tbody>{shown.map((entry, offset) => {
          const index = page * 25 + offset, row = file.rows[index], result = review ? entry : null;
          return <tr key={index} className={result?.errors.length ? "import-invalid" : ""}><td>{row.__row}</td><td><strong>{result?.student.name || normalizeStudentRow(row,file.mapping).name}</strong><details><summary>All mapped values</summary>{Object.entries(file.mapping).filter(([, field]) => field).map(([header]) => <div key={header}>{header}: {String(row[header])}</div>)}</details></td><td><input aria-label={`Marathi name row ${row.__row}`} value={overrides[index]?.student_name_mr ?? result?.student.student_name_mr ?? row[file.headers.find(h => file.mapping[h] === "student_name_mr")] ?? suggestMarathiName(normalizeStudentRow(row,file.mapping).name) ?? ""} onChange={e => { setOverrides({ ...overrides, [index]: { student_name_mr: e.target.value } }); invalidate(); }} /></td><td>{result ? <><ul>{[...result.errors, ...result.warnings].map(message => <li key={message}>{message}</li>)}</ul>{result.duplicate && <p>Existing: {result.duplicate.name} · GR {result.duplicate.grNo}</p>}{result.changes.map(c => <div key={c.field}><b>{c.field}</b>: {String(c.before) || "(blank)"} → {String(c.after)}</div>)}{!result.errors.length && !result.duplicate && "New student — valid"}</> : "Not validated"}</td><td>{result && <select aria-label={`Action row ${row.__row}`} value={choices[index] || (result.duplicate ? "review" : "create")} onChange={e => { setChoices({ ...choices, [index]: e.target.value }); resetPhotos(); }}><option value="skip">Skip</option>{result.duplicate ? <><option value="review">Review Manually</option><option value="update">Update Existing</option></> : <option value="create">Create new</option>}</select>}</td></tr>;
        })}</tbody></table></div><div className="import-actions"><button disabled={!page} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} / {Math.ceil(file.rows.length / 25)}</span><button disabled={(page + 1) * 25 >= file.rows.length} onClick={() => setPage(page + 1)}>Next</button></div>
        <div className="import-actions"><button className="school-button secondary" disabled={!review} onClick={() => exportRows(results.map(r => ({ Row: r.rowNumber, GR: r.student.grNo, Errors: r.errors.join("; "), Warnings: r.warnings.join("; "), Duplicate: r.duplicate?.grNo || "" })), "student-import-errors.xlsx")}>{t("Download Error Report")}</button><button disabled={!review} onClick={() => { setChoices(Object.fromEntries(results.filter(r => r.errors.length || r.duplicate).map(r => [r.index, "skip"]))); resetPhotos(); }}>Skip all errors and duplicates</button></div>
        <section className="combined-photo-import"><h3>Excel + Photo Folder</h3><p>Optional: match photos to the selected Excel students before saving. Example: Photo Number 1001 matches 1001.jpg. No names or phone numbers are used to match.</p>
          <div className="photo-upload-controls"><label>Photo folder with Excel<input aria-label="Photo folder with Excel" type="file" webkitdirectory="" multiple onChange={e=>{setPhotos([...e.target.files]);resetPhotos()}}/></label><label>Or select photos with Excel<input aria-label="Photos with Excel" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>{setPhotos([...e.target.files]);resetPhotos()}}/></label><label>Match photo filename to<select aria-label="Excel photo matching field" value={photoField} onChange={e=>{setPhotoField(e.target.value);resetPhotos()}}>{[['photoNumber','Photo Number'],['grNo','GR Number'],['admissionNo','Admission Number'],['id','Student ID']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></div>
          <p>{photos.length} photos selected · JPG / PNG / WebP · up to 5 MB each, 500 files. Missing photos may be added later.</p><button disabled={!photos.length||!ready} onClick={previewPhotos}>{photoBusy?'Checking photos…':'Preview Excel photo matches'}</button>{photos.length>0&&<button onClick={()=>{setPhotos([]);resetPhotos()}}>Remove selected photos</button>}
          {photoPlan&&<><p role="status">{photoPlan.rows.filter(r=>!r.error).length} matched · {photoPlan.rows.filter(r=>r.error).length} invalid / unmatched · {photoPlan.missing} imported students without a matched photo</p><div className="table-scroll"><table><thead><tr><th>File</th><th>Student / GR</th><th>Photo</th><th>Match result</th><th>Photo action</th></tr></thead><tbody>{photoPlan.rows.map(r=><tr key={r.index}><td>{r.name}</td><td>{r.student?.name} · {r.student?.grNo}</td><td>{r.photo&&!r.error&&<img src={r.photo} alt={r.student.name} width="40" height="48"/>}</td><td>{r.error||(r.existing?'Existing photo: confirm replacement':'Matched')}</td><td><select aria-label={'Photo action '+r.name} value={photoChoices[r.index]} onChange={e=>{setPhotoChoices({...photoChoices,[r.index]:e.target.value});setAcknowledged(false)}}><option value="review">Review required</option><option value="skip">Skip photo</option>{!r.error&&<option value="attach">{r.existing?'Replace existing photo':'Attach photo'}</option>}</select></td></tr>)}</tbody></table></div></>}
          <button className="school-link" onClick={()=>onNavigate('PhotoImport')}>Open photo-only importer for already saved students →</button>
        </section>
        <label className="review-ack"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} disabled={!ready||!photosReady} />I reviewed all rows and before/after changes. Save only the selected actions.</label>
        <button className="school-button" onClick={confirm} disabled={!ready || !photosReady || !acknowledged}>{t("Confirm Import")}</button>
      </section>
    </>}
    </fieldset><section className="school-panel workflow-panel"><h3>{t("Import history")}</h3>{readStored("erp_pro_import_history", []).slice().reverse().slice(0, 20).map(item => <p key={item.id}>{item.fileName} · {item.importedAt} · {item.successCount} added / {item.updatedCount || 0} updated</p>)}{!readStored("erp_pro_import_history", []).length && <p>No imports yet. Confirmed imports will appear here.</p>}</section>
  </div>;
}
