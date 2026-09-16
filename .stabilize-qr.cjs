const fs=require('fs');
for(const [page,prefix,size] of [['Certificates','Certificate Verify:',120],['IDCard','Student ID:',100]]){
 const path=`school-erp-pro/src/pages/${page}.jsx`;let s=fs.readFileSync(path,'utf8');
 s=s.replace('import { useState } from "react";', 'import { useState } from "react";\nimport { qrImage } from "../qr";');
 s=s.replace(/const qrText = encodeURIComponent\(([^\n]+)\);/, 'const qrText = $1;');
 s=s.replace(/const qrUrl = `https:\/\/api.qrserver.com[^\n]+;/, 'const qrUrl = qrImage(qrText);');
 s=s.replace('<img src={qrUrl} alt="QR" />',`{qrUrl ? <img src={qrUrl} alt="QR" width="${size}" height="${size}" /> : <p>QR साठी मजकूर खूप मोठा आहे.</p>}`);
 fs.writeFileSync(path,s);
}
let html=fs.readFileSync('index.html','utf8');html=html.replace('<script src="patch/sprint1-student-master-tc-qr.js">','<script src="assets/vendor/qrcode.js"></script>\n<script src="patch/sprint1-student-master-tc-qr.js">');fs.writeFileSync('index.html',html);
let p=fs.readFileSync('patch/sprint1-student-master-tc-qr.js','utf8');
p=p.replace('return "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=" + encodeURIComponent(text);', 'const code = qrcode(0, "M");\n  qrcode.stringToBytes = value => Array.from(new TextEncoder().encode(value));\n  code.addData(text);\n  code.make();\n  return code.createDataURL(4, 16);');
p=p.replaceAll('s.qr || qrUrl(profileUrl(s))','qrUrl(profileUrl(s))');fs.writeFileSync('patch/sprint1-student-master-tc-qr.js',p);
const pkg='school-erp-pro/package.json';const json=JSON.parse(fs.readFileSync(pkg));json.scripts.test='playwright test';fs.writeFileSync(pkg,JSON.stringify(json,null,2)+'\n');
