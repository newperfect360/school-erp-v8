import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {portalGroups} from '../src/design/portalNavigation.js';
import {nav} from './portal-navigation.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();const errors=[],cloud=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/googleapis.com|firebaseio.com|firebasestorage.app/.test(r.url()))cloud.push(r.url());});
 await page.goto('http://127.0.0.1:5315/');
 await page.getByRole('button',{name:'EN',exact:true}).click();
 await page.getByLabel('Username',{exact:true}).fill('admin');
 await page.getByLabel('Password',{exact:true}).fill('wrong');
 await page.getByRole('button',{name:'Login',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Invalid development'}).waitFor();
 await page.getByLabel('Password',{exact:true}).fill('admin1234');
 await page.getByRole('button',{name:'Login',exact:true}).click();
 await page.locator('.portal-shell').waitFor();
 await page.getByRole('status').filter({hasText:'DEVELOPMENT / TEST MODE'}).waitFor();
 const modules=['Dashboard',...new Set(portalGroups.flatMap(g=>g.items.map(i=>i.page)))];
 for(const key of modules){await nav(page,key);const text=await page.locator('main').innerText();assert.ok(text.length>15,key);assert.doesNotMatch(text,/This page encountered an error|Access not granted to this account/i,key);}
 await page.setViewportSize({width:390,height:844});await nav(page,'Students');await nav(page,'Attendance');
 await page.setViewportSize({width:1280,height:900});
 await page.getByRole('button',{name:'Logout',exact:true}).first().click();
 await page.getByLabel('Username',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(cloud,[]);
 const prod=await browser.newPage();await prod.goto('http://127.0.0.1:4186/');
 assert.equal(await prod.getByLabel('Username',{exact:true}).count(),0);
 await prod.getByLabel('Email',{exact:true}).waitFor();
 assert.equal(await prod.getByText('DEVELOPMENT / TEST MODE',{exact:true}).count(),0);
 for(const file of await readdir(new URL('../dist/assets/',import.meta.url))){if(file.endsWith('.js'))assert.ok(!(await readFile(new URL('../dist/assets/'+file,import.meta.url),'utf8')).includes('admin1234'),'Temporary password excluded from production bundle');}
 console.log(JSON.stringify({developmentLogin:'PASS',invalidPassword:'PASS',dashboard:'PASS',modules:modules.length,moduleNavigation:'PASS',mobileNavigation:'PASS',logout:'PASS',firebaseRequests:cloud.length,productionLoginPreserved:'PASS',productionCredentialExcluded:'PASS'}));
}finally{await browser.close();}
