import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {portalGroups} from '../src/design/portalNavigation.js';
import {nav} from '../tests/portal-navigation.mjs';

// Fresh, isolated browser contexts only: never reads or clears a user's browser data.
const output=new URL('../artifacts/deployment-parity/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const targets=[['local',process.env.LOCAL_URL||'http://127.0.0.1:5178'],['production-preview',process.env.PREVIEW_URL||'http://127.0.0.1:4178']];
if(process.env.LIVE_URL)targets.push([process.env.LIVE_LABEL||'vercel',process.env.LIVE_URL]);
const report={checkedAt:new Date().toISOString(),targets:[]};
try {
 for(const [label,url] of targets){
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  const result={label,url,status:response.status(),errors,routes:[]};report.targets.push(result);
  const react=await page.locator('#root').count();result.frontend=react?'React':'legacy';
  if(!react){await page.screenshot({path:new URL(`${label}-home.png`,output).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});await context.close();continue;}
  await page.getByLabel('Username',{exact:true}).fill('admin');
  await page.getByLabel('Password',{exact:true}).fill('123456');
  await page.getByRole('button',{name:'Login',exact:true}).click();
  await page.getByRole('button',{name:'EN',exact:true}).click();
  await page.locator('.school-event-hero').waitFor();await page.evaluate(()=>document.fonts.ready);
  async function shot(name){await page.mouse.move(0,0);await page.evaluate(()=>document.fonts.ready);const buffer=await page.screenshot({fullPage:true,animations:'disabled'});await writeFile(new URL(`${label}-${name}.png`,output),buffer);return createHash('sha256').update(buffer).digest('hex');}
  result.homeScreenshotHash=await shot('home');
  await nav(page,'Students');
  for(const name of ['Add student','Import Excel','Download Excel Template','Export Excel'])await page.getByRole('button',{name,exact:true}).waitFor();
  await shot('students');
  await page.getByRole('button',{name:'Import Excel',exact:true}).click();
  await page.getByRole('heading',{name:'Student Excel Import',exact:true}).waitFor();await shot('excel-import');
  for(const group of portalGroups)for(const item of group.items){
   await page.locator('.portal-group-trigger').filter({hasText:group.en}).click();
   await page.locator('.portal-dropdown:not([hidden])').getByRole('button',{name:item.en,exact:true}).click();
   if(await page.getByText('This page could not be displayed').count())throw Error(`${label}: failed route ${item.en}`);
   if(!(await page.locator('#school-main').innerText()).trim())throw Error(`${label}: empty route ${item.en}`);
   result.routes.push(item.en);
  }
  await page.goto(url+'/download-app',{waitUntil:'domcontentloaded'});await page.getByRole('heading').first().waitFor();result.downloadPage=await page.getByRole('heading').allTextContents();
  if(errors.length)throw Error(`${label}: browser errors: ${errors.join('; ')}`);
  await context.close();
 }
 report.localAndBuildScreenshotsIdentical=report.targets[0].homeScreenshotHash===report.targets[1].homeScreenshotHash;
 if(report.targets[2]?.frontend==='React')report.localAndLiveScreenshotsIdentical=report.targets[0].homeScreenshotHash===report.targets[2].homeScreenshotHash;
 await writeFile(new URL('verification.json',output),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
} finally {await writeFile(new URL('verification.json',output),JSON.stringify(report,null,2));await browser.close();}
