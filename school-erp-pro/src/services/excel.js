import * as XLSX from "xlsx";

export const studentColumns = [
  ["Sr No", "srNo"], ["Photo Number", "photoNumber"], ["Father Name Marathi", "father_name_mr"], ["Mother Name Marathi", "mother_name_mr"], ["Address Marathi", "address_mr"], ["Student Full Name", "name"], ["First Name", "firstName"], ["Middle Name", "middleName"], ["Last Name", "lastName"],
  ["Student Name Marathi", "student_name_mr"], ["Admission Number", "admissionNo"],
  ["Standard", "className"], ["Division", "division"], ["Roll Number", "rollNo"], ["GR Number", "grNo"], ["Date of Birth", "dob"],
  ["Gender", "gender"], ["Blood Group", "bloodGroup"], ["Admission Date", "admissionDate"], ["Academic Year", "academicYear"],
  ["Father Name", "fatherName"], ["Mother Name", "motherName"], ["Parent / Guardian Name", "guardianName"], ["Parent Mobile", "mobile"],
  ["Father Mobile", "fatherMobile"], ["Mother Mobile", "motherMobile"], ["Guardian Mobile", "guardianMobile"], ["Alternate Contact Name", "alternateName"],
  ["Alternate Mobile", "alternateMobile"], ["WhatsApp Number", "whatsapp"], ["Father WhatsApp", "fatherWhatsapp"], ["Mother WhatsApp", "motherWhatsapp"], ["Address", "address"], ["Emergency Contact Name", "emergencyName"], ["Emergency Relation", "emergencyRelation"], ["Emergency Mobile", "emergencyContact"],
  ["Previous School", "previousSchool"], ["Student Category", "category"], ["Scholarship Details", "scholarship"], ["Sports Details", "sports"],
  ["Health Notes", "healthNotes"], ["Aadhaar Reference", "aadhaar"], ["Student Status", "status"],
];

const aliases = {
  emergencyContact: ['emergencycontact','emergencymobile','emergencycontactnumber'],
  healthNotes: ["healthnote", "healthnotes", "medicalnote", "medicalnotes"],
  student_name_mr: ["marathiname", "studentnamemarathi", "विद्यार्थीनावमराठी"],
  name: ["studentfullname", "fullname", "studentname", "name", "विद्यार्थीपूर्णनाव", "विद्यार्थीनाव"],
  className: ["standard", "class", "classname", "इयत्ता"],
  division: ["division", "विभाग", "तुकडी"],
  rollNo: ["rollnumber", "rollno", "roll", "रोलनंबर"],
  grNo: ["grnumber", "grno", "generalregister", "gr", "जीआरनंबर"],
  dob: ["dateofbirth", "dob", "birthdate", "जन्मदिनांक"],
  mobile: ["parentmobile", "parentguardianmobile", "mobile", " मोबाईल"],
  fatherName: ["fathername", "वडिलांचेनाव"],
  motherName: ["mothername", "आईचेनाव"],
  address: ["address", "पत्ता"],
  gender: ["gender", "लिंग"],
  bloodGroup: ["bloodgroup", "रक्तगट"],
  aadhaar: ["aadhaarreference", "aadhaar", "आधार"],
};

const clean = (value) => String(value ?? "").trim();
const key = (value) => clean(value).toLowerCase().replace(/[\s_./-]+/g, "");

export function mapHeaders(headers) {
  return headers.reduce((mapping, header) => {
    const normalized = key(header);
    const direct = studentColumns.find(([label, field]) => key(field) === normalized || key(label) === normalized);
    const alias = Object.entries(aliases).find(([, names]) => names.includes(normalized));
    if (direct) mapping[header] = direct[1];
    else if (alias) mapping[header] = alias[0];
    return mapping;
  }, {});
}

