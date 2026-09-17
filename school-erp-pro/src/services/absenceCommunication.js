export const communicationKeys = {
  history: "erp_pro_absence_communications",
  followups: "erp_pro_absence_followups",
  settings: "erp_pro_absence_settings",
};

export const defaultAbsenceSettings = {
  autoPrepare: false,
  language: "en",
  templates: {
    en: "Your child [Student Name], Class [Standard/Division], is marked absent today on [Date]. Please contact the school if required.",
    mr: "आपले पाल्य [Student Name], इयत्ता [Standard/Division], दिनांक [Date] रोजी अनुपस्थित आहे. आवश्यक असल्यास कृपया शाळेशी संपर्क साधा.",
  },
};

// Reject malformed input rather than silently taking the last ten digits.
export function normalizeParentMobile(value) {
  const number = String(value ?? "").trim().replace(/[\s()-]/g, "");
  if (/^[6-9]\d{9}$/.test(number)) return `+91${number}`;
  if (/^(?:\+91|91)[6-9]\d{9}$/.test(number)) return `+91${number.slice(-10)}`;
  if (number.startsWith("+91")) return "";
  if (/^\+[1-9]\d{7,14}$/.test(number)) return number;
  return "";
}

export function parentContacts(student) {
  return [
    ["father", "Father", student.fatherName, student.fatherMobile],
    ["mother", "Mother", student.motherName, student.motherMobile],
    ["guardian", "Guardian", student.guardianName, student.guardianMobile],
    ["primary", "Parent / Guardian", student.guardianName || "Parent / Guardian", student.mobile],
    ["alternate", "Alternate Contact", student.alternateName, student.alternateMobile],
    ["whatsapp", "WhatsApp Contact", student.whatsappName, student.whatsapp],
  ].filter(([, , , mobile]) => String(mobile ?? "").trim()).map(([id, label, name, mobile]) => ({
    id, label, name: name || label, mobile: normalizeParentMobile(mobile), rawMobile: String(mobile),
  }));
}

export function absenceMessage(student, date, settings) {
  const template = settings.templates?.[settings.language] ?? defaultAbsenceSettings.templates[settings.language] ?? defaultAbsenceSettings.templates.en;
  const values = { "[Student Name]": student.name, "[Standard/Division]": [student.className, student.division].filter(Boolean).join("/"), "[Date]": date };
  return template.replace(/\[Student Name\]|\[Standard\/Division\]|\[Date\]/g, token => values[token]);
}

export function communicationLink(channel, mobile, message, userAgent = "") {
  const number = normalizeParentMobile(mobile);
  if (!number) return "";
  if (channel === "call") return `tel:${number}`;
  if (channel === "whatsapp") return `https://wa.me/${number.slice(1)}?text=${encodeURIComponent(message)}`;
  if (channel === "sms") return `sms:${number}${/iPhone|iPad|iPod/.test(userAgent) ? "&" : "?"}body=${encodeURIComponent(message)}`;
  return "";
}

export function communicationRecord(student, contact, date, channel, actor, extra = {}) {
  return {
    ...extra, id: crypto.randomUUID(), studentId: student.id, studentName: student.name,
    className: student.className, division: student.division, attendanceDate: date,
    parentName: contact.name, parentMobile: contact.mobile, contactType: contact.id,
    initiatedBy: actor, initiatedAt: new Date().toISOString(), channel,
    callType: channel === "call" ? "Device dialer" : undefined,
    status: extra.status || (channel === "call" ? "Dialer requested" : "Composer requested"), remark: extra.remark || "",
  };
}

export const followupStatuses = ["Pending", "Parent Contacted", "No Response", "Explained", "Medical Leave", "Follow-up Required"];

// A serializable contract for a future authenticated server worker. No provider
// or browser-side credentials; creating a job does not dispatch a voice call.
export function createVoiceCallJob({ schoolId, studentId, contactId, attendanceDate, audioAssetId, requestedBy }) {
  if (![schoolId, studentId, contactId, attendanceDate, audioAssetId, requestedBy].every(Boolean)) throw new Error("Voice job requires school, student, contact, date, audio and actor");
  return { version: 1, channel: "voice", schoolId, studentId, contactId, attendanceDate, audioAssetId, requestedBy,
    idempotencyKey: JSON.stringify([schoolId, studentId, contactId, attendanceDate, audioAssetId]), status: "awaiting_provider", createdAt: new Date().toISOString() };
}
