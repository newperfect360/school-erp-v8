const fs=require('fs');let p=fs.readFileSync('patch/sprint1-student-master-tc-qr.js','utf8');
p=p.replace('const STORE =', 'const escape = value => String(value ?? "").replace(/[&<>"\']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;", "\'":"&#39;"}[c]));\nconst display = student => Object.fromEntries(Object.entries(student).map(([k,v]) => [k, typeof v === "string" ? escape(v) : v]));\nconst STORE =');
p=p.replace('const data=load();','const data=load().map(display);').replace('const s=load().find(x=>x.id===id);','const raw=load().find(x=>x.id===id);\n  const s=raw && display(raw);').replace('const s = load().find(x=>x.id===id);','const raw = load().find(x=>x.id===id);\n  const s = raw && display(raw);');
p=p.replace('onclick="ERPStudent.preview(\'${s.id}\')"','data-student-id="${s.id}"');
p=p.replace('function preview(id){','document.addEventListener("click", event => { const button = event.target.closest("button[data-student-id]"); if(button) preview(button.dataset.studentId); });\n\nfunction preview(id){');
p=p.replace('  const data = load();','  const data = load();\n  if (!sm_name.value.trim() || !sm_admissionNo.value.trim()) { alert("नाव आणि प्रवेश क्रमांक भरा"); return; }\n  if(data.some(s => s.admissionNo === sm_admissionNo.value.trim())) { alert("प्रवेश क्रमांक आधीच नोंदवलेला आहे"); return; }');
fs.writeFileSync('patch/sprint1-student-master-tc-qr.js',p);
for(const page of ['Students','Teachers']) {
 const path=`school-erp-pro/src/pages/${page}.jsx`;let s=fs.readFileSync(path,'utf8');
 s=s.replace('import { useState }','import { useRef, useState }').replace(`export default function ${page}() {`,`export default function ${page}() {\n  const photoInput = useRef(null);`);
 s=s.replace('    setForm({\n      ', '    if (photoInput.current) photoInput.current.value = "";\n    setForm({\n      ');
 s=s.replace('<input type="file" name="photo"','<input ref={photoInput} type="file" name="photo"');
 fs.writeFileSync(path,s);
}