export async function parseStudentFile(file) {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error("Choose an .xlsx, .xls or .csv file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Maximum file size is 5 MB. Split larger files.");
  const csv = /\.csv$/i.test(file.name);
  const input = csv ? new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer()) : await file.arrayBuffer();
  const workbook = XLSX.read(input, { type: csv ? "string" : "array", cellDates: true, dateNF: "yyyy-mm-dd", raw: true, sheetRows: 5002 });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("The workbook has no worksheet.");
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false, blankrows: true });
  for (let r = 1; r < matrix.length; r++) for (let c = 0; c < matrix[r].length; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c })];
    if (cell?.t === "d" && cell.v instanceof Date) matrix[r][c] = `${cell.v.getFullYear()}-${String(cell.v.getMonth() + 1).padStart(2, "0")}-${String(cell.v.getDate()).padStart(2, "0")}`;
  }
  if (matrix.length > 5001) throw new Error("Maximum 5,000 data rows per import.");
  const headers = (matrix[0] || []).map(clean);
  if (headers.length > 100 || headers.some(h => !h) || new Set(headers).size !== headers.length) throw new Error("Use unique, non-empty headers (maximum 100 columns).");
  const rows = matrix.slice(1).map((cells, index) => ({ ...Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""])), __row: index + 2 })).filter(row => headers.some(h => clean(row[h])));
  return { rows, headers, mapping: mapHeaders(headers), sheetName: workbook.SheetNames[0] };
}

export function normalizeStudentRow(row, mapping) {
  const student = {};
  Object.entries(mapping).forEach(([header, field]) => { if (studentColumns.some(([, key]) => key === field)) student[field] = clean(row[header]).replace(/^'(?=[=+@-])/, ""); });
  if (!student.name && (student.firstName || student.lastName)) student.name = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
  return student;
}

export function validateStudentRow(student, rowNumber, existing) {
  const errors = [];
  if (!student.name) errors.push("विद्यार्थी नाव रिकामे आहे");
  if (!student.grNo) errors.push("GR Number रिकामे आहे");
  if (!student.className) errors.push("Standard रिकामे आहे");
  if (student.mobile && !/^\d{10}$/.test(student.mobile.slice(-10))) errors.push("Parent Mobile चुकीचा आहे");
  if (student.dob && Number.isNaN(Date.parse(student.dob))) errors.push("Date of Birth चुकीची आहे");
  const duplicate = existing.find((item) => (student.grNo && item.grNo === student.grNo) || (student.name && student.dob && item.name === student.name && item.dob === student.dob));
  return { rowNumber, student, errors, duplicate: duplicate || null };
}

export function exportStudents(students, filename = "students.xlsx") {
  const rows = students.map((student, index) => Object.fromEntries(studentColumns.map(([label, field]) => [label, field === "srNo" ? index + 1 : student[field] || ""])));
  exportRows(rows, filename, studentColumns.map(([label]) => label));
}

export function downloadStudentTemplate(columns = studentColumns.map(([, field]) => field)) {
  if (!Array.isArray(columns)) columns = studentColumns.map(([, field]) => field);
  const worksheet = XLSX.utils.aoa_to_sheet([studentColumns.filter(([, field]) => columns.includes(field)).map(([label]) => label)]);
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Student Template");
  XLSX.writeFile(workbook, "student-import-template.xlsx");
}

export function exportRows(rows, filename = "school-export.xlsx", headers) {
  // Spreadsheet software must never evaluate user-controlled cells as formulas.
  const safe = value => typeof value === "string" && /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  const flat = rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, safe(value && typeof value === "object" ? JSON.stringify(value) : value ?? "")])));
  const worksheet = XLSX.utils.json_to_sheet(flat, headers ? { header: headers } : {});
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "School data");
  XLSX.writeFile(workbook, filename);
}

export function downloadErrorReport(errors) {
  const worksheet = XLSX.utils.json_to_sheet(errors.map(({ rowNumber, errors: reasons }) => ({ "Original Row": rowNumber, "Error Reason": reasons.join("; ")})));
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Import Errors");
  XLSX.writeFile(workbook, "student-import-errors.xlsx");
}
