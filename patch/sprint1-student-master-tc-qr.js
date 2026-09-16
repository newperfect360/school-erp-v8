
/* Sprint 1: Student Master + TC Details + Photo + QR
   Add before </body>:
   <script src="patch/sprint1-student-master-tc-qr.js"></script>
*/

(function(){
const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));
const display = student => Object.fromEntries(Object.entries(student).map(([k,v]) => [k, typeof v === "string" ? escape(v) : v]));
const STORE = "erp_student_master_v1";

function uid(){ return "STU-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,6); }
function load(){ try{return JSON.parse(localStorage.getItem(STORE)||"[]")}catch(e){return []} }
function save(data){ localStorage.setItem(STORE, JSON.stringify(data)); }

function qrUrl(text){
  const code = qrcode(0, "M");
  qrcode.stringToBytes = value => Array.from(new TextEncoder().encode(value));
  code.addData(text);
  code.make();
  return code.createDataURL(4, 16);
}

function profileUrl(s){
  const base = location.origin + location.pathname;
  return base + "#verify-student=" + encodeURIComponent(s.id);
}

function renderStudentMaster(){
  let html = `
  <section id="student360" class="page">
    <div class="card">
      <h2>🎓 Student 360° Profile / TC Details / Photo / QR</h2>
      <div class="form">
        <input id="sm_name" placeholder="विद्यार्थ्याचे पूर्ण नाव">
        <input id="sm_mother" placeholder="आईचे नाव">
        <input id="sm_father" placeholder="वडिलांचे नाव">
        <input id="sm_class" placeholder="इयत्ता">
        <input id="sm_roll" placeholder="हजेरी क्रमांक">
        <input id="sm_admissionNo" placeholder="प्रवेश क्रमांक / GR No">
        <input id="sm_udise" placeholder="UDISE Student ID">
        <input id="sm_aadhaar" placeholder="आधार क्रमांक">
        <input id="sm_dob" placeholder="जन्म दिनांक">
        <input id="sm_birthPlace" placeholder="जन्मस्थळ">
        <input id="sm_religion" placeholder="धर्म">
        <input id="sm_caste" placeholder="जात">
        <input id="sm_subCaste" placeholder="उपजात">
        <input id="sm_nationality" placeholder="राष्ट्रीयत्व" value="भारतीय">
        <input id="sm_motherTongue" placeholder="मातृभाषा" value="मराठी">
        <input id="sm_previousSchool" placeholder="पूर्वीची शाळा">
        <input id="sm_admissionDate" placeholder="प्रवेश दिनांक">
        <input id="sm_currentClass" placeholder="सध्याची इयत्ता">
        <input id="sm_progress" placeholder="प्रगती" value="बरी">
        <input id="sm_conduct" placeholder="वर्तणूक" value="चांगली">
        <input id="sm_leavingDate" placeholder="शाळा सोडल्याचा दिनांक">
        <input id="sm_leavingReason" placeholder="शाळा सोडण्याचे कारण">
        <input id="sm_parentMobile" placeholder="पालक मोबाईल 917507514475">
        <input id="sm_address" placeholder="पत्ता">
        <input id="sm_photo" type="file" accept="image/*">
        <button onclick="ERPStudent.saveStudent()">Save Student</button>
        <button onclick="ERPStudent.importSample()">Import 34 Test Students</button>
        <button onclick="ERPStudent.backup()">Backup Students</button>
      </div>
      <div id="sm_preview"></div>
      <table id="sm_table"></table>
    </div>
  </section>`;
  document.querySelector("main")?.insertAdjacentHTML("afterbegin", html);
  renderTable();
}

async function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    if(!file) return resolve("");
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.onerror=reject;
    r.readAsDataURL(file);
  });
}

async function saveStudent(){
  const data = load();
  if (!sm_name.value.trim() || !sm_admissionNo.value.trim()) { alert("नाव आणि प्रवेश क्रमांक भरा"); return; }
  if(data.some(s => s.admissionNo === sm_admissionNo.value.trim())) { alert("प्रवेश क्रमांक आधीच नोंदवलेला आहे"); return; }
  const f = document.getElementById("sm_photo")?.files?.[0];
  const photo = await fileToBase64(f);
  const s = {
    id: uid(),
    name: sm_name.value, mother: sm_mother.value, father: sm_father.value,
    className: sm_class.value, roll: sm_roll.value, admissionNo: sm_admissionNo.value,
    udise: sm_udise.value, aadhaar: sm_aadhaar.value, dob: sm_dob.value,
    birthPlace: sm_birthPlace.value, religion: sm_religion.value, caste: sm_caste.value,
    subCaste: sm_subCaste.value, nationality: sm_nationality.value, motherTongue: sm_motherTongue.value,
    previousSchool: sm_previousSchool.value, admissionDate: sm_admissionDate.value,
    currentClass: sm_currentClass.value, progress: sm_progress.value, conduct: sm_conduct.value,
    leavingDate: sm_leavingDate.value, leavingReason: sm_leavingReason.value,
    parentMobile: sm_parentMobile.value, address: sm_address.value, photo,
    qr: ""
  };
  s.qr = qrUrl(profileUrl(s));
  data.push(s);
  save(data);
  renderTable();
  alert("Student Master + TC Details + Photo + QR Save झाले.");
}

