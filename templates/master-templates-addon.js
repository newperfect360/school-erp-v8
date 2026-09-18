
/*
ERP V32 Master Templates Addon
Usage:
1) app.js मध्ये हा code add करा किंवा templates/master-templates.json fetch करून localStorage मध्ये save करा.
2) Settings मधून संस्था/शाळेचे नाव बदलल्यास certificate header auto बदलू शकतो.
*/
window.ERP_MASTER_SETTINGS = {
  sansthaName:window.SCHOOL_IDENTITY.sansthaName,
  schoolName:window.SCHOOL_IDENTITY.schoolName,
  address:window.SCHOOL_IDENTITY.address,
  "email": "late.gbsschoolnaigaon03@gmail.com",
  "medium": "मराठी",
  "academicYear": "2025 - 26",
  "principalLabel": "मुख्याध्यापक",
  "clerkLabel": "वरिष्ठ लिपिक"
};
window.ERP_MASTER_TEMPLATES = {
  "bonafide": {
    "title": "बोनाफाईड प्रमाणपत्र",
    "body": "प्रमाणित करण्यात येते की, कुमार/कुमारी {studentName} हा/ही विद्यार्थी/विद्यार्थिनी शैक्षणिक वर्ष {academicYear} मध्ये इयत्ता {className} मध्ये शिकत असून त्याचा/तिचा हजेरी क्र. {rollNo} व प्रवेश क्र. {admissionNo} आहे. त्याची/तिची जन्मतारीख {dob} ही आहे. करिता सन {academicYear} साठी बोनाफाईड प्रमाणपत्र देण्यात येत आहे."
  },
  "leaving_certificate": {
    "title": "शाळा सोडल्याचे प्रमाणपत्र",
    "fields": [
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
    "body": "दाखला देण्यात येतो की, वरील माहिती शाळेतील प्रवेश निर्गम प्रमाणे खरी आहे."
  },
  "admission_exit_extract": {
    "title": "विद्यार्थी प्रवेश/निर्गम उतारा",
    "fields": [
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
  },
  "attendance_P": "{studentName} आज दिनांक {date} रोजी शाळेत उपस्थित आहे.",
  "attendance_A": "{studentName} आज दिनांक {date} रोजी शाळेत अनुपस्थित आहे. कृपया पालकांनी लक्ष द्यावे.",
  "attendance_H": "{studentName} आज दिनांक {date} रोजी अर्धा दिवस उपस्थित आहे.",
  "attendance_L": "{studentName} आज दिनांक {date} रोजी उशिरा उपस्थित झाला/झाली.",
  "homework": "इयत्ता {className} - {subject}: आज वर्गात {classwork} शिकवण्यात आले. गृहपाठ: {homework}.",
  "fees_due": "आदरणीय पालक, {studentName} यांची फी ₹{balance} बाकी आहे. कृपया लवकरात लवकर भरणा करावा.",
  "exam_notice": "सर्व विद्यार्थ्यांना सूचित करण्यात येते की {examName} परीक्षा {date} रोजी होणार आहे.",
  "parent_meeting": "आदरणीय पालक, शाळेमध्ये पालक सभा {date} रोजी आयोजित करण्यात आली आहे.",
  "holiday_notice": "सर्व विद्यार्थी व पालकांना सूचित करण्यात येते की {date} रोजी शाळेला सुट्टी राहील.",
  "result_notice": "{studentName} यांचा निकाल उपलब्ध आहे. एकूण टक्केवारी {percentage}% आहे.",
  "distribution": "{studentName} यांना {itemName} वाटप करण्यात आले आहे.",
  "general_notice": "सर्व विद्यार्थी व पालकांना सूचित करण्यात येते की {noticeText}"
};

function installMasterTemplates(){
  localStorage.setItem("v32_settings", JSON.stringify(window.ERP_MASTER_SETTINGS));
  localStorage.setItem("v32_templates", JSON.stringify(window.ERP_MASTER_TEMPLATES));
  alert("Master Templates आणि संस्था/शाळा माहिती Save झाली.");
}
