import { useRef, useState } from "react";
import { useStoredState } from "../storage";

export default function Students() {
  const photoInput = useRef(null);
  const [students, setStudents] = useStoredState("erp_pro_students", []);
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
    address: "",
    bloodGroup: "",
    aadhaar: "",
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

  const saveStudent = () => {
    if (!form.grNo.trim() || !form.name.trim() || !form.className.trim() || !form.mobile) {
      alert("GR No., विद्यार्थी नाव, इयत्ता आणि पालक मोबाईल भरा");
      return;
    }

    if (!/^\d{10}$/.test(form.mobile)) {
      alert("मोबाईल नंबर 10 अंकांचा असावा");
      return;
    }

    if (form.aadhaar && !/^\d{12}$/.test(form.aadhaar)) {
      alert("आधार नंबर 12 अंकांचा असावा");
      return;
    }

    if (students.some(s => s.grNo.trim() === form.grNo.trim())) {
      alert("हा GR No. आधीच नोंदवलेला आहे");
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
      address: "",
      bloodGroup: "",
      aadhaar: "",
      photo: "",
    });

    alert("विद्यार्थी Save झाला");
  };

  const deleteStudent = (id) => {
    if (!confirm("हा विद्यार्थी हटवायचा आहे का?")) return;
    setStudents(students.filter((s) => s.id !== id));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🎓 Student Management Professional</h2>

      <table>
        <tbody>
          <tr>
            <td>GR No.</td>
            <td><input name="grNo" value={form.grNo} onChange={handleChange} /></td>
          </tr>
          <tr>
            <td>विद्यार्थ्याचे पूर्ण नाव</td>
            <td><input name="name" value={form.name} onChange={handleChange} /></td>
          </tr>
          <tr>
            <td>आईचे नाव</td>
            <td><input name="motherName" value={form.motherName} onChange={handleChange} /></td>
          </tr>
          <tr>
            <td>वडिलांचे नाव</td>
            <td><input name="fatherName" value={form.fatherName} onChange={handleChange} /></td>
          </tr>
          <tr>
            <td>इयत्ता</td>
            <td><input name="className" value={form.className} onChange={handleChange} /></td>
          </tr>
          <tr>
            <td>तुकडी</td>
            <td><input name="division" value={form.division} onChange={handleChange} /></td>
          </tr>
          <tr>
            <td>रोल नंबर</td>
            <td><input name="rollNo" value={form.rollNo} onChange={handleChange} /></td>
          </tr>
          <tr>
            <td>जन्म दिनांक</td>
            <td><input type="date" name="dob" value={form.dob} onChange={handleChange} /></td>
          </tr>
          <tr>
            <td>लिंग</td>
            <td>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option>Male</option>
                <option>Female</option>
              </select>
            </td>
          </tr>
          <tr>
            <td>पालक मोबाईल</td>
            <td><input name="mobile" value={form.mobile} onChange={handleChange} maxLength="10" /></td>
          </tr>
          <tr>
            <td>पत्ता</td>
            <td><input name="address" value={form.address} onChange={handleChange} /></td>
          </tr>
          <tr>
            <td>रक्तगट</td>
            <td><input name="bloodGroup" value={form.bloodGroup} onChange={handleChange} /></td>
          </tr>
          <tr>
            <td>आधार नंबर</td>
            <td><input name="aadhaar" value={form.aadhaar} onChange={handleChange} maxLength="12" /></td>
          </tr>
          <tr>
            <td>विद्यार्थी फोटो</td>
            <td><input ref={photoInput} type="file" name="photo" accept="image/*" onChange={handleChange} /></td>
          </tr>
        </tbody>
      </table>

      <br />
      <button onClick={saveStudent}>Save Student</button>

      <br /><br />

      <h3>Saved Students</h3>

      <table border="1" cellPadding="8" style={{ width: "100%" }}>
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
                <button onClick={() => deleteStudent(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}