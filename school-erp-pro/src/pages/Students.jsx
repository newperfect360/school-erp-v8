import { notify } from "../components/Feedback";
import { useRef, useState } from "react";
import { useStoredState } from "../storage";
import { downloadErrorReport, downloadStudentTemplate, exportStudents, normalizeStudentRow, parseStudentFile, studentColumns, validateStudentRow } from "../services/excel";
import { normalizeParentMobile } from "../services/absenceCommunication";
import { recordAudit } from "../services/audit";

export default function Students() {
  const [imageLoading, setImageLoading] = useState(false);
  const photoInput = useRef(null);
  const [students, setStudents] = useStoredState("erp_pro_students", []);
  const [importHistory, setImportHistory] = useStoredState("erp_pro_import_history", []);
  const [importState, setImportState] = useState(null);
  const [duplicateMode, setDuplicateMode] = useState("skip");
  const [form, setForm] = useState({
    grNo: "",
    name: "",
    motherName: "",
    fatherName: "",
    className: "",
    division: "",
    rollNo: "",
    dob: "",
    gender: "Male",
    mobile: "",
    fatherMobile: "", motherMobile: "", guardianName: "", guardianMobile: "", alternateName: "", alternateMobile: "",
    address: "",
    bloodGroup: "",
    aadhaar: "",
    photo: "",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "photo") {
      if (!files?.[0]) return;
      if (!files[0].type.startsWith("image/") || files[0].size > 2 * 1024 * 1024) { notify("2 MB पेक्षा लहान image निवडा"); return; }
      setImageLoading(true);
      const reader = new FileReader();
      reader.onerror = () => { setImageLoading(false); notify("फोटो वाचता आला नाही. पुन्हा निवडा."); };
      reader.onload = () => { setForm(current => ({ ...current, photo: reader.result })); setImageLoading(false); };
      reader.readAsDataURL(files[0]);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const saveStudent = () => {
    if (imageLoading) { notify("फोटो तयार होत आहे. क्षणभर थांबा."); return; }
    if (!form.grNo.trim() || !form.name.trim() || !form.className.trim() || !form.mobile) {
      notify("GR No., विद्यार्थी नाव, इयत्ता आणि पालक मोबाईल भरा");
      return;
    }

    if (!/^\d{10}$/.test(form.mobile)) {
      notify("मोबाईल नंबर 10 अंकांचा असावा");
      return;
    }

    if (["fatherMobile", "motherMobile", "guardianMobile", "alternateMobile"].some(field => form[field] && !normalizeParentMobile(form[field]))) {
      notify("Check additional parent numbers. Use 10 digits for India or an international + country code.");
      return;
    }

    if (form.aadhaar && !/^\d{12}$/.test(form.aadhaar)) {
      notify("आधार नंबर 12 अंकांचा असावा");
      return;
    }

    if (students.some(s => s.grNo.trim() === form.grNo.trim())) {
      notify("हा GR No. आधीच नोंदवलेला आहे");
      return;
    }

    if (!setStudents([...students, { id: crypto.randomUUID(), ...form }])) return;

    setForm({
      grNo: "",
      name: "",
      motherName: "",
      fatherName: "",
      className: "",
      division: "",
      rollNo: "",
      dob: "",
      gender: "Male",
      mobile: "",
    fatherMobile: "", motherMobile: "", guardianName: "", guardianMobile: "", alternateName: "", alternateMobile: "",
      address: "",
      bloodGroup: "",
      aadhaar: "",
      photo: "",
    });

    notify("विद्यार्थी Save झाला");
  };

  const deleteStudent = (id) => {
    if (!confirm("हा विद्यार्थी हटवायचा आहे का?")) return;
    setStudents(students.filter((s) => s.id !== id));
  };

  const validateRows = (rows, mapping) => rows.map((row, index) => validateStudentRow(normalizeStudentRow(row, mapping), index + 2, students));

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseStudentFile(file);
      if (!parsed.rows.length) { notify("या fileमध्ये विद्यार्थी rows सापडल्या नाहीत."); return; }
      setImportState({ fileName: file.name, rows: parsed.rows, headers: parsed.headers, mapping: parsed.mapping, results: validateRows(parsed.rows, parsed.mapping) });
    } catch { notify("Excel/CSV file वाचता आली नाही."); }
    event.target.value = "";
  };

  const updateMapping = (header, field) => {
    if (!importState) return;
    const mapping = { ...importState.mapping, [header]: field };
    setImportState({ ...importState, mapping, results: validateRows(importState.rows, mapping) });
  };

  const confirmImport = () => {
    if (!importState) return;
    const valid = importState.results.filter((result) => result.errors.length === 0);
    const duplicateResults = valid.filter((result) => result.duplicate);
    const fresh = valid.filter((result) => !result.duplicate).map(({ student }) => ({ id: crypto.randomUUID(), ...student }));
    let nextStudents = [...students, ...fresh];
    let updatedCount = 0;
    if (duplicateMode === "update") {
      nextStudents = nextStudents.map((existing) => {
        const replacement = duplicateResults.find((result) => result.duplicate.id === existing.id)?.student;
        if (!replacement) return existing;
        updatedCount += 1;
        return { ...existing, ...replacement, id: existing.id };
      });
    }
    const skipped = duplicateMode === "skip" ? duplicateResults.length : 0;
    if (!setStudents(nextStudents)) return;
    const history = { id: crypto.randomUUID(), fileName: importState.fileName, importedAt: new Date().toISOString(), totalRows: importState.results.length, successCount: fresh.length, failedCount: importState.results.filter((result) => result.errors.length).length, updatedCount, duplicateCount: duplicateResults.length, mode: duplicateMode };
    setImportHistory([...importHistory, history]);
    recordAudit("विद्यार्थी Excel import", history);
    setImportState(null);
    notify(`${fresh.length} विद्यार्थी import झाले${updatedCount ? ` आणि ${updatedCount} नोंदी update झाल्या` : ""}${skipped ? `; ${skipped} duplicates skip झाले` : ""}.`);
  };

  const importErrors = importState?.results.filter((result) => result.errors.length > 0) || [];
  const duplicateCount = importState?.results.filter((result) => result.duplicate).length || 0;

  return (
    <div className="page module-page">
      <div className="module-heading"><div><span className="eyebrow">STUDENT DIRECTORY</span><h2>विद्यार्थी व्यवस्थापन</h2><p>विद्यार्थ्यांची वैयक्तिक माहिती आणि शालेय नोंदी</p></div><div className="module-count">{students.length}<span>एकूण नोंदी</span></div></div>

      <section className="import-studio" aria-label="विद्यार्थी Excel import">
        <div className="import-studio-heading"><div><span className="eyebrow">BULK DATA WORKSPACE</span><h3>Excel मधून विद्यार्थी नोंदी</h3><p>Template डाउनलोड करा, file upload करा, preview तपासा आणि मगच import करा.</p></div><div className="import-actions"><button className="button-muted" onClick={downloadStudentTemplate}>Template डाउनलोड</button><button className="button-muted" onClick={() => exportStudents(students)}>सर्व विद्यार्थी Export</button><label className="upload-button">Excel / CSV Upload<input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} /></label></div></div>
        {importState ? <div className="import-review">
          <div className="import-summary"><strong>{importState.fileName}</strong><span>{importState.results.length} rows</span><span className="valid">Valid {importState.results.filter((result) => !result.errors.length).length}</span><span className="invalid">Errors {importErrors.length}</span><span className="duplicate">Duplicates {duplicateCount}</span></div>
          <div className="mapping-grid"><div><h4>Column mapping</h4><p>Excel headings आणि Student Master fields जुळवा.</p></div>{importState.headers.map((header) => <label key={header}>{header}<select value={importState.mapping[header] || ""} onChange={(event) => updateMapping(header, event.target.value)}><option value="">Skip column</option>{studentColumns.map(([label, field]) => <option key={field} value={field}>{label}</option>)}</select></label>)}</div>
          {importErrors.length > 0 && <div className="import-errors"><div><strong>{importErrors.length} rows दुरुस्तीची गरज आहे</strong><button className="text-button" onClick={() => downloadErrorReport(importErrors)}>Error report डाउनलोड</button></div>{importErrors.slice(0, 5).map((result) => <span key={result.rowNumber}>Row {result.rowNumber}: {result.errors.join(", ")}</span>)}</div>}
          <div className="import-confirm"><label>Duplicate action<select value={duplicateMode} onChange={(event) => setDuplicateMode(event.target.value)}><option value="skip">Skip duplicate</option><option value="update">Update existing after confirmation</option></select></label><button className="button-muted" onClick={() => setImportState(null)}>Preview बंद करा</button><button onClick={confirmImport} disabled={!importState.results.some((result) => !result.errors.length)}>Confirm Import</button></div>
        </div> : <div className="import-dropzone"><span>1</span><p>Templateमध्ये data भरा</p><span>2</span><p>Upload करून validation पहा</p><span>3</span><p>Confirm केल्यावरच records save होतील</p></div>}
      </section>

      <section className="workflow-panel"><div className="panel-title"><h3>नवीन नोंद</h3><span>माहिती भरून खालील Save बटण वापरा</span></div><div className="form-grid">

          {[["Father Mobile", "fatherMobile"], ["Mother Mobile", "motherMobile"], ["Guardian Name", "guardianName"], ["Guardian Mobile", "guardianMobile"], ["Alternate Contact Name", "alternateName"], ["Alternate Contact Mobile", "alternateMobile"]].map(([label, field]) => <label key={field}>{label}<input name={field} type={field.endsWith("Mobile") ? "tel" : "text"} value={form[field] || ""} onChange={handleChange} /></label>)}
          <label>GR No.<input name="grNo" value={form.grNo} onChange={handleChange} /></label>
          <label>विद्यार्थ्याचे पूर्ण नाव<input name="name" value={form.name} onChange={handleChange} /></label>
          <label>आईचे नाव<input name="motherName" value={form.motherName} onChange={handleChange} /></label>
          <label>वडिलांचे नाव<input name="fatherName" value={form.fatherName} onChange={handleChange} /></label>
          <label>इयत्ता<input name="className" value={form.className} onChange={handleChange} /></label>
          <label>तुकडी<input name="division" value={form.division} onChange={handleChange} /></label>
          <label>रोल नंबर<input name="rollNo" value={form.rollNo} onChange={handleChange} /></label>
          <label>जन्म दिनांक<input type="date" name="dob" value={form.dob} onChange={handleChange} /></label>
          <label>लिंग
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option>Male</option>
                <option>Female</option>
              </select>
            </label>
          <label>पालक मोबाईल<input name="mobile" value={form.mobile} onChange={handleChange} maxLength="10" /></label>
          <label>पत्ता<input name="address" value={form.address} onChange={handleChange} /></label>
          <label>रक्तगट<input name="bloodGroup" value={form.bloodGroup} onChange={handleChange} /></label>
          <label>आधार नंबर<input name="aadhaar" value={form.aadhaar} onChange={handleChange} maxLength="12" /></label>
          <label>विद्यार्थी फोटो<input ref={photoInput} type="file" name="photo" accept="image/*" onChange={handleChange} /></label>

      </div></section>


      <button disabled={imageLoading} onClick={saveStudent}>Save Student</button>



      <h3 className="list-heading">जतन केलेल्या नोंदी <span>{students.length}</span></h3>{students.length === 0 && <div className="empty-state"><strong>अद्याप नोंदी नाहीत</strong><span>वरील form वापरून पहिली नोंद तयार करा.</span></div>}

      <div className="table-scroll"><table>
        <thead>
          <tr>
            <th>फोटो</th>
            <th>GR No.</th>
            <th>नाव</th>
            <th>आईचे नाव</th>
            <th>इयत्ता</th>
            <th>तुकडी</th>
            <th>रोल</th>
            <th>मोबाईल</th>
            <th>आधार</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>
                {s.photo ? (
                  <img src={s.photo} alt="student" width="50" height="60" />
                ) : "-"}
              </td>
              <td>{s.grNo}</td>
              <td>{s.name}</td>
              <td>{s.motherName}</td>
              <td>{s.className}</td>
              <td>{s.division}</td>
              <td>{s.rollNo}</td>
              <td>{s.mobile}</td>
              <td>{s.aadhaar}</td>
              <td>
                <button className="action-red" onClick={() => deleteStudent(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
