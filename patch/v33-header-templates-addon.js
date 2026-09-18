
/* School ERP V33 Final Header + Templates Addon */
window.ERP_V33_SETTINGS = {
  sansthaName:window.SCHOOL_IDENTITY.sansthaName,
  managedBy:"",
  schoolName:window.SCHOOL_IDENTITY.schoolName,
  address:window.SCHOOL_IDENTITY.address,
  "academicYear": "2025 - 26",
  "email": "late.gbsschoolnaigaon03@gmail.com",
  "medium": "मराठी",
  "classTeacher": "श्री. पवार डी. एम.",
  "slogan": "विद्यार्थ्यांची गुणवत्ता, शिस्त आणि सर्वांगीण विकास हेच आमचे ध्येय."
};
window.ERP_V33_TEMPLATES = {
  "homework": "🏫 {SANSTHA}\n{SCHOOL}\n{ADDRESS}\n\nआदरणीय पालक,\nइयत्ता {CLASS} {SUBJECT} विषयाची आजची माहिती:\nवर्गात झालेले अध्यापन: {CLASSWORK}\nदिलेला गृहपाठ: {HOMEWORK}\n\nविद्यार्थ्यांच्या शैक्षणिक प्रगतीसाठी आपले सहकार्य अपेक्षित आहे.\n\nविषय शिक्षक: {SUBJECT_TEACHER}\nवर्गशिक्षक: {CLASS_TEACHER}\n{SCHOOL}\n🌟 {SLOGAN}",
  "attendance_absent": "🏫 {SANSTHA}\nसंचलित\n{SCHOOL}\n{ADDRESS}\n\nआदरणीय पालक,\n{STUDENT} दिनांक {DATE} रोजी शाळेत अनुपस्थित आहे. कृपया अनुपस्थितीचे कारण वर्गशिक्षकांना कळवावे.\n\nवर्गशिक्षक: {CLASS_TEACHER}\n{SCHOOL}\n🌟 {SLOGAN}",
  "attendance_present": "🏫 {SANSTHA}\nसंचलित\n{SCHOOL}\n{ADDRESS}\n\nआदरणीय पालक,\n{STUDENT} दिनांक {DATE} रोजी शाळेत उपस्थित आहे.\n\nवर्गशिक्षक: {CLASS_TEACHER}\n{SCHOOL}\n🌟 {SLOGAN}",
  "fee_due": "🏫 {SANSTHA}\nसंचलित\n{SCHOOL}\n{ADDRESS}\n\nआदरणीय पालक,\n{STUDENT} यांची फी ₹{BALANCE} बाकी आहे. कृपया लवकरात लवकर भरणा करावा.\n\nकार्यालय\n{SCHOOL}\n🌟 {SLOGAN}",
  "bonafide": "प्रमाणित करण्यात येते की, कुमार/कुमारी {STUDENT} हा/ही विद्यार्थी/विद्यार्थिनी शैक्षणिक वर्ष {YEAR} मध्ये इयत्ता {CLASS} मध्ये शिकत असून त्याचा/तिचा हजेरी क्र. {ROLL} व प्रवेश क्र. {ADMISSION_NO} आहे. त्याची/तिची जन्मतारीख {DOB} ही आहे. करिता सन {YEAR} साठी बोनाफाईड प्रमाणपत्र देण्यात येत आहे.",
  "leaving_certificate_fields": [
    "अनुक्रमांक",
    "जनरल रजिस्टर क्र.",
    "स्टुडंट आयडी",
    "आधार क्रमांक",
    "विद्यार्थ्याचे संपूर्ण नाव",
    "आईचे नाव",
    "राष्ट्रीयत्व",
    "मातृभाषा",
    "धर्म",
    "जात",
    "पोटजात",
    "जन्मस्थळ",
    "जन्मदिनांक",
    "जन्मदिनांक अक्षरी",
    "पूर्वीची शाळा व इयत्ता",
    "प्रवेश दिनांक",
    "इयत्ता",
    "प्रगती",
    "वर्तणूक",
    "शाळा सोडल्याचा दिनांक",
    "शाळा सोडण्याचे कारण",
    "शेरा"
  ],
  "admission_exit_fields": [
    "अनुक्रमांक",
    "प्रवेश क्रमांक",
    "विद्यार्थ्याचे नाव",
    "आईचे नाव",
    "धर्म",
    "जात",
    "उपजात",
    "जन्मदिनांक",
    "प्रवेश दिनांक",
    "निर्गम दिनांक",
    "शाळा सोडण्याचे कारण",
    "शेरा"
  ]
};

function installV33HeaderTemplates(){
  localStorage.setItem("v33_school_settings", JSON.stringify(window.ERP_V33_SETTINGS));
  localStorage.setItem("v33_message_templates", JSON.stringify(window.ERP_V33_TEMPLATES));
  localStorage.setItem("v32_settings", JSON.stringify(window.ERP_V33_SETTINGS));
  localStorage.setItem("v32_templates", JSON.stringify(window.ERP_V33_TEMPLATES));
  alert("V33 Header, संस्था/शाळा माहिती आणि सर्व Templates Save झाले.");
}

function erpV33ApplyHeader(){
  const s = JSON.parse(localStorage.getItem("v33_school_settings") || JSON.stringify(window.ERP_V33_SETTINGS));
  const headerHtml = `
    <div class="erp-v33-top"><img src="assets/school-logo.jpg" alt="School logo" style="width:72px;height:78px;object-fit:contain">
      <div class="sanstha" style="white-space:pre-line">${s.sansthaName}</div>
      <div class="managed">${s.managedBy}</div>
      <div class="school">${s.schoolName}</div>
      <div class="address">${s.address}</div>
      <div class="year">शैक्षणिक वर्ष ${s.academicYear}</div>
    </div>`;
  document.body.insertAdjacentHTML("afterbegin", headerHtml);
}

document.addEventListener("DOMContentLoaded", () => {
  if(!localStorage.getItem("v33_school_settings")) installV33HeaderTemplates();
  if(!document.querySelector(".erp-v33-top")) erpV33ApplyHeader();
});
