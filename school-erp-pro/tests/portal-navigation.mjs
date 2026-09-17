export async function nav(page,key){
 const opener=page.getByRole('button',{name:'Open navigation',exact:true});
 if(await opener.isVisible() && await opener.getAttribute('aria-expanded')!=='true')await opener.click();
 const home=page.locator(`.portal-nav > [data-nav="${key}"]`);
 if(await home.count()){await home.click();return;}
 const target=page.locator(`.portal-nav .portal-dropdown [data-nav="${key}"]`).first();
 if(!await target.isVisible())await target.locator('xpath=ancestor::div[contains(@class,"portal-nav-group")]').locator('.portal-group-trigger').click();
 await target.click();
}
