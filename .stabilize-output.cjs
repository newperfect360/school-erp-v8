const fs=require('fs');let s=fs.readFileSync('app.js','utf8');
s='const escapeHtml=value=>String(value??" ").replace(/[&<>"\']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;", "\'":"&#39;"}[c]));\n'+s;
s=s.split('\n').map(line=>{
 if(!line.includes('innerHTML')&&!line.startsWith('function refreshSelects'))return line;
 return line.replace(/\$\{((?:s|a|r|f|g)\.\w+(?:\|\|[^{}]+)?|v\?\?''|h|k)\}/g,(_,expr)=>'${escapeHtml('+expr+')}');
}).join('\n');
// Passwords must not be echoed by generic tables or reports.
s=s.replace('Object.values(r).map(v=>', 'Object.entries(r).map(([key,value])=>{const v=key===\'uPass\'?\'••••••\':value;return ');
s=s.replace("`<td>${escapeHtml(v??'')}</td>`).join('')", "`<td>${escapeHtml(v??'')}</td>`}).join('')");
fs.writeFileSync('app.js',s);
