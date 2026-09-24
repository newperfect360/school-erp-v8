import {schoolFirebase} from './firebaseClient';
export const tenantAuthEnabled=!!import.meta.env.VITE_TENANT_AUTH_URL;
const selectionKey='perfectedu_selected_udise';
export const selectedUdise=()=>sessionStorage.getItem(selectionKey)||'';
export function selectSchool(school){
 if(!/^\d{11}$/.test(school.udise)||!school.id||school.id.includes('/'))throw Error('Invalid school identification.');
 schoolFirebase().schoolId=school.id;
 sessionStorage.setItem(selectionKey,school.udise);
}
export async function tenantRequest(action,udise,identifier,payload={}){
 const endpoint=import.meta.env.VITE_TENANT_AUTH_URL;
 if(!endpoint)throw Error('School authentication service is not configured.');
 const url=new URL(endpoint);
 if(url.protocol!=='https:'&&!(schoolFirebase().emulator&&url.hostname==='127.0.0.1'))throw Error('Secure school authentication endpoint required.');
 const headers={'Content-Type':'application/json'};
 if(['session','school-users','school-save-user'].includes(action)){
  const user=schoolFirebase().auth.currentUser;if(!user)throw Error('Sign in required.');
  headers.Authorization='Bearer '+await user.getIdToken();
 }
 const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({...payload,action,udise,identifier}),signal:AbortSignal.timeout(20000)});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Unable to verify school.');return result;
}
export const identifySchool=async udise=>(await tenantRequest('school',udise.trim())).school;
