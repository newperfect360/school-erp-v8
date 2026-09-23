import {readStored} from "../storage";
import { studentColumns } from '../services/excel';
import { suggestMarathiName } from '../services/bilingualStudent';
import StudentContactFields from './StudentContactFields';
import { Avatar, PageHeading } from '../design/SchoolUI';
import { useLanguage } from '../design/language';

const sections = [
  ['01', 'Student identity', ['firstName','middleName','lastName','name','student_name_mr','dob','gender','bloodGroup']],
  ['02', 'Enrollment details', ['className','division','rollNo','grNo','admissionNo','admissionDate','academicYear','photoNumber','status']],
  ['03', 'Address & additional information', ['address','address_mr','previousSchool','category','scholarship','sports','healthNotes','aadhaar','father_name_mr','mother_name_mr']],
];
const labels = Object.fromEntries(studentColumns.map(([label,key]) => [key,label]));
const movementFields = ['className','division','rollNo','academicYear','status'];
export default function StudentForm({ form, setForm, onSave, onBack, onPhoto, busy, onLifecycle }) {
  const { t } = useLanguage();
  const classDivisions=(readStored("schoolSettings",{}).classDivisions||[]).filter(row=>!row.archivedAt&&row.academicYear===form.academicYear);
  const update = (key, value) => {
    const next = { ...form, [key]: value };
    if (['firstName','middleName','lastName'].includes(key)) {
      const oldParts = [form.firstName,form.middleName,form.lastName].filter(Boolean).join(' ');
      if (!form.name || form.name === oldParts) next.name = [next.firstName,next.middleName,next.lastName].filter(Boolean).join(' ');
    }
    if (next.name !== form.name && (!form.student_name_mr || form.student_name_mr === suggestMarathiName(form.name))) next.student_name_mr = suggestMarathiName(next.name);
    setForm(next);
  };
  return <div className="core-page student-entry"><button className="school-link" onClick={onBack}>← Student Master</button>
    <PageHeading eyebrow="STUDENT RECORDS" title={form.id ? 'Edit Student' : 'Add Student'} description="Enter the student’s details below. Required fields are marked *."/>
    <datalist id="configured-classes">{[...new Set(classDivisions.map(r=>r.className))].map(value=><option key={value} value={value}/>)}</datalist><datalist id="configured-divisions">{[...new Set(classDivisions.filter(r=>r.className===form.className).map(r=>r.division))].map(value=><option key={value} value={value}/>)}</datalist><form onSubmit={e => { e.preventDefault(); onSave(); }}>
      <section className="student-photo-band"><Avatar name={form.name} photo={form.photo} size="portrait"/><div><h2>Student photograph</h2><p>JPG, PNG or WebP · up to 1 MB</p><label className="school-button secondary">Choose photo<input aria-label="Student photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhoto}/></label>{busy && <span role="status">Reading photograph…</span>}</div></section>
      {sections.map(([number,title,fields],index) => <div key={title}>
        <section className="school-panel student-form-section"><header><span>{number}</span><div><h2>{title}</h2>{index === 1 && form.id && <p>Enrollment changes use a reviewed action so earlier records remain intact. <button type="button" className="school-link" onClick={onLifecycle}>Open lifecycle history</button></p>}</div></header><div className="form-grid">{fields.map(key => <label className={['address','address_mr','healthNotes'].includes(key)?'form-full':''} key={key}>{t(labels[key])}{['name','grNo','className'].includes(key) ? ' *' : ''}<input name={key} list={key==="className"?"configured-classes":key==="division"?"configured-divisions":undefined} type={['dob','admissionDate'].includes(key)?'date':'text'} value={form[key] || ''} readOnly={!!form.id && movementFields.includes(key)} onChange={e => update(key,e.target.value)} placeholder={key==='academicYear'?'2026-27':undefined}/></label>)}</div>
        {index === 0 && <div className="marathi-review"><h3>English | Marathi preview</h3><div><span>{form.name || 'Enter the English name'}</span><span lang="mr">{form.student_name_mr || 'मराठी नाव लिहा'}</span></div><p>Known names receive an automatic offline suggestion. Review and correct the Marathi field before saving. Unrecognized names and address translation need manual entry; English values are retained.</p><button type="button" className="school-link" onClick={() => setForm({...form, student_name_mr:form.student_name_mr || suggestMarathiName(form.name),father_name_mr:form.father_name_mr || suggestMarathiName(form.fatherName),mother_name_mr:form.mother_name_mr || suggestMarathiName(form.motherName)})}>Suggest Marathi names (review required)</button></div>}
        </section>{index === 1 && <section className="school-panel student-form-section"><StudentContactFields form={form} setForm={setForm}/></section>}
      </div>)}
      <footer className="student-form-footer"><p>At least one parent or emergency number is required.</p><button type="button" className="school-button secondary" onClick={onBack}>Cancel</button><button className="school-button" aria-label="Save Student" disabled={busy} type="submit">Save student</button></footer>
    </form>
  </div>;
}
