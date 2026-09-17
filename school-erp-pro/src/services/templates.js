import { qrImage } from "../qr.js";

export const formatTypes = ["Bonafide Certificate", "Leaving Certificate", "Character Certificate", "Study Certificate", "Student ID Card", "Marksheet", "Annual Result", "Progress Card", "Parent Consent", "Educational Trip Form", "Trip Student List", "Sports Certificate", "Achievement Certificate", "Scholarship Form", "Admission Form", "Parent Meeting Form", "Attendance Register", "Homework Sheet", "Notices", "Circulars", "Letters", "General Register Extract"];
export const formatFields = {
  "Bonafide Certificate": ["reason"], "Leaving Certificate": ["reason", "last_class", "progress", "conduct"], "Character Certificate": ["conduct", "remarks"], "Study Certificate": ["study_period", "reason"], "Student ID Card": [],
  "Marksheet": ["exam", "remarks"], "Annual Result": ["exam", "remarks"], "Progress Card": ["exam", "progress", "remarks"],
  "Parent Consent": ["trip_name", "destination", "trip_date", "content"], "Educational Trip Form": ["trip_name", "destination", "trip_date", "teacher", "emergency_contact", "medical_note"], "Trip Student List": ["trip_name", "destination", "trip_date", "teacher"],
  "Sports Certificate": ["sport", "competition", "level", "achievement"], "Achievement Certificate": ["achievement", "competition", "remarks"], "Scholarship Form": ["scholarship", "eligibility", "documents", "deadline"],
  "Admission Form": ["admission_date", "previous_school", "documents"], "Parent Meeting Form": ["meeting_date", "teacher", "discussion", "followup_date"], "Attendance Register": ["month"], "Homework Sheet": ["subject", "teacher", "content", "due_date"], "Notices": ["title", "content"], "Circulars": ["title", "content"], "Letters": ["title", "content", "reason"], "General Register Extract": ["previous_school", "admission_date", "remarks"],
};
export const groupFormats = ["Trip Student List", "Attendance Register", "Homework Sheet", "Notices", "Circulars", "Letters"];
export const placeholders = [...new Set(["student_name", "student_name_marathi", "gr_number", "admission_number", "roll_number", "standard", "division", "dob", "parent_name", "mobile", "school_name", "school_address", "academic_year", "issue_date", "certificate_number", "reason", "last_class", "progress", "conduct", "content", "photo", "school_logo", "qr", "subject_marks", "roster_table", "total", "percentage", "grade", "result", "remarks", ...Object.values(formatFields).flat()])];
export const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
export const baseFormatCss = "body{font-family:Arial,sans-serif;color:#203a55;padding:32px;line-height:1.65}header{text-align:center;border-bottom:2px solid #203a55;padding-bottom:16px}h1{font-size:24px}h2{text-align:center}table{border-collapse:collapse;width:100%;margin:18px 0}td,th{border:1px solid #cbd5df;padding:8px;text-align:left}img{max-width:100px;max-height:110px}footer{margin-top:48px;display:flex;justify-content:space-between}.draft{color:#925b22;font-size:12px;text-align:center;border:1px dashed #ba9e70;padding:8px}.document{break-after:page}.document:last-child{break-after:auto}@media print{body{padding:12mm}}";
export function defaultFormat(type) {
  const details = type === "Leaving Certificate" ? "<p>Leaving reason: {{reason}}</p><p>Last class: {{last_class}} · Progress: {{progress}} · Conduct: {{conduct}}</p>" : ["Marksheet", "Annual Result", "Progress Card"].includes(type) ? "{{subject_marks}}<p>Total: {{total}} · Percentage: {{percentage}} · Grade: {{grade}} · Result: {{result}}</p><p>{{remarks}}</p>" : type === "Student ID Card" ? "{{photo}}<p>Roll: {{roll_number}} · Parent contact: {{mobile}}</p><p>Emergency contact: {{emergency_contact}}</p>" : type === "Bonafide Certificate" ? "<p>This is to certify that {{student_name}} is enrolled in class {{standard}} / {{division}} during academic year {{academic_year}}.</p><p>Purpose: {{reason}}</p>" : "<p>{{content}}</p><p>Purpose / remarks: {{reason}}</p>";
  const specialized = {
    "Character Certificate": "<p>The school records the following conduct for the student named above: {{conduct}}</p><p>{{remarks}}</p>",
    "Study Certificate": "<p>Study period: {{study_period}}</p><p>Academic year: {{academic_year}}</p><p>Purpose: {{reason}}</p>",
    "Parent Consent": "<p>Trip: {{trip_name}} · Destination: {{destination}} · Date: {{trip_date}}</p><p>{{content}}</p><p>I, {{parent_name}}, give consent for my child to participate in the above activity, subject to the school's communicated arrangements.</p><p>Parent signature: __________________ Date: __________</p>",
    "Educational Trip Form": "<p>Trip: {{trip_name}} · Destination: {{destination}} · Date: {{trip_date}}</p><p>In-charge: {{teacher}}</p><p>Emergency contact: {{emergency_contact}}</p><p>Medical note: {{medical_note}}</p><p>Consent / boarding check: __________________</p>",
    "Trip Student List": "<p>{{trip_name}} · {{destination}} · {{trip_date}} · In-charge: {{teacher}}</p>{{roster_table}}",
    "Sports Certificate": "<p>Sport: {{sport}} · Competition: {{competition}} · Level: {{level}}</p><p>Achievement: {{achievement}}</p>",
    "Achievement Certificate": "<p>This certificate records the following achievement: {{achievement}}</p><p>Competition / activity: {{competition}}</p><p>{{remarks}}</p>",
    "Scholarship Form": "<p>Scholarship: {{scholarship}}</p><p>Eligibility: {{eligibility}}</p><p>Document checklist: {{documents}}</p><p>Application deadline: {{deadline}}</p><p>Applicant / guardian signature: __________________</p>",
    "Admission Form": "<p>Admission date: {{admission_date}}</p><p>Previous school: {{previous_school}}</p><p>Documents received: {{documents}}</p><p>Parent contact: {{mobile}}</p><p>Parent signature: __________________</p>",
    "Parent Meeting Form": "<p>Meeting date: {{meeting_date}} · Teacher: {{teacher}}</p><p>Discussion: {{discussion}}</p><p>Follow-up date: {{followup_date}}</p><p>Parent signature: __________________</p>",
    "Attendance Register": "<p>Month: {{month}} · Recorded attendance (blank = unmarked)</p>{{roster_table}}",
    "Homework Sheet": "<p>Subject: {{subject}} · Teacher: {{teacher}} · Due: {{due_date}}</p><p>{{content}}</p>",
    "Notices": "<h3>{{title}}</h3><p>{{content}}</p>", "Circulars": "<h3>{{title}}</h3><p>{{content}}</p>", "Letters": "<h3>{{title}}</h3><p>{{content}}</p><p>{{reason}}</p>",
    "General Register Extract": "<p>Admission date: {{admission_date}} · Previous school: {{previous_school}}</p><p>Roll: {{roll_number}} · Academic year: {{academic_year}}</p><p>{{remarks}}</p>",
  };
  const identity = groupFormats.includes(type) ? "<p>Academic year: {{academic_year}}</p>" : "<p><b>{{student_name}}</b> / {{student_name_marathi}}</p><p>GR: {{gr_number}} · Admission: {{admission_number}} · Class: {{standard}} / {{division}}</p><p>DOB: {{dob}} · Parent: {{parent_name}}</p>";
  return { type, name: type, approved: false, version: 1, css: baseFormatCss, html: `<header>{{school_logo}}<h1>{{school_name}}</h1><p>{{school_address}}</p></header><h2>${type}</h2><p>No: {{certificate_number}} · Date: {{issue_date}}</p>${identity}${specialized[type] || details}<footer><div>{{qr}}<small>Internal record reference</small></div><p>Authorized school signature<br/>____________________</p></footer>` };
}
const allowedTags = new Set("HEADER FOOTER SECTION DIV P SPAN STRONG EM B I U H1 H2 H3 H4 H5 H6 TABLE TBODY THEAD TFOOT TR TD TH UL OL LI BR HR IMG SMALL".split(" "));
export function sanitizeFormatHtml(html) {
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  for (const element of [...doc.body.querySelectorAll("*")]) {
    if (!allowedTags.has(element.tagName)) { element.remove(); continue; }
    for (const attr of [...element.attributes]) {
      if (!["class", "colspan", "rowspan", "alt", "src", "width", "height"].includes(attr.name) || (attr.name === "src" && !/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(attr.value))) element.removeAttribute(attr.name);
    }
  }
  return doc.body.innerHTML;
}
export function safeCss(css) {
  if (/[<>]|url\s*\(|@import|expression\s*\(|behavior\s*:|-moz-binding/i.test(css)) throw new Error("CSS cannot load external resources or contain active content.");
  return css;
}
const safeImage = (data, alt) => /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(data || "") ? `<img src="${data}" alt="${escapeHtml(alt)}">` : "";
export function templateContext(student, school, extras = {}) {
  extras = { emergency_contact: student.emergencyContact || "", ...extras };
  return { student_name: student.name, student_name_marathi: student.student_name_mr || student.name_mr, gr_number: student.grNo, admission_number: student.admissionNo, roll_number: student.rollNo, standard: student.className, division: student.division, dob: student.dob, parent_name: student.guardianName || student.fatherName || student.motherName, mobile: student.mobile, school_name: school.schoolName, school_address: school.address, academic_year: student.academicYear || school.academicYear, ...extras, photo: safeImage(student.photo, "Student photo"), school_logo: safeImage(school.logo, "School logo"), qr: student.id ? safeImage(qrImage(`schoolerp:student:v1:${encodeURIComponent(student.id)}`), "Student QR") : "" };
}
export function renderFormat(template, context) {
  const rendered = template.html.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, key) => ["photo", "school_logo", "qr", "subject_marks", "roster_table"].includes(key) ? context[key] || "" : escapeHtml(context[key]));
  return `${!template.approved ? '<p class="draft">DRAFT — official school format / approval pending</p>' : ""}${sanitizeFormatHtml(rendered)}`;
}
export function documentHtml(body, css = baseFormatCss) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><title>School document</title><style>${safeCss(css)}</style></head><body>${body}</body></html>`;
}
export function downloadDocument(html, filename = "school-document.html") {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
