/** Web and Android use the same server-owned school/student IDs. No admin SDK in clients. */
import {currentSiteUrls} from '../config/siteUrls';
export const backendCapabilities = Object.freeze({ version: 1, collections: ["students", "attendance", "homework", "results", "documentIssues", "trips", "sports", "scholarships", "libraryLoans", "equipmentLoans", "communications", "auditEvents", "photoImports", "feeLedger", "parentMeetings", "parentVisits", "studentCheckouts", "messageTemplates", "messageJobs", "automationSettings", "resultPublications", "academicHistory", "studentMovements", "longAbsenceSettings", "longAbsenceAlerts", "longAbsenceFollowups"], identityProvider: "firebase-auth", configured: Boolean(import.meta.env.VITE_SCHOOL_API_URL) });
export function createSchoolApi({ baseUrl = import.meta.env.VITE_SCHOOL_API_URL || currentSiteUrls().apiBaseUrl, getIdToken, schoolId }) {
  const url = new URL(baseUrl);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("School API must use HTTPS.");
  if (!schoolId || typeof getIdToken !== "function") throw new Error("Verified identity and school scope are required.");
  return { async request(resource, { method = "GET", body, expectedVersion, signal } = {}) {
    if (!backendCapabilities.collections.includes(resource)) throw new Error("Unknown school resource.");
    const token = await getIdToken(); if (!token) throw new Error("Sign-in required.");
    const response = await fetch(`${url.href.replace(/\/$/, "")}/v1/schools/${encodeURIComponent(schoolId)}/${resource}`, { method, signal, credentials: "omit", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(expectedVersion ? { "If-Match": String(expectedVersion) } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.ok) throw new Error(response.status === 409 ? "Record changed. Reload before saving." : `School request failed (${response.status}).`);
    return response.status === 204 ? null : response.json();
  } };
}
