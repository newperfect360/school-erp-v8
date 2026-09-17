import { notify } from "./components/Feedback";
import { useRef, useState } from "react";
import {tagNewYearRecords,yearForDate,academicYears} from './services/academicYears';

export function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    if (Array.isArray(fallback) ? !Array.isArray(value) : !value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Invalid saved data");
    }
    return Array.isArray(fallback) ? value : { ...fallback, ...value };
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    const existing = localStorage.getItem(key);
    if (existing !== null) {
      const parsed = JSON.parse(existing);
      if (Array.isArray(value) ? !Array.isArray(parsed) : !parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid saved data");
      }
    }
    if(key==='erp_pro_attendance'){commitStoredBatch({[key]:value});return true;}
    localStorage.setItem(key, JSON.stringify(tagNewYearRecords(key,value,existing?JSON.parse(existing):[])));
    return true;
  } catch {
    notify("माहिती Save झाली नाही. Browser storage उपलब्ध नाही, भरलेले आहे किंवा जुना डेटा वाचता येत नाही. जुना डेटा बदललेला नाही.");
    return false;
  }
}

// Write before updating the screen, so a failed save never appears successful.
export function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStored(key, fallback));
  const current = useRef(value);
  const snapshot = useRef(localStorage.getItem(key));
  const save = (next) => {
    if (localStorage.getItem(key) !== snapshot.current) {
      notify("Data changed in another screen or tab. Reopen this module before saving.");
      return false;
    }
    const updated = typeof next === "function" ? next(current.current) : next;
    if (!writeStored(key, updated)) return false;
    snapshot.current = localStorage.getItem(key);
    const saved = readStored(key, updated);
    current.current = saved;
    setValue(saved);
    return true;
  };
  const reload = () => { const latest = readStored(key, fallback); current.current = latest; snapshot.current = localStorage.getItem(key); setValue(latest); };
  return [value, save, reload];
}

// Synchronous multi-key local commit with rollback. This is not a cloud transaction.
export function commitStoredBatch(entries, expected = {}) {
  entries=Object.fromEntries(Object.entries(entries).map(([key,value])=>[key,tagNewYearRecords(key,value,readStored(key,[]))]));
  if(entries.erp_pro_attendance){const years=readStored('erp_pro_attendance_years',{}),before=readStored('erp_pro_attendance',{});for(const date of Object.keys(entries.erp_pro_attendance)){if(JSON.stringify(before[date])===JSON.stringify(entries.erp_pro_attendance[date]))continue;const year=years[date]||yearForDate(date);if(academicYears().some(y=>y.id===year&&y.status!=='Open'))throw Error('Attendance year is closed or archived. Reopen it before editing.');years[date]=year;}entries.erp_pro_attendance_years=years;}
  const previous = Object.fromEntries(Object.keys(entries).map(key => [key, localStorage.getItem(key)]));
  if (Object.entries(expected).some(([key, value]) => localStorage.getItem(key) !== value)) throw new Error("Data changed since preview. Reload and validate again.");
  for (const [key, value] of Object.entries(entries)) {
    if (previous[key] !== null) {
      const parsed = JSON.parse(previous[key]);
      if (Array.isArray(value) !== Array.isArray(parsed)) throw new Error("Existing data cannot be safely replaced.");
    }
  }
  const changed = [];
  try { for (const [key, value] of Object.entries(entries)) { localStorage.setItem(key, JSON.stringify(value)); changed.push(key); } }
  catch (error) {
    for (const key of changed) localStorage.removeItem(key);
    for (const key of changed) if (previous[key] !== null) localStorage.setItem(key, previous[key]);
    throw error;
  }
  window.dispatchEvent(new Event("school-data-changed"));
}

export function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
