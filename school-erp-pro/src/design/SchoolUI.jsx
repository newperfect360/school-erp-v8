import Icon from "../components/Icon";
import { useLanguage } from "./language";

export function SchoolMark({ logo, large = false }) {
  return <div className={`school-seal${large ? " large" : ""}`}>{logo ? <img src={logo} alt="School logo" /> : <svg viewBox="0 0 56 64" fill="none" aria-hidden="true"><path d="M5 5h46v30c0 12-12 20-23 26C17 55 5 47 5 35V5Z" stroke="currentColor" strokeWidth="1.6"/><path d="M10 10h36v25c0 9-9 16-18 21-9-5-18-12-18-21V10Z" stroke="currentColor" strokeOpacity=".4"/><path d="m16 21 12-6 12 6-12 6-12-6Z" fill="currentColor"/><path d="M19 24v7c6 4 12 4 18 0v-7M28 38v10m0-8c-4-4-9-4-13-3v9c5-1 9 0 13 3 4-3 8-4 13-3v-9c-4-1-9-1-13 3Z" stroke="currentColor" strokeWidth="1.5"/></svg>}</div>;
}

export function Avatar({ name = "", photo, size = "normal", tone = "blue" }) {
  return <span className={`school-avatar avatar-${size} tone-${tone}`}>{photo ? <img src={photo} alt={name} /> : name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join("") || <Icon name="users" />}</span>;
}

export function PageHeading({ eyebrow, title, description, children }) {
  return <div className="academic-heading"><div>{eyebrow && <span className="academic-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{children && <div className="heading-actions">{children}</div>}</div>;
}

export function Panel({ title, subtitle, action, children, className = "" }) {
  return <section className={`school-panel ${className}`}><div className="school-panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}

export function EmptyState({ icon = "book", title, description, action, compact = false }) {
  return <div className={`school-empty${compact ? " compact" : ""}`}><span><Icon name={icon} size={26} /></span><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return <div className="language-switch" role="group" aria-label="Application language"><button type="button" lang="en" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button><button type="button" lang="mr" aria-pressed={language === "mr"} onClick={() => setLanguage("mr")}>मराठी</button></div>;
}

export function CampusIllustration({ className = "" }) {
  return <svg className={`campus-illustration ${className}`} viewBox="0 0 500 290" fill="none" aria-hidden="true">
    <circle cx="366" cy="64" r="41" fill="#E9BD69" opacity=".9"/><path d="M22 246h458" stroke="#8C9CA6" strokeWidth="2"/><path d="M60 248V110h126v138M314 248V110h126v138" fill="#F5EDDC"/><path d="M52 104h142v12H52zM306 104h142v12H306z" fill="#CBBDA6"/><path d="M177 247V81h146v166" fill="#FFF9EC"/><path d="m165 84 85-56 85 56H165Z" fill="#C67C56"/><path d="m184 80 66-42 66 42H184Z" fill="#DF9B71"/><path d="M174 91h152" stroke="#BDAE94" strokeWidth="3"/>
    <circle cx="250" cy="108" r="17" fill="#F7EFDE" stroke="#9C967F" strokeWidth="2"/><path d="M250 97v12l8 5" stroke="#455367" strokeWidth="2" strokeLinecap="round"/>
    {[82, 126, 342, 386].map(x => <g key={x}><path d={`M${x} 133h24v35h-24zM${x} 188h24v35h-24z`} fill="#536A80"/><path d={`M${x + 12} 133v35M${x} 150h24M${x + 12} 188v35M${x} 205h24`} stroke="#D7E1DE" strokeWidth="2"/></g>)}
    {[196, 225, 260, 289].map(x => <path key={x} d={`M${x} 140h16v30h-16z`} fill="#536A80"/>)}
    <path d="M228 246v-40a22 22 0 0 1 44 0v40" fill="#35485D"/><path d="M250 186v60" stroke="#8E9CAB"/><path d="M211 247h78v7h-78zM202 254h96v7h-96z" fill="#C3B6A1"/><path d="M250 28V1m1 1h38l-8 10 8 10h-38" stroke="#D8A252" strokeWidth="2"/><path d="M253 3h32l-7 9 7 8h-32" fill="#D8A252"/>
    <path d="M37 243v-77M459 244v-66" stroke="#7A8164" strokeWidth="5"/><ellipse cx="37" cy="166" rx="25" ry="46" fill="#90A891"/><ellipse cx="459" cy="178" rx="22" ry="39" fill="#819D88"/><path d="M15 244c0-12 11-20 22-11 8-12 27-5 25 11M434 244c2-16 19-18 26-8 12-7 24-1 24 8" fill="#637F72"/>
    <path d="M62 268h119m138 0h109" stroke="#C4CFCA" strokeWidth="2" strokeDasharray="6 8"/><path d="M236 262 214 284m50-22 22 22" stroke="#C4CFCA" strokeWidth="2"/>
    <path d="m92 48 10-4 10 4m14 15 8-4 8 4" stroke="#B6C2C4" strokeWidth="2" strokeLinecap="round"/>
  </svg>;
}
