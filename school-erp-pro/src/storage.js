import { notify } from "./components/Feedback";
import { useRef, useState } from "react";

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
    localStorage.setItem(key, JSON.stringify(value));
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
  const save = (next) => {
    const updated = typeof next === "function" ? next(current.current) : next;
    if (!writeStored(key, updated)) return false;
    current.current = updated;
    setValue(updated);
    return true;
  };
  return [value, save];
}

export function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
