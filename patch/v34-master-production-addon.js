
/* School ERP V34 Master Production Addon
   Certificates + WhatsApp/SMS Templates + Header Patch
   Add this before </body>: <script src="patch/v34-master-production-addon.js"></script>
*/
(function(){
const SETTINGS = {
  sansthaName:window.SCHOOL_IDENTITY.sansthaName,
  managedBy:"",
  schoolName:window.SCHOOL_IDENTITY.schoolName,
  address:window.SCHOOL_IDENTITY.address,
  email:"late.gbsschoolnaigaon03@gmail.com",
  medium:"मराठी",
  academicYear:"2025 - 26",
  classTeacher:"श्री. पवार डी. एम.",
  subjectTeacher:"",
  principal:"मुख्याध्यापक",
  clerk:"वरिष्ठ लिपिक",
  slogan:"विद्यार्थ्यांची गुणवत्ता, शिस्त आणि सर्वांगीण विकास हेच आमचे ध्येय."
};

const MSG_TEMPLATES = {
homework:`🏫 {SANSTHA}
{SCHOOL}
{ADDRESS}

आदरणीय पालक,
इयत्ता {CLASS} {SUBJECT} विषयाची आजची माहिती:
वर्गात झालेले अध्यापन: {CLASSWORK}
दिलेला गृहपाठ: {HOMEWORK}

विद्यार्थ्यांच्या शैक्षणिक प्रगतीसाठी आपले सहकार्य अपेक्षित आहे.

विषय शिक्षक: {SUBJECT_TEACHER}
वर्गशिक्षक: {CLASS_TEACHER}
{SCHOOL}
🌟 {SLOGAN}`,
attendance_P:`🏫 {SCHOOL}
आदरणीय पालक,
{STUDENT} दिनांक {DATE} रोजी शाळेत उपस्थित आहे.

वर्गशिक्षक: {CLASS_TEACHER}
🌟 {SLOGAN}`,
attendance_A:`🏫 {SCHOOL}
आदरणीय पालक,
{STUDENT} दिनांक {DATE} रोजी शाळेत अनुपस्थित आहे. कृपया अनुपस्थितीचे कारण वर्गशिक्षकांना कळवावे.

वर्गशिक्षक: {CLASS_TEACHER}
🌟 {SLOGAN}`,
attendance_H:`🏫 {SCHOOL}
{STUDENT} दिनांक {DATE} रोजी अर्धा दिवस उपस्थित आहे.
वर्गशिक्षक: {CLASS_TEACHER}`,
attendance_L:`🏫 {SCHOOL}
{STUDENT} दिनांक {DATE} रोजी उशिरा उपस्थित झाला/झाली.
वर्गशिक्षक: {CLASS_TEACHER}`,
fees:`🏫 {SCHOOL}
आदरणीय पालक,
{STUDENT} यांची फी ₹{BALANCE} बाकी आहे. कृपया लवकरात लवकर भरणा करावा.
कार्यालय - {SCHOOL}`,
notice:`🏫 {SANSTHA}
संचलित
{SCHOOL}

सर्व विद्यार्थी व पालकांना सूचित करण्यात येते की {NOTICE}

🌟 {SLOGAN}`
};

function getStudents(){
  try { return JSON.parse(localStorage.getItem("v32_students")||localStorage.getItem("students")||"[]"); } catch(e){ return []; }
}
function getSettings(){
  let s = {};
  try { s = JSON.parse(localStorage.getItem("v32_settings")||"{}"); } catch(e){}
  return window.resolveLegacySchoolIdentity(Object.assign({}, SETTINGS, s));
}
function saveDefaults(){
  localStorage.setItem("v34_school_settings", JSON.stringify(getSettings()));
  const old = JSON.parse(localStorage.getItem("v32_templates")||"{}");
  localStorage.setItem("v32_templates", JSON.stringify(Object.assign({}, MSG_TEMPLATES, old)));
  localStorage.setItem("v34_templates", JSON.stringify(Object.assign({}, MSG_TEMPLATES, old)));
}
function headerHtml(s){
  return `<div class="v34-letterhead"><img src="assets/school-logo.jpg" alt="School logo" style="width:72px;height:78px;object-fit:contain">
    <div class="trust" style="white-space:pre-line">${s.sansthaName}</div>
    <div class="managed">${s.managedBy}</div>
    <div class="school">${s.schoolName}</div>
    <div class="addr">${s.address}</div>
    <div class="sub">ई-मेल: ${s.email} | माध्यम: ${s.medium} | शैक्षणिक वर्ष: ${s.academicYear}</div>
  </div>`;
}
function applyTopHeader(){
  const s=getSettings();
  if(!document.querySelector(".v34-main-header")){
    document.body.insertAdjacentHTML("afterbegin", `<div class="v34-main-header">${headerHtml(s)}</div>`);
  }
}
function studentName(s){ return s.name || s.studentName || ""; }
function studentMother(s){ return s.mother || s.motherName || ""; }
function studentClass(s){ return s.className || s.class || ""; }
function studentRoll(s){ return s.roll || s.rollNo || ""; }
function studentAdm(s){ return s.admissionNo || s.admission || ""; }
function studentDob(s){ return s.dob || ""; }

function certBonafide(s, reason){
  const g=getSettings();
  return `<div class="v34-cert">
    ${headerHtml(g)}
    <h2>बोनाफाईड प्रमाणपत्र</h2>
    <p class="cert-text">प्रमाणित करण्यात येते की, कुमार/कुमारी <b>${studentName(s)}</b> हा/ही विद्यार्थी/विद्यार्थिनी शैक्षणिक वर्ष <b>${g.academicYear}</b> मध्ये इयत्ता <b>${studentClass(s)}</b> मध्ये शिकत असून त्याचा/तिचा हजेरी क्र. <b>${studentRoll(s)}</b> व प्रवेश क्र. <b>${studentAdm(s)}</b> आहे. त्याची/तिची जन्मतारीख <b>${studentDob(s)}</b> ही आहे. करिता सन <b>${g.academicYear}</b> साठी बोनाफाईड प्रमाणपत्र देण्यात येत आहे.</p>
    <p><b>कारण/उद्देश:</b> ${reason||""}</p>
    <div class="sign-row"><span>${g.clerk}</span><span>${g.principal}</span></div>
  </div>`;
}
function certLC(s, reason){
  const g=getSettings();
  const rows = [
    ["जनरल रजिस्टर क्र.", studentAdm(s)], ["विद्यार्थ्याचे संपूर्ण नाव", studentName(s)],
    ["आईचे नाव", studentMother(s)], ["राष्ट्रीयत्व", "भारतीय"], ["मातृभाषा", "मराठी"],
    ["धर्म", s.religion||""], ["जात", s.caste||""], ["जन्मदिनांक", studentDob(s)],
    ["प्रवेश दिनांक", s.admissionDate||""], ["इयत्ता", studentClass(s)], ["प्रगती", "बरी"],
    ["वर्तणूक", "चांगली"], ["शाळा सोडल्याचा दिनांक", ""], ["शाळा सोडण्याचे कारण", reason||""],
    ["शेरा", ""]
  ];
  return `<div class="v34-cert">${headerHtml(g)}<h2>शाळा सोडल्याचे प्रमाणपत्र</h2>
    <table class="v34-table">${rows.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join("")}</table>
    <p class="cert-text">दाखला देण्यात येतो की, वरील माहिती शाळेतील प्रवेश निर्गम प्रमाणे खरी आहे.</p>
    <div class="sign-row"><span>${g.clerk}</span><span>${g.principal}</span></div></div>`;
}
function certExtract(s, reason){
  const g=getSettings();
  const rows = [
    ["प्रवेश क्रमांक", studentAdm(s)], ["विद्यार्थ्याचे नाव", studentName(s)],
    ["आईचे नाव", studentMother(s)], ["धर्म", s.religion||""], ["जात", s.caste||""],
    ["जन्मदिनांक", studentDob(s)], ["प्रवेश दिनांक", s.admissionDate||""],
    ["निर्गम दिनांक", ""], ["शाळा सोडण्याचे कारण", reason||""], ["शेरा", ""]
  ];
  return `<div class="v34-cert">${headerHtml(g)}<h2>विद्यार्थी प्रवेश/निर्गम उतारा</h2>
    <table class="v34-table">${rows.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join("")}</table>
    <div class="sign-row"><span>${g.clerk}</span><span>${g.principal}</span></div></div>`;
}
window.v34GenerateCertificate = function(){
  const students = getStudents();
  const select = document.getElementById("certStudent");
  const type = document.getElementById("certType");
  const reason = (document.getElementById("certReason")||{}).value || "";
  const box = document.getElementById("certBox") || document.querySelector(".certBox") || document.querySelector("#certificateBox");
  if(!select || !type || !box){ alert("Certificate fields सापडले नाहीत."); return; }
  const s = students.find(x=>x.id==select.value) || students[select.selectedIndex] || {};
  const t = (type.value||"").toLowerCase();
  if(t.includes("leaving")) box.innerHTML = certLC(s, reason);
  else if(t.includes("extract") || t.includes("निर्गम") || t.includes("admission")) box.innerHTML = certExtract(s, reason);
  else box.innerHTML = certBonafide(s, reason);
};
function patchCertificateButton(){
  document.querySelectorAll("button").forEach(b=>{
    if((b.innerText||"").toLowerCase().includes("generate")) b.onclick = window.v34GenerateCertificate;
  });
}
window.v34BuildMessage = function(kind, data){
  const g=getSettings();
  const t = JSON.parse(localStorage.getItem("v34_templates")||JSON.stringify(MSG_TEMPLATES))[kind] || "";
  return t.replace(/\{(\w+)\}/g,(m,k)=>({
    SANSTHA:g.sansthaName,SCHOOL:g.schoolName,ADDRESS:g.address,SLOGAN:g.slogan,
    CLASS_TEACHER:g.classTeacher,SUBJECT_TEACHER:g.subjectTeacher
  }[k] ?? data?.[k] ?? m));
};
window.v34WhatsAppUrl = function(mobile, message){
  return `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
};
saveDefaults();
document.addEventListener("DOMContentLoaded",()=>{applyTopHeader(); setTimeout(patchCertificateButton,500);});
})();
