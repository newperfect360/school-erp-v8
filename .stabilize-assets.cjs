const fs=require('fs');
let html=fs.readFileSync('index.html','utf8').replace('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','assets/vendor/xlsx.full.min.js');
html=html.replace('<title>', '<link rel="icon" href="assets/school-logo.jpg"><title>');fs.writeFileSync('index.html',html);
let p=fs.readFileSync('patch/sprint1-student-master-tc-qr.js','utf8');
p=p.replace('window.ERPStudent =', 'window.addEventListener("hashchange", () => {\n  if (location.hash.startsWith("#verify-student=")) verifyFromHash();\n  else if (document.querySelector(".verify-page")) location.reload();\n});\n\nwindow.ERPStudent =');
fs.writeFileSync('patch/sprint1-student-master-tc-qr.js',p);
