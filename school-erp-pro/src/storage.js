import {schoolStorage} from './backend/demoClient';
import {isSharedKey,sharedSnapshot,sharedOperationalEnabled} from "./backend/sharedReadCache";
import {resolveSchoolSettings} from './services/schoolIdentity';
import { notify } from "./components/Feedback";
import { useEffect, useRef, useState } from "react";
import {demoActive,demoCommit} from './backend/demoClient';
import {tagNewYearRecords,yearForDate,academicYears} from './services/academicYears';
const operationalKey=key=>key.startsWith('erp_pro_')&&key!=='erp_pro_language';

export function readStored(key, fallback) {
  // Never display a previous school's browser-only register in a cloud tenant.
  if(sharedOperationalEnabled&&operationalKey(key)&&!isSharedKey(key))return fallback;
  try {
    const raw = isSharedKey(key)?sharedSnapshot(key):schoolStorage.getItem(key);
    if(key==='schoolSettings'&&isSharedKey(key))return raw===null?fallback:JSON.parse(raw);
    if (raw === null) return key === "schoolSettings" ? resolveSchoolSettings(fallback) : fallback;
    const value = JSON.parse(raw);
    if (Array.isArray(fallback) ? !Array.isArray(value) : !value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Invalid saved data");
    }
    return key === "schoolSettings" ? resolveSchoolSettings(value) : Array.isArray(fallback) ? value : { ...fallback, ...value };
  } catch {
    return key === "schoolSettings" ? resolveSchoolSettings(fallback) : fallback;
  }
}

export function writeStored(key, value) {
  if(sharedOperationalEnabled&&operationalKey(key)&&!isSharedKey(key)){notify('This register needs its shared backend workflow. No browser-local production record was saved.');return false;}
  if(isSharedKey(key)){notify("Use the shared school save action. Browser-local writes are disabled for this register.");return false;}
  if(key === "schoolSettings")value=resolveSchoolSettings(value);
  try {
    const existing = schoolStorage.getItem(key);
    if (existing !== null) {
      const parsed = JSON.parse(existing);
      if (Array.isArray(value) ? !Array.isArray(parsed) : !parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid saved data");
      }
    }
    if(key==='erp_pro_attendance'){commitStoredBatch({[key]:value});return true;}
    schoolStorage.setItem(key, JSON.stringify(tagNewYearRecords(key,value,existing?JSON.parse(existing):[])));
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
  const snapshot = useRef(schoolStorage.getItem(key));
  const fallbackRef = useRef(fallback);
  useEffect(()=>{fallbackRef.current=fallback;});
  useEffect(()=>{const refresh=()=>{const raw=schoolStorage.getItem(key);if(raw!==snapshot.current){const latest=readStored(key,fallbackRef.current);current.current=latest;snapshot.current=raw;setValue(latest);}};window.addEventListener('school-data-changed',refresh);return()=>window.removeEventListener('school-data-changed',refresh);},[key]);
  const save = (next) => {
    if (schoolStorage.getItem(key) !== snapshot.current) {
      notify("Data changed in another screen or tab. Reopen this module before saving.");
      return false;
    }
    const updated = typeof next === "function" ? next(current.current) : next;
    if (!writeStored(key, updated)) return false;
    snapshot.current = schoolStorage.getItem(key);
    const saved = readStored(key, updated);
    current.current = saved;
    setValue(saved);
    return true;
  };
  const reload = () => { const latest = readStored(key, fallback); current.current = latest; snapshot.current = schoolStorage.getItem(key); setValue(latest); };
  return [value, save, reload];
}

// Synchronous multi-key local commit with rollback. This is not a cloud transaction.
export function commitStoredBatch(entries, expected = {}) {
  if(sharedOperationalEnabled&&Object.keys(entries).some(operationalKey))throw Error('Production school records require a shared database transaction. Browser data was not changed.');
  if(Object.keys(entries).some(isSharedKey))throw Error("This register requires an acknowledged Firestore transaction. No local copy was saved.");
  entries=Object.fromEntries(Object.entries(entries).map(([key,value])=>[key,tagNewYearRecords(key,value,readStored(key,[]))]));
  if(entries.erp_pro_attendance){const years=readStored('erp_pro_attendance_years',{}),before=readStored('erp_pro_attendance',{});for(const date of Object.keys(entries.erp_pro_attendance)){if(JSON.stringify(before[date])===JSON.stringify(entries.erp_pro_attendance[date]))continue;const year=years[date]||yearForDate(date);if(academicYears().some(y=>y.id===year&&y.status!=='Open'))throw Error('Attendance year is closed or archived. Reopen it before editing.');years[date]=year;}entries.erp_pro_attendance_years=years;}
  const previous = Object.fromEntries(Object.keys(entries).map(key => [key, schoolStorage.getItem(key)]));
  if (Object.entries(expected).some(([key, value]) => schoolStorage.getItem(key) !== value)) throw new Error("Data changed since preview. Reload and validate again.");
  if(demoActive()){demoCommit(entries,Object.fromEntries(Object.entries({...previous,...expected}).map(([key,value])=>[key,value===null?null:JSON.parse(value)])));return;}
  for (const [key, value] of Object.entries(entries)) {
    if (previous[key] !== null) {
      const parsed = JSON.parse(previous[key]);
      if (Array.isArray(value) !== Array.isArray(parsed)) throw new Error("Existing data cannot be safely replaced.");
    }
  }
  const changed = [];
  try { for (const [key, value] of Object.entries(entries)) { schoolStorage.setItem(key, JSON.stringify(value)); changed.push(key); } }
  catch (error) {
    for (const key of changed) schoolStorage.removeItem(key);
    for (const key of changed) if (previous[key] !== null) schoolStorage.setItem(key, previous[key]);
    throw error;
  }
  window.dispatchEvent(new Event("school-data-changed"));
}

export function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
