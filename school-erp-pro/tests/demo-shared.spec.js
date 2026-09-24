import {test,expect} from '@playwright/test';
import {nav} from './portal-navigation.mjs';
test('actual demo server: user create/edit/disable, teacher login and shared teacher CRUD',async({page,browser,request})=>{
 if(!(process.env.PLAYWRIGHT_BASE_URL||'').includes(':5398'))throw Error('QA server required');
 const loginResponse=await request.post('/__school_demo/platform-login',{data:{username:'admin',password:'admin1234'}}),platform=await loginResponse.json();
 const headers={Authorization:'Bearer '+platform.token};const list=await(await request.post('/__school_demo/platform-schools',{headers,data:{}})).json();const school=list.schools.find(s=>s.id==='gbs-school');if(!school.udise)await request.post('/__school_demo/platform-save-school',{headers,data:{school:{...school,udise:'DEMO999999',schoolNameEn:'TEST QA School'}}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function login(p,user='dilippawar2207@gmail.com',password='admin1234'){
  await p.goto('/login');await p.getByRole('button',{name:'EN',exact:true}).click();if(user!=='dilippawar2207@gmail.com')await p.getByLabel('School UDISE Code',{exact:true}).fill('DEMO999999');await p.getByLabel('Username',{exact:true}).fill(user);await p.getByLabel('Password',{exact:true}).fill(password);await p.getByRole('button',{name:'Login',exact:true}).click();await expect(p.locator('.portal-shell')).toBeVisible();
 }
 await login(page);await nav(page,'AccessSetup');await expect(page.getByRole('heading',{name:'Users & Permissions',exact:true})).toBeVisible();
 const suffix=Date.now(),username='TEST-user-'+suffix;
 await page.getByRole('button',{name:'+ Add User',exact:true}).click();
 for(const [label,value]of Object.entries({'Full Name':'TEST Teacher '+suffix,'Marathi Name':'चाचणी शिक्षक','Assigned Class':'8','Division':'A','Email':username+'@example.invalid','Username':username,'Temporary Password':'TEST-demo-password!42'}))await page.getByLabel(label,{exact:true}).fill(value);
 await page.getByRole('button',{name:'Save User',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Development account saved'})).toBeVisible();
 const staffPage=await browser.newPage();await login(staffPage,username,'TEST-demo-password!42');await expect(staffPage.locator('[data-nav="Settings"]')).toHaveCount(0);await staffPage.close();
 await page.getByLabel('Search users').fill(username);await page.getByRole('button',{name:'Disable',exact:true}).click();await expect(page.locator('tbody')).toContainText('Inactive');
 await page.getByRole('button',{name:'Activate',exact:true}).click();await expect(page.locator('tbody')).toContainText('Active');
 await nav(page,'Teachers');for(const [key,value]of Object.entries({name:'TEST Shared '+suffix,subject:'गणित',mobile:'9000000101'}))await page.locator(`input[name=${key}]`).fill(value);
 await page.getByRole('button',{name:'Save Teacher',exact:true}).click();await page.getByLabel('Search teachers').fill('TEST Shared '+suffix);await expect(page.locator('tbody')).toContainText('गणित');
 const second=await browser.newPage();await login(second);await nav(second,'Teachers');await second.getByLabel('Search teachers').fill('TEST Shared '+suffix);await expect(second.locator('tbody')).toContainText('गणित');
 await second.getByRole('button',{name:'Edit',exact:true}).click();await second.locator('input[name=subject]').fill('विज्ञान');await second.getByRole('button',{name:'Save Teacher',exact:true}).click();await expect(page.locator('tbody')).toContainText('विज्ञान',{timeout:10000});
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete',exact:true}).click();await expect(second.locator('tbody tr')).toHaveCount(0,{timeout:10000});await second.close();
 await nav(page,'AccessSetup');await page.getByLabel('Search users').fill(username);page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Archive',exact:true}).click();await expect(page.locator('tbody')).toContainText('Archived');
 expect(errors).toEqual([]);
});
