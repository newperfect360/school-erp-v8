import {initializeSchoolIdentity} from './services/schoolIdentity';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PerfectEduPlatform from './pages/PerfectEduPlatform'
import {developmentEnabled} from '@development-auth'
import PlatformAdministration from './pages/PlatformAdministration'
import PerfectEduHome from './pages/PerfectEduHome'
import './design/perfectedu.css'
import DownloadApp from './pages/DownloadApp.jsx'
import { LanguageProvider } from './design/language.jsx'
import './design/design-system.css'
import './audit-upgrade.css'
import './design/portal.css'
import './design/education-refresh.css'
import './design/institutional.css'
import './design/school-portal.css'


initializeSchoolIdentity();
document.title='PerfectEdu | School Management';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>{['/platform-admin','/platform-admin/login'].includes(window.location.pathname.replace(/\/$/,''))?<PlatformAdministration/>:window.location.pathname==='/'?<PerfectEduHome/>:window.location.pathname.replace(/\/$/, '') === '/admin' ? (developmentEnabled?<PerfectEduPlatform/>:<PlatformAdministration/>) : window.location.pathname.replace(/\/$/, '') === '/download-app' ? <DownloadApp /> : <App />}</LanguageProvider>
  </StrictMode>,
)
