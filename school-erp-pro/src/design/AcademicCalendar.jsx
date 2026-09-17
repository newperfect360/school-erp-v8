import { useState } from "react";
import { localDate } from "../storage";
import Icon from "../components/Icon";
import { useLanguage } from "./language";
import { EmptyState, Panel } from "./SchoolUI";

export default function AcademicCalendar({ events, onNavigate }) {
  const { language, t } = useLanguage();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(localDate());
  const firstDay = (month.getDay() + 6) % 7;
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const keyFor = day => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const selectedEvents = events.filter(event => event.date === selected);
  return <Panel title={t("Academic calendar", "शालेय दिनदर्शिका")} action={<button className="icon-button" aria-label={t("Open academic calendar", "शालेय दिनदर्शिका उघडा")} onClick={() => onNavigate("Calendar")}><Icon name="arrow" size={18} /></button>} className="calendar-panel">
    <div className="calendar-month"><strong>{month.toLocaleDateString(language === "mr" ? "mr-IN" : "en-IN", { month: "long", year: "numeric" })}</strong><div><button className="icon-button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Icon name="back" size={15} /></button><button className="icon-button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Icon name="arrow" size={15} /></button></div></div>
    <div className="calendar-week">{t(["M", "T", "W", "T", "F", "S", "S"], ["सो", "मं", "बु", "गु", "शु", "श", "र"]).map((day, i) => <span key={i}>{day}</span>)}</div>
    <div className="calendar-days">{Array.from({ length: firstDay }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: totalDays }, (_, i) => { const date = keyFor(i + 1); return <button key={date} aria-label={date} aria-pressed={selected === date} className={`${date === localDate() ? "today " : ""}${events.some(e => e.date === date) ? "has-event" : ""}`} onClick={() => setSelected(date)}>{i + 1}</button>; })}</div>
    <div className="calendar-events"><span className="academic-eyebrow">{selected === localDate() ? t("TODAY AT SCHOOL", "आज शाळेत") : selected}</span>{selectedEvents.length ? selectedEvents.map(event => <button className="calendar-event" key={event.id} onClick={() => onNavigate("Calendar")}><span className="event-line" /><div><strong>{event.title}</strong><span>{[event.time, event.location].filter(Boolean).join(" · ") || event.type}</span></div><Icon name="chevron" size={14} /></button>) : <div className="calendar-no-events">{t("No events scheduled for this day.", "या दिवसासाठी कोणतेही कार्यक्रम नाहीत.")}</div>}</div>
    {!events.length && <EmptyState compact icon="calendar" title={t("Make room for school life", "शालेय उपक्रमांची नोंद करा")} action={<button className="school-link" onClick={() => onNavigate("Calendar")}>{t("Add a school event", "शालेय कार्यक्रम जोडा")}<Icon name="plus" size={15} /></button>} />}
  </Panel>;
}
