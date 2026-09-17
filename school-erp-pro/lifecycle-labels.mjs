import fs from 'node:fs';
for(const file of ['src/pages/StudentLifecycle.jsx','src/pages/LongAbsence.jsx']){let s=fs.readFileSync(file,'utf8');s=s.replace(/<label>([^<{]+)<select /g,(_,label)=>`<label>${label}<select aria-label="${label.trim()}" `);fs.writeFileSync(file,s);}
