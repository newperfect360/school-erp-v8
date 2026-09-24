import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const sizes=[['desktop',1440,900],['laptop',1366,768],['tablet',768,1024],['mobile',393,851]];
for(const [name,width,height]of sizes)test(`public home ${name}: languages, navigation, login and layout`,async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width,height});await page.goto('/');
 await page.getByRole('button',{name:'मराठी',exact:true}).click();
 await expect(page.locator('h1')).toHaveText('शिक्षण व्यवस्थापनाची नवी डिजिटल दिशा.');
 await expect(page.locator('.pe-features article')).toHaveCount(12);
 await expect(page.locator('.pe-home')).not.toContainText('�');
 mkdirSync('artifacts/public-home',{recursive:true});
 for(const language of ['mr','en']){
  await page.getByRole('button',{name:language==='mr'?'मराठी':'English',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang',language);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:`artifacts/public-home/${name}-${language}.png`,fullPage:true});
 }
 await expect(page.locator('h1')).toHaveText('A new digital direction for school management.');
 await expect(page.getByRole('button',{name:'Download Android App',exact:true})).toBeDisabled();
 for(const link of await page.locator('.pe-home a[href^="#"]').all()){
  const target=await link.getAttribute('href');await expect(page.locator(target)).toHaveCount(1);
 }
 if(width<=1100){
  await page.getByRole('button',{name:'Toggle navigation',exact:true}).click();
  await expect(page.locator('#pe-nav')).toBeVisible();
 }
 await page.locator('#pe-nav').getByRole('link',{name:'Features',exact:true}).click();
 await expect(page).toHaveURL(/#features$/);
 if(width<=1100)await expect(page.locator('#pe-nav')).toBeHidden();
 await page.locator('.pe-login').click();await expect(page).toHaveURL(/\/login$/);
 await expect(page.locator('.pe-home')).toHaveCount(0);
 expect(errors).toEqual([]);
});
