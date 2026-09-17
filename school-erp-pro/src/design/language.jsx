import { createContext, useContext, useEffect } from "react";
import { useStoredState } from "../storage";

const LanguageContext = createContext({ language: "mr", t: (en, mr) => mr || en });

export function LanguageProvider({ children }) {
  const [preference, setPreference] = useStoredState("erp_pro_language", { value: "mr" });
  const language = preference.value === "en" ? "en" : "mr";
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage: value => setPreference({ value }), t: (en, mr) => language === "mr" ? mr || en : en }}>
    {children}
  </LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }

// Presentation adapters only. Reading a translated value never mutates the source.
export function studentDisplayName(student, language) {
  return (language === "mr" ? student.student_name_mr || student.name_mr : student.student_name_en) || student.name || student.student_name_en || "—";
}

export function academicYear(settings = {}, date = new Date()) {
  const start = date.getMonth() >= 5 ? date.getFullYear() : date.getFullYear() - 1;
  return settings.academicYear || `${start}–${String(start + 1).slice(-2)}`;
}
