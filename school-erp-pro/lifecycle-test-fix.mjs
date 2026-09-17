import fs from 'node:fs';
let p='tests/lifecycle.spec.js',s=fs.readFileSync(p,'utf8');s=s.replace("localStorage.clear();localStorage.setItem('erp_pro_students'","localStorage.clear();localStorage.setItem('erp_pro_language',JSON.stringify({value:'en'}));localStorage.setItem('erp_pro_students'");fs.writeFileSync(p,s);
p='tests/audit-upgrade.spec.js';s=fs.readFileSync(p,'utf8').replace('expect(history.at(-1).status).toBe("Dialer requested")','expect(history.at(-1).status).toBe("Call Initiated")');fs.writeFileSync(p,s);
