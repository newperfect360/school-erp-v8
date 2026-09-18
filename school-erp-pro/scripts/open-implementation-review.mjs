import {chromium} from '@playwright/test';
import {nav} from '../tests/portal-navigation.mjs';
// Separate browser context: never clears or seeds the user's school records.
const browser=await chromium.launch({channel:'msedge',headless:false});
const context=await browser.newContext({viewport:null});
const base='http://127.0.0.1:5186';
const pages=[];
for(const destination of ['Dashboard','Students','Import']){
 const page=await context.newPage();await page.goto(base);
 await page.getByLabel('Username',{exact:true}).fill('admin');
 await page.getByLabel('Password',{exact:true}).fill('123456');
 await page.getByRole('button',{name:'Login',exact:true}).click();
 if(destination!=='Dashboard')await nav(page,'Students');
 if(destination==='Import')await page.getByRole('button',{name:'Import Excel',exact:true}).click();
 await page.evaluate(title=>{document.title=title},`School ERP — ${destination}`);pages.push(page);
}
const evidence=await context.newPage();await evidence.goto(base+'/artifacts/implementation-proof/index.html');
await pages[0].bringToFront();console.log('Opened actual Home, Student Master, Excel Import and evidence gallery in Edge. This separate context contains no real school records.');
await new Promise(resolve=>browser.on('disconnected',resolve));