function renderTable(){
  const data=load().map(display);
  const el=document.getElementById("sm_table");
  if(!el) return;
  el.innerHTML = `<tr><th>Photo</th><th>QR</th><th>Name</th><th>Class</th><th>GR</th><th>TC Details</th><th>Action</th></tr>` +
    data.map(s=>`<tr>
      <td>${s.photo?`<img src="${s.photo}" class="sm-photo">`:"-"}</td>
      <td><img src="${qrUrl(profileUrl(s))}" class="sm-qr"></td>
      <td>${s.name||""}</td><td>${s.className||s.currentClass||""}</td><td>${s.admissionNo||""}</td>
      <td>${s.religion||""} / ${s.caste||""} / ${s.dob||""}</td>
      <td><button data-student-id="${s.id}">Preview</button></td>
    </tr>`).join("");
}

document.addEventListener("click", event => { const button = event.target.closest("button[data-student-id]"); if(button) preview(button.dataset.studentId); });

function preview(id){
  const raw=load().find(x=>x.id===id);
  const s=raw && display(raw);
  if(!s) return;
  sm_preview.innerHTML = `
    <div class="student-card">
      <div>${s.photo?`<img src="${s.photo}" class="profile-photo">`:""}</div>
      <div>
        <h3>${s.name}</h3>
        <p>इयत्ता: ${s.className||s.currentClass} | हजेरी क्र.: ${s.roll} | प्रवेश क्र.: ${s.admissionNo}</p>
        <p>आई: ${s.mother} | वडील: ${s.father}</p>
        <p>जन्म दिनांक: ${s.dob} | जात: ${s.caste} | धर्म: ${s.religion}</p>
        <p>पालक मोबाईल: ${s.parentMobile}</p>
      </div>
      <div><img src="${qrUrl(profileUrl(s))}" class="profile-qr"><br><small>Digital Verification QR</small></div>
    </div>`;
}

function importSample(){
  const sample = [];
  for(let i=1;i<=34;i++){
    const s = {
      id: uid(), name: "विद्यार्थी नमुना " + i, mother:"आईचे नाव", father:"वडिलांचे नाव",
      className:"5वी", roll:String(i), admissionNo:"GR-"+String(1200+i),
      udise:"", aadhaar:"", dob:"", birthPlace:"", religion:"", caste:"", subCaste:"",
      nationality:"भारतीय", motherTongue:"मराठी", previousSchool:"", admissionDate:"",
      currentClass:"5वी", progress:"बरी", conduct:"चांगली", leavingDate:"",
      leavingReason:"", parentMobile:"917507514475", address:"", photo:""
    };
    s.qr = qrUrl(profileUrl(s));
    sample.push(s);
  }
  const existing = load();
  const ids = new Set(existing.map(s => s.admissionNo));
  save([...existing, ...sample.filter(s => !ids.has(s.admissionNo))]);
  renderTable();
  alert("34 Test Students Import झाले.");
}

function backup(){
  const b = new Blob([JSON.stringify(load(),null,2)], {type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(b);
  a.download="student_master_tc_photo_qr_backup.json";
  a.click();
}

function verifyFromHash(){
  const hash = location.hash || "";
  if(!hash.startsWith("#verify-student=")) return;
  let id;
  try { id = decodeURIComponent(hash.replace("#verify-student=","")); } catch { id = ""; }
  const raw = load().find(x=>x.id===id);
  const s = raw && display(raw);
  document.body.innerHTML = `<div class="verify-page">
    <h1>✅ Digital Student Verification</h1>
    ${s ? `
      ${s.photo?`<img src="${s.photo}" class="profile-photo">`:""}
      <h2>${s.name}</h2>
      <p>इयत्ता: ${s.className||s.currentClass}</p>
      <p>प्रवेश क्रमांक: ${s.admissionNo}</p>
      <p>शाळा: स्व. गुरुबक्षसिंग साबरवाल माध्यमिक व उच्च माध्यमिक विद्यालय</p>
      <h3>Verification Status: VALID</h3>
    ` : `<h2>Record Not Found</h2>`}
  </div>`;
}

window.addEventListener("hashchange", () => {
  if (location.hash.startsWith("#verify-student=")) verifyFromHash();
  else if (document.querySelector(".verify-page")) location.reload();
});

window.ERPStudent = {saveStudent, importSample, preview, backup, renderTable};

document.addEventListener("DOMContentLoaded", ()=>{
  if (location.hash.startsWith("#verify-student=")) { verifyFromHash(); return; }
  renderStudentMaster();
});
})();
