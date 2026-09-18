import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import * as XLSX from 'xlsx';
import {nav} from './portal-navigation.mjs';
import {portalGroups} from '../src/design/portalNavigation.js';

// No screenshot, video, trace, demo page, or user's persistent browser profile.
test.use({screenshot:'off',video:'off',trace:'off'});
const local='http://127.0.0.1:4178';
const live='https://school-erp-v8.vercel.app';
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
async function open(page,url){
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.getByLabel('Username',{exact:true}).fill('admin');
 await page.getByLabel('Password',{exact:true}).fill('123456');
 await page.getByRole('button',{name:'Login',exact:true}).click();
 await page.getByRole('button',{name:'EN',exact:true}).click();
 await page.locator('.school-event-hero').waitFor();
 await page.evaluate(()=>document.fonts.ready);
 await page.mouse.move(0,0);
}
test('actual live and locally built frontend have identical assets and rendered layout',async({browser,request})=>{
 test.setTimeout(180000);
 const index=await request.get(local);const liveIndex=await request.get(live);
 expect(index.ok()).toBeTruthy();expect(liveIndex.ok()).toBeTruthy();
 const html=await index.text();expect(await liveIndex.text()).toBe(html);
 const files=[...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(m=>m[1]);
 expect(files.length).toBeGreaterThanOrEqual(2);
 for(const path of files){const a=await request.get(local+path),b=await request.get(live+path);expect(a.ok()).toBeTruthy();expect(b.ok()).toBeTruthy();expect(hash(await b.body()),path).toBe(hash(await a.body()));console.log(`LIVE ASSET MATCH ${path} ${hash(await a.body())}`)}
 const signatures=[];
 for(const url of ['http://127.0.0.1:5178',local,live]){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await open(page,url);
  signatures.push(await page.evaluate(()=>['.portal-masthead','.portal-nav','.school-event-hero','#school-main'].map(selector=>{const e=document.querySelector(selector),s=getComputedStyle(e),r=e.getBoundingClientRect();return {selector,text:e.innerText,display:s.display,color:s.color,background:s.backgroundColor,font:s.fontFamily,rect:[r.x,r.y,r.width,r.height]}})));
  let routes=0;
  for(const group of portalGroups)for(const item of group.items){await page.locator('.portal-group-trigger').filter({hasText:group.en}).click();await page.locator('.portal-dropdown:not([hidden])').getByRole('button',{name:item.en,exact:true}).click();await expect(page.locator('#school-main')).not.toBeEmpty();await expect(page.getByText('This page could not be displayed')).toHaveCount(0);routes++}
  expect(errors).toEqual([]);console.log(`REAL APP ${url}: ${routes} destinations, no page errors`);await context.close();
 }
 expect(signatures[1]).toEqual(signatures[0]);expect(signatures[2]).toEqual(signatures[0]);console.log('Development, local production build and Vercel: matching rendered text, layout, colors and fonts.');
});

for(const [label,url] of [['local-production',local],['actual-vercel',live]])test(`${label}: Student Master, add, archive, Excel, year and class/division changes`,async({page,context})=>{
 test.setTimeout(120000);
 // Existing deployed app is browser-local. Block outbound mutations as an extra
 // guard: this test may write only its fresh browser context, never school servers.
 await context.route('**/*',route=>['GET','HEAD','OPTIONS'].includes(route.request().method())?route.continue():route.abort());
 page.on('dialog',dialog=>dialog.accept());
 await open(page,url);await nav(page,'Students');
 for(const name of ['Add student','Import Excel','Download Excel Template','Export Excel'])await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download Excel Template',exact:true}).click();
 const download=await downloadPromise;const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);
 const template=XLSX.read(Buffer.concat(chunks),{type:'buffer'});expect(template.SheetNames.length).toBeGreaterThan(0);
 const columns=XLSX.utils.sheet_to_json(template.Sheets[template.SheetNames[0]],{header:1})[0];expect(columns).toContain('Photo Number');expect(columns).toContain('Father Mobile');
 await page.getByRole('button',{name:'Add student',exact:true}).click();
 for(const [name,value]of Object.entries({name:'Source Check Student',className:'8',division:'A',rollNo:'81',grNo:'SOURCE-CHECK-1',fatherMobile:'9000000001'}))await page.locator(`input[name="${name}"]`).fill(value);
 await page.getByRole('button',{name:'Save Student',exact:true}).click();
 const row=()=>page.locator('tr[data-student-id]').filter({hasText:'SOURCE-CHECK-1'});
 await expect(row()).toHaveCount(1);
 async function change(action,fields,confirm='Confirm student change'){
  await row().getByRole('button',{name:action,exact:true}).click();
  const dialog=page.getByRole('dialog');for(const [label,value]of Object.entries(fields))await dialog.getByLabel(label,{exact:true}).fill(value);
  await dialog.getByLabel('Reason for change',{exact:true}).fill('Isolated browser verification');
  await dialog.getByRole('button',{name:'Preview change',exact:true}).click();await dialog.getByLabel('I reviewed this student and the proposed change.',{exact:true}).check();await dialog.getByRole('button',{name:confirm,exact:true}).click();await expect(dialog).toHaveCount(0);
 }
 await change('Change Class',{'New standard':'9'});await expect(row().locator('td').nth(3)).toHaveText('9');
 await change('Change Division',{'New division':'B'});await expect(row().locator('td').nth(4)).toHaveText('B');
 await nav(page,'AcademicYears');await page.getByLabel('Academic year name',{exact:true}).fill('2027-28');await page.getByRole('button',{name:'Create Academic Year',exact:true}).click();
 await page.locator('.year-cards article').filter({has:page.getByRole('heading',{name:'2027-28',exact:true})}).getByRole('button',{name:'Activate year',exact:true}).click();
 await expect(page.locator('.year-cards .current-year')).toContainText('2027-28');
 await nav(page,'Students');await change('Change Academic Year',{'Destination academic year':'2027-28'});await expect(row()).toContainText('2027-28');
 await change('Delete',{},'Confirm archive');await expect(row()).toHaveCount(0);await page.getByLabel('Show inactive / archived students',{exact:true}).check();await expect(row()).toHaveCount(1);
 await row().getByRole('button',{name:'Restore student',exact:true}).click();await page.getByLabel('Show inactive / archived students',{exact:true}).uncheck();await expect(row()).toHaveCount(1);
 await row().getByRole('button',{name:'Archive student',exact:true}).click();await expect(row()).toHaveCount(0);
 await page.getByRole('button',{name:'Import Excel',exact:true}).click();
 const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet([{'Student Name':'Aditi Patil','Class':'8','Division':'A','Roll Number':'82','GR Number':'SOURCE-IMPORT-1','Academic Year':'2027-28','Father Mobile':'9000000002'}]),'Students');
 await page.getByLabel('Upload Excel',{exact:true}).setInputFiles({name:'source-verification.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:XLSX.write(book,{type:'buffer',bookType:'xlsx'})});
 await page.getByRole('button',{name:'Validate',exact:true}).click();await page.getByLabel('I reviewed all rows and before/after changes. Save only the selected actions.').check();await page.getByRole('button',{name:'Confirm Import',exact:true}).click();await expect(page.locator('tr[data-student-id]').filter({hasText:'SOURCE-IMPORT-1'})).toHaveCount(1);
 console.log(`${label}: all seven requested workflows passed in the actual served app; server mutations blocked.`);
});
