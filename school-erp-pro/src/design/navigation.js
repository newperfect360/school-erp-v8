export const navigationGroups = [
  { en: "Workspace", mr: "कार्यस्थान", items: [
    ["Dashboard", "School overview", "मुख्यपृष्ठ", "grid", "Dashboard"],
    ["TeacherDashboard", "Teaching workspace", "शिक्षक कार्यस्थान", "cap"],
  ] },
  { en: "Academics", mr: "शैक्षणिक विभाग", items: [
    ["Students", "Students", "विद्यार्थी", "users"], ["Teachers", "Teachers", "शिक्षक", "cap"],
    ["Attendance", "Attendance", "उपस्थिती", "calendar"], ["Homework", "Homework", "गृहपाठ", "book"],
    ["Classwork", "Classwork", "वर्गपाठ", "file"], ["Results", "Exams & results", "परीक्षा व निकाल", "chart", "निकाल"],
    ["Timetable", "Timetable", "वेळापत्रक", "clock"],
  ] },
  { en: "Student life", mr: "विद्यार्थी उपक्रम", items: [
    ["Sports", "Sports", "क्रीडा", "trophy"], ["Trips", "Educational trips", "शैक्षणिक सहल", "pin"],
    ["Library", "Library", "ग्रंथालय", "book"], ["Scholarships", "Scholarships", "शिष्यवृत्ती", "award"],
    ["Calendar", "Academic calendar", "दिनदर्शिका", "calendar"],
  ] },
  { en: "School office", mr: "शालेय कार्यालय", items: [
    ["Admissions", "Admissions & GR", "प्रवेश आणि GR", "file"], ["Certificates", "Certificates", "प्रमाणपत्र", "award"],
    ["Formats", "School formats", "शालेय नमुने", "file"],
    ["IDCard", "Student ID cards", "ओळखपत्र", "badge", "ID Card"], ["Fees", "Fees", "शुल्क", "wallet"],
    ["Parents", "Parents", "पालक", "users"], ["Communications", "Parent communication", "संवाद नोंद", "message"],
    ["Notices", "Noticeboard", "सूचना", "bell"], ["Meetings", "Parent meetings", "पालक सभा", "users"],
    ["Transport", "Transport", "वाहतूक", "bus"], ["Inventory", "School assets", "मालमत्ता", "file"],
    ["Staff", "Staff directory", "कर्मचारी", "badge"], ["Reports", "Reports", "अहवाल", "chart", "Reports"],
  ] },
  { en: "Administration", mr: "प्रशासन", items: [
    ["AccessSetup", "Teacher accounts & roles", "शिक्षक खाते व भूमिका", "shield"],
    ["Automation", "Automation rules", "स्वयंचलित नियम", "spark"], ["Backup", "Backup & audit", "Backup आणि Audit", "shield"],
    ["Settings", "School settings", "सेटिंग्ज", "settings", "Settings"],
  ] },
];
export const navigationItems = navigationGroups.flatMap(group => group.items);
