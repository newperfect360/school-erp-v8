import {lifecycleActive} from './studentLifecycle.js';
export const isActiveStudent = lifecycleActive;
export const classKey = student => [student.className, student.division].filter(Boolean).join(" / ");

export function attendanceSummary(students, day = {}) {
  const summary = { total: students.length, present: 0, absent: 0, other: 0, pending: 0, recorded: 0 };
  for (const student of students) {
    const status = day[student.id];
    if (!status) summary.pending += 1;
    else if (["Present", "Late", "Half Day"].includes(status)) summary.present += 1;
    else if (status === "Absent") summary.absent += 1;
    else summary.other += 1;
  }
  summary.recorded = summary.total - summary.pending;
  summary.rate = summary.recorded ? Math.round(summary.present / summary.recorded * 100) : null;
  return summary;
}

export function teacherClasses(teacher, assignments, teachers) {
  if (!teacher) return [];
  // Legacy name matching is allowed only when exactly one teacher has that name.
  const uniqueName = teachers.filter(t => t.name === teacher.name).length === 1;
  const mapped = assignments.filter(a => a.teacherId ? String(a.teacherId) === String(teacher.id) : uniqueName && a.teacherName === teacher.name);
  const explicit = (Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : []).map(c => typeof c === "string" ? { className: c, division: "" } : c);
  return [...mapped, ...explicit].filter((c, i, all) => c.className && all.findIndex(other => classKey(other) === classKey(c)) === i);
}

export function matchesClass(student, group) {
  return String(student.className) === String(group.className) && (!group.division || student.division === group.division);
}

export function calendarEvent(item) {
  return { id: item.id, title: item.title || item["कार्यक्रम"] || "", type: item.type || item["प्रकार"] || "", date: item.date || item["दिनांक"] || "", time: item.time || item["वेळ"] || "", location: item.location || item["ठिकाण"] || "" };
}
