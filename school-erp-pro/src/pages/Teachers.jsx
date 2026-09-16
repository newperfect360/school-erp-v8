import { useRef, useState } from "react";
import { useStoredState } from "../storage";

export default function Teachers() {
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
      if (!files[0].type.startsWith("image/") || files[0].size > 2 * 1024 * 1024) { alert("2 MB पेक्षा लहान image निवडा"); return; }
      const reader = new FileReader();
      reader.onload = () => setForm(current => ({ ...current, photo: reader.result }));
      reader.readAsDataURL(files[0]);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const saveTeacher = () => {
    if (!form.name.trim() || !form.mobile || !form.subject.trim()) {
      alert("शिक्षक नाव, मोबाईल आणि विषय भरा");
      return;
    }

    if (!/^\d{10}$/.test(form.mobile)) { alert("मोबाईल नंबर 10 अंकांचा असावा"); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { alert("Email चुकीचा आहे"); return; }
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

    alert("शिक्षक Save झाले");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>👨‍🏫 Teacher Management</h2>

      <table>
        <tbody>
          <tr>
            <td>शिक्षक पूर्ण नाव</td>
            <td><input name="name" value={form.name} onChange={handleChange} /></td>
          </tr>

          <tr>
            <td>पद</td>
            <td><input name="designation" value={form.designation} onChange={handleChange} /></td>
          </tr>

          <tr>
            <td>विषय</td>
            <td><input name="subject" value={form.subject} onChange={handleChange} /></td>
          </tr>

          <tr>
            <td>मोबाईल</td>
            <td><input name="mobile" value={form.mobile} onChange={handleChange} /></td>
          </tr>

          <tr>
            <td>Email</td>
            <td><input name="email" value={form.email} onChange={handleChange} /></td>
          </tr>

          <tr>
            <td>पत्ता</td>
            <td><input name="address" value={form.address} onChange={handleChange} /></td>
          </tr>

          <tr>
            <td>फोटो</td>
            <td><input ref={photoInput} type="file" name="photo" accept="image/*" onChange={handleChange} /></td>
          </tr>
        </tbody>
      </table>

      <br />
      <button onClick={saveTeacher}>Save Teacher</button>

      <br /><br />
      <h3>Saved Teachers</h3>

      <table border="1" cellPadding="8" style={{ width: "100%" }}>
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
      </table>
    </div>
  );
}