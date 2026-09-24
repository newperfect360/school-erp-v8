// Vite selects this module only for explicitly enabled development servers.
// Production builds resolve to developmentAuth.disabled.js, regardless of flags.
import {portalGroups} from '../design/portalNavigation';
import {navigationItems} from '../design/navigation';
import {demoRequest,startDemo,stopDemo,refreshDemo,demoCommit} from './demoClient';
export const developmentEnabled = import.meta.env.DEV && ['localhost','127.0.0.1','[::1]','10.0.2.2'].includes(location.hostname);
let session = null;
const listeners = new Set();
export const getDevelopmentSession = () => developmentEnabled ? session : null;
export const subscribeDevelopment = callback => { listeners.add(callback); return () => listeners.delete(callback); };
function convert(user){return {...user,role:({SUPER_ADMIN:'Super Admin',ADMIN:'Admin',HEADMASTER:'Headmaster',TEACHER:'Teacher'})[user.role]||user.role,development:true,modules:user.role==='SUPER_ADMIN'&&user.modules.includes('*')?[...new Set(['AccountSecurity','Dashboard',...navigationItems.map(i=>i[0]),...portalGroups.flatMap(g=>g.items.map(i=>i.page))])]:['AccountSecurity','Dashboard',...user.modules],resources:[]};}
let poll;
export async function developmentLogin(username, password, udise='') {
  if (!developmentEnabled) throw Error('Development login is disabled.');
  const result=await demoRequest('login',{username,password,udise});startDemo(result);session=convert(result.user);
  if(result.user.role==='SUPER_ADMIN'&&result.user.schoolId==='gbs-school'){
    const entries={};for(const key of ['schoolSettings','erp_pro_document_templates','erp_pro_message_settings','erp_pro_attendance_automation']){
      if(!(key in result.data)){try{const value=JSON.parse(localStorage.getItem(key));if(value&&typeof value==='object')entries[key]=value;}catch{/* retain invalid local configuration without importing it */}}
    }
    if(Object.keys(entries).length)demoCommit(entries);
  }
  developmentAccept(result);
}
export function developmentAccept(result){
  if(!developmentEnabled)throw Error('Development login is disabled.');
  startDemo(result);session=convert(result.user);
  clearInterval(poll);poll=setInterval(async()=>{try{const user=await refreshDemo();if(user&&JSON.stringify(convert(user))!==JSON.stringify(session)){session=convert(user);listeners.forEach(cb=>cb(session));}}catch(error){if([401,403].includes(error.status))developmentLogout();}},3000);
  listeners.forEach(callback=>callback(session));
}
export function developmentLogout() { void demoRequest('logout').catch(()=>{});clearInterval(poll);stopDemo();session=null; listeners.forEach(callback=>callback(null)); }
