import {exportRows} from '../services/excel';
import { notify } from "../components/Feedback";
import { useState } from "react";
import {useSharedRecords} from "../backend/useSharedRecords";

export default function Classwork() {
  const [query,setQuery]=useState("");
  const [items, setItems] = useSharedRecords("homework","erp_pro_classwork",{kind:"classwork"});
  const [form, setForm] = useState({ date: "", className: "", division: "", subject: "", teacher: "", classwork: "", mobile: "" });

  const save = async () => {
    if (!form.date || !form.division.trim() || !form.className.trim() || !form.subject.trim() || !form.classwork.trim()) {
      notify("इयत्ता, विषय आणि वर्गपाठ भरा");
      return;
    }
    if (!await setItems(form.id?items.map(row=>row.id===form.id?form:row):[...items, { ...form, id: crypto.randomUUID() }])) return;
    setForm({ date: "", className: "", division: "", subject: "", teacher: "", classwork: "", mobile: "" });
  };

  const sendWhatsApp = (c) => {
    const msg = `वर्गपाठ सूचना\nदिनांक: ${c.date}\nइयत्ता: ${c.className}\nविषय: ${c.subject}\nवर्गात शिकवले: ${c.classwork}\n- शिक्षक: ${c.teacher}`;
    if (!/^(?:\+?91)?\d{10}$/.test(c.mobile.trim())) { notify("वैध 10 अंकी मोबाईल नंबर भरा"); return; }
    window.open(`https://wa.me/91${c.mobile.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="page">
      <div className="module-heading"><div><span className="eyebrow">SCHOOL WORKSPACE</span><h2>वर्गपाठ</h2><p>वर्गात शिकवलेल्या विषयांच्या नोंदी</p></div></div>
      <div className="form-grid">
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <label>इयत्ता<input placeholder="इयत्ता" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} /></label>
        <label>विषय<input placeholder="विषय" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
        <label>शिक्षक नाव<input placeholder="शिक्षक नाव" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} /></label>
        <label>Division<input value={form.division} onChange={e=>setForm({...form,division:e.target.value})}/></label><label>WhatsApp Mobile<input placeholder="WhatsApp Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></label>
        <label>वर्गपाठ<textarea placeholder="वर्गपाठ" value={form.classwork} onChange={(e) => setForm({ ...form, classwork: e.target.value })}></textarea></label>
      </div>
      <button onClick={save}>Save Classwork</button>

      <label>Search classwork<input value={query} onChange={e=>setQuery(e.target.value)}/></label><button onClick={()=>exportRows(items.filter(row=>Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())),"classwork.xlsx")}>Export Classwork</button><div className="table-scroll"><table>
        <thead>
          <tr><th>दिनांक</th><th>इयत्ता</th><th>विषय</th><th>वर्गपाठ</th><th>WhatsApp</th></tr>
        </thead>
        <tbody>
          {items.filter(row=>Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())).map((c) => (
            <tr key={c.id}>
              <td>{c.date}</td><td>{c.className}</td><td>{c.subject}</td><td>{c.classwork}</td>
              <td><button onClick={()=>setForm({...c})}>Edit Classwork</button><button onClick={async()=>{if(confirm("Archive this classwork?"))await setItems(items.filter(row=>row.id!==c.id));}}>Archive Classwork</button><button onClick={() => sendWhatsApp(c)}>WhatsApp पाठवा</button></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {items.length === 0 && <div className="empty-state"><strong>No classwork recorded yet</strong><span>Add a lesson above to build the class learning register.</span></div>}
    </div>
  );
}

