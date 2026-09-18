import {readdirSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const ignored=new Set(['.git','node_modules','dist','build','.gradle','.kotlin','.bootstrap','vendor','artifacts']);
const patterns=[/\u0905\u092e\u093e\u0928\u091c\u0932\u094d\u0932\u093e/u,/\u091b\u0924\u094d\u0930\u092a\u0924\u0940\s+\u0938\u0902\u092d\u093e\u091c\u0940\u0928\u0917\u0930/u,/GBS SCHOOL|GBS School/];
const findings=[];let filesScanned=0;
function scan(dir){for(const item of readdirSync(dir,{withFileTypes:true})){if(ignored.has(item.name))continue;const file=join(dir,item.name);if(item.isDirectory()){scan(file);continue}if(!/\.(?:jsx?|mjs|cjs|json|xml|kt|html|md|txt|css|svg)$/.test(item.name)||file===new URL(import.meta.url).pathname||item.name==='audit-school-identity.mjs')continue;filesScanned++;readFileSync(file,'utf8').split(/\r?\n/).forEach((line,index)=>{if(patterns.some(p=>p.test(line)))findings.push({file:relative(root,file),line:index+1})})}}
scan(root);
const hash=file=>createHash('sha256').update(readFileSync(resolve(root,file))).digest('hex');
const logoUnchanged=hash('assets/school-logo.jpg')===hash('android-app/GBSSCHOOL/app/src/main/res/drawable-nodpi/official_school_logo.jpg');
const result={filesScanned,findings,logoUnchanged,scope:'Current text source, configuration, templates and docs. Excludes build/dependency caches, historical screenshots, immutable issued records and external browser storage.'};
const folder=resolve(root,'school-erp-pro/artifacts/official-identity');mkdirSync(folder,{recursive:true});writeFileSync(join(folder,'source-audit.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(findings.length||!logoUnchanged)process.exitCode=1;
