// Fictional review data. Imported only by test/capture scripts, never by the app.
export function coreDesignFixture(now = new Date()) {
  const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const today = dateKey(now);
  const future = days => { const date = new Date(now); date.setDate(date.getDate() + days); return dateKey(date); };
  const names = [
    ["Aditi Deshmukh", "अदिती देशमुख", "Sanjay Deshmukh", "Sunita Deshmukh"],
    ["Shantanu Pawar", "शांतनु पवार", "Sunil Pawar", "Anita Pawar"],
    ["Sakshi Patil", "साक्षी पाटील", "Sachin Patil", "Seema Patil"],
    ["Atharva Jadhav", "अथर्व जाधव", "Prakash Jadhav", "Savita Jadhav"],
    ["Ananya Kulkarni", "अनन्या कुलकर्णी", "Nitin Kulkarni", "Neha Kulkarni"],
    ["Vedant Shinde", "वेदांत शिंदे", "Vikas Shinde", "Varsha Shinde"],
    ["Ishita Chavan", "इशिता चव्हाण", "Tukaram Chavan", "Rekha Chavan"],
    ["Soham More", "सोहम मोरे", "Anil More", "Sangeeta More"],
    ["Riya Joshi", "रिया जोशी", "Milind Joshi", "Madhuri Joshi"],
    ["Omkar Patil", "ओंकार पाटील", "Ramesh Patil", "Shubhangi Patil"],
    ["Mira Gaikwad", "मीरा गायकवाड", "Vijay Gaikwad", "Usha Gaikwad"],
    ["Yash Pawar", "यश पवार", "Dilip Pawar", "Meena Pawar"],
  ];
  const portrait = (color, girl) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="180" viewBox="0 0 160 180"><rect width="160" height="180" fill="${color}"/><path d="M29 180v-19c0-37 102-37 102 0v19" fill="#526e92"/><path d="m57 139 23 31 23-31-23-9Z" fill="#f6f5ef"/><path d="M${girl ? '45 81c-15 24-7 44 4 56l18-30h27l19 30c18-30 9-53-4-63' : '43 77c-9-56 85-67 76 2'}" fill="#493e3a"/><path d="M68 111h24v28c-6 8-18 8-24 0Z" fill="#dcb599"/><ellipse cx="80" cy="79" rx="33" ry="43" fill="#e8c3a8"/><path d="M46 76c-8-64 74-56 69 0-17-5-28-20-31-30-7 22-19 28-38 30Z" fill="#493e3a"/><path d="M65 87h1m28 0h1" stroke="#493e3a" stroke-width="4" stroke-linecap="round"/><path d="M73 105q7 5 14 0" stroke="#aa6d63" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`)}`;
  const students = Array.from({ length: 36 }, (_, index) => {
    const [name, marathi, fatherName, motherName] = names[index % names.length];
    return { id: `review-student-${index + 1}`, grNo: `2026${String(index + 101)}`, name, student_name_en: name, student_name_mr: marathi, className: String(8 + Math.floor(index / 9)), division: "A", rollNo: String(index % 9 + 1).padStart(2, "0"), fatherName, motherName, fatherMobile: `900000${String(index + 1001)}`, mobile: `900000${String(index + 1001)}`, motherMobile: `900000${String(index + 2001)}`, gender: index % 2 ? "Male" : "Female", dob: `2012-0${index % 8 + 1}-12`, bloodGroup: ["B+", "O+", "A+"][index % 3], address: "School review address, Naigaon, Maharashtra", address_mr: "शाळा परीक्षण पत्ता, नायगाव, महाराष्ट्र", photo: portrait(["#e6edf3", "#eee9df", "#e8efea"][index % 3], index % 2 === 0) };
  });
  const attendance = {};
  for (let days = 0; days < 12; days++) {
    const key = future(-days);
    attendance[key] = Object.fromEntries(students.filter((_, i) => days > 0 || i % 9 !== 8).map((student, i) => [student.id, i % 11 === 1 ? "Absent" : i % 17 === 4 ? "Leave" : "Present"]));
  }
  const teachers = [
    { id: "review-teacher-1", name: "Dilip M. Pawar", subject: "Mathematics", designation: "Class Teacher", mobile: "9000000001", assignedClasses: [{ className: "8", division: "A" }, { className: "9", division: "A" }] },
    { id: "review-teacher-2", name: "Sunita S. Shinde", subject: "Science", designation: "Subject Teacher", mobile: "9000000002", assignedClasses: [{ className: "10", division: "A" }, { className: "11", division: "A" }] },
  ];
  return {
    erp_pro_language: { value: "en" }, erp_pro_students: students, erp_pro_teachers: teachers,
    erp_pro_attendance: attendance,
    erp_pro_classTeachers: [{ className: "8", division: "A", teacherId: teachers[0].id, teacherName: teachers[0].name }, { className: "9", division: "A", teacherId: teachers[0].id, teacherName: teachers[0].name }, { className: "10", division: "A", teacherId: teachers[1].id, teacherName: teachers[1].name }],
    erp_pro_calendar: [{ id: "event-1", title: "Parent–teacher conversations", date: today, time: "11:30 AM", location: "School hall", type: "Meeting" }, { id: "event-2", title: "Inter-house sports meet", date: future(3), time: "09:00 AM", location: "School grounds", type: "Sports" }, { id: "event-3", title: "Science project exhibition", date: future(6), time: "10:00 AM", location: "Science laboratory", type: "Learning" }],
    erp_pro_homework: [{ id: "homework-1", className: "8", division: "A", date: today, subject: "Mathematics", homework: "Practice exercise 4.2 · Linear equations", teacher: teachers[0].name, dueDate: future(1), mobile: "" }, { id: "homework-2", className: "9", division: "A", date: today, subject: "English", homework: "Read the next chapter and note five new words.", teacher: teachers[1].name, dueDate: future(2), mobile: "" }, { id: "homework-3", className: "10", division: "A", date: today, subject: "Science", homework: "Complete your project observations.", teacher: teachers[1].name, dueDate: future(3), mobile: "" }],
    erp_pro_notices: [{ id: "notice-1", "सूचना शीर्षक": "A day for our young readers", "लक्ष्य वर्ग / गट": "LIBRARY", "दिनांक": today, "संदेश": "The reading room is ready for this week's book discovery session." }, { id: "notice-2", "सूचना शीर्षक": "Together for student progress", "लक्ष्य वर्ग / गट": "PARENT MEETING", "दिनांक": today, "संदेश": "Class teachers can review parent follow-ups before today's meeting." }],
    erp_pro_results: [{ id: "result-1", studentId: students[0].id, grNo: students[0].grNo, studentName: students[0].name, exam: "Unit Test 1", subject: "Mathematics", maxMarks: 50, obtainedMarks: 44, grade: "A", percentage: 88 }],
    erp_pro_certificates: [{ id: "cert-1", studentId: students[0].id, grNo: students[0].grNo, name: students[0].name, reason: "Bonafide Certificate", certificateNo: "REVIEW-2026-001", issueDate: today }],
  };
}
