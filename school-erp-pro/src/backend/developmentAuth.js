// Vite selects this module only for explicitly enabled development servers.
// Production builds resolve to developmentAuth.disabled.js, regardless of flags.
import {portalGroups} from '../design/portalNavigation';
import {navigationItems} from '../design/navigation';
export const developmentEnabled = import.meta.env.DEV && ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
let session = null;
const listeners = new Set();
export const getDevelopmentSession = () => developmentEnabled ? session : null;
export const subscribeDevelopment = callback => { listeners.add(callback); return () => listeners.delete(callback); };
export function developmentLogin(username, password) {
  if (!developmentEnabled || username !== 'admin' || password !== 'admin1234') throw Error('Invalid development username or password.');
  session = {uid:'development-admin',email:'Local development administrator',role:'Super Admin',development:true,
    modules:[...new Set(['AccountSecurity','Dashboard',...navigationItems.map(i=>i[0]),...portalGroups.flatMap(g=>g.items.map(i=>i.page))])],resources:[]};
  listeners.forEach(callback=>callback(session));
}
export function developmentLogout() { session=null; listeners.forEach(callback=>callback(null)); }
