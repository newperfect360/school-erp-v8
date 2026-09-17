import { notify } from "../components/Feedback";
import { useRef, useState } from "react";
import { useStoredState } from "../storage";

export default function Teachers() {
  const [imageLoading, setImageLoading] = useState(false);
  const photoInput = useRef(null);
  const [teachers, setTeachers] = useStoredState("erp_pro_teachers", []);
  const [form, setForm] = useState({
    name: "",
    designation: "",
    subject: "",
    mobile: "",
    email: "",
    address: "",
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

  const saveTeacher = () => {
    if (imageLoading) { notify("फोटो तयार होत आहे. क्षणभर थांबा."); return; }
    if (!form.name.trim() || !form.mobile || !form.subject.trim()) {
      notify("शिक्षक नाव, मोबाईल आणि विषय भरा");
      return;
    }

    if (!/^\d{10}$/.test(form.mobile)) { notify("मोबाईल नंबर 10 अंकांचा असावा"); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { notify("Email चुकीचा आहे"); return; }
    if (!setTeachers([...teachers, { id: crypto.randomUUID(), ...form }])) return;

    setForm({
      name: "",
      designation: "",
      subject: "",
      mobile: "",
      email: "",
      address: "",
      photo: "",
    });

    notify("शिक्षक Save झाले");
  };

  return (
    <div className="page module-page">
      <div className="module-heading"><div><span className="eyebrow">TEACHER DIRECTORY</span><h2>शिक्षक व्यवस्थापन</h2><p>शिक्षकांची माहिती, विषय आणि संपर्क नोंदी</p></div><div className="module-count">{teachers.length}<span>एकूण नोंदी</span></div></div>

      <section className="workflow-panel"><div className="panel-title"><h3>नवीन नोंद</h3><span>माहिती भरून खालील Save बटण वापरा</span></div><div className="form-grid">

          <label>शिक्षक पूर्ण नाव<input name="name" value={form.name} onChange={handleChange} /></label>

          <label>पद<input name="designation" value={form.designation} onChange={handleChange} /></label>

          <label>विषय<input name="subject" value={form.subject} onChange={handleChange} /></label>

          <label>मोबाईल<input name="mobile" value={form.mobile} onChange={handleChange} /></label>

          <label>Email<input name="email" value={form.email} onChange={handleChange} /></label>

          <label>पत्ता<input name="address" value={form.address} onChange={handleChange} /></label>

          <label>फोटो<input ref={photoInput} type="file" name="photo" accept="image/*" onChange={handleChange} /></label>

      </div></section>


      <button disabled={imageLoading} onClick={saveTeacher}>Save Teacher</button>


      <h3 className="list-heading">जतन केलेल्या नोंदी <span>{teachers.length}</span></h3>{teachers.length === 0 && <div className="empty-state"><strong>अद्याप नोंदी नाहीत</strong><span>वरील form वापरून पहिली नोंद तयार करा.</span></div>}

      <div className="table-scroll"><table>
        <thead>
          <tr>
            <th>फोटो</th>
            <th>नाव</th>
            <th>पद</th>
            <th>विषय</th>
            <th>मोबाईल</th>
            <th>Email</th>
          </tr>
        </thead>

        <tbody>
          {teachers.map((t) => (
            <tr key={t.id}>
              <td>
                {t.photo ? <img src={t.photo} alt="teacher" width="50" height="60" /> : "-"}
              </td>
              <td>{t.name}</td>
              <td>{t.designation}</td>
              <td>{t.subject}</td>
              <td>{t.mobile}</td>
              <td>{t.email}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
