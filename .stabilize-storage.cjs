const fs=require('fs');let s=fs.readFileSync('app.js','utf8');
s=s.replace(/^const get=k=>[^\n]+/m,`const unreadableStorage=new Set();
function readLegacy(k,fallback){try{const raw=localStorage.getItem('v32_'+k);if(raw===null)return fallback;const value=JSON.parse(raw);if(Array.isArray(fallback)?!Array.isArray(value):!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid data');return value}catch{if(!unreadableStorage.has(k)){unreadableStorage.add(k);queueMicrotask(()=>alert('जुना '+k+' डेटा वाचता येत नाही. डेटा बदललेला नाही. Backup तपासा.'))}return fallback}}
function writeLegacy(k,value){if(unreadableStorage.has(k))throw Error('Saved data cannot be read');localStorage.setItem('v32_'+k,JSON.stringify(value))}
const get=k=>readLegacy(k,[]),set=writeLegacy,getO=k=>readLegacy(k,{}),setO=writeLegacy;`);
s+=`\n// Keep the in-memory lists unchanged if the browser refuses a save.\nfor(const name of ['saveStudent','loadSampleStudents','seedTemplates','saveAttendance','saveHomework','saveResult','saveFee','saveHealth','saveDist','saveGeneric','saveGenericStudent','saveTemplate','saveWA','saveFirebase','saveSettings']){const action=window[name];window[name]=function(...args){const previous=structuredClone(D);try{return action(...args)}catch{D=previous;renderAll();alert('Save झाले नाही. Browser storage किंवा जुना डेटा तपासा.')}}}\n`;
// Restore marked statuses instead of resetting loaded attendance to Present.
s=s.replace("data-status='P'", "data-status='${escapeHtml((D.attendance.find(a=>a.date===attDate.value&&a.className===s.className&&(a.studentId?a.studentId===s.id:a.name===s.name&&a.roll===s.roll))||{}).status||'P')}'");
s=s.replace("<span class='st'>P</span>", "<span class='st'>${escapeHtml((D.attendance.find(a=>a.date===attDate.value&&a.className===s.className&&(a.studentId?a.studentId===s.id:a.name===s.name&&a.roll===s.roll))||{}).status||'P')}</span>");
s=s.replace("D.attendance.push({date,className:","D.attendance.push({studentId:s.id,date,className:");
fs.writeFileSync('app.js',s);
