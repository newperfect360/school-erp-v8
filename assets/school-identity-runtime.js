// Applies the shared identity to the older web entry point without touching students.
(function(){
 const official=window.SCHOOL_IDENTITY;
 if(!official)return;
 window.resolveLegacySchoolIdentity=function(saved={}){
  if(saved.identityRevision===official.identityRevision)return {...official,...saved};
  return {...official,...saved,identityRevision:official.identityRevision,sansthaName:official.sansthaName,schoolName:official.schoolName,school:official.school,managedBy:'',address:official.address,logo:official.logo};
 };
 for(const key of ['v32_settings','v33_school_settings','v34_school_settings'])try{
  const raw=localStorage.getItem(key);if(!raw)continue;const saved=JSON.parse(raw);
  if(!saved||typeof saved!=='object'||Array.isArray(saved)||saved.identityRevision===official.identityRevision)continue;
  const backup=key+'_before_'+official.identityRevision;if(localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);
  localStorage.setItem(key,JSON.stringify(window.resolveLegacySchoolIdentity(saved)));
 }catch{/* Preserve unreadable saved records. */}
 document.addEventListener('DOMContentLoaded',()=>{
  const title=document.getElementById('schoolTitle'),address=document.getElementById('schoolAddressTitle');
  if(title)title.textContent=official.schoolName;if(address)address.textContent=official.address;
  const logo=document.querySelector('.logoText');if(logo){logo.textContent='';const image=document.createElement('img');image.src=official.logo;image.alt='Official school logo';image.style.cssText='width:100%;height:100%;object-fit:contain';logo.append(image)}
  if(title){const trust=document.createElement('p');trust.className='official-institution';trust.style.whiteSpace='pre-line';trust.textContent=official.sansthaName;title.before(trust)}
 });
})();
