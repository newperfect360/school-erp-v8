import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DownloadApp from './pages/DownloadApp.jsx'
import { LanguageProvider } from './design/language.jsx'
import './design/design-system.css'
import './audit-upgrade.css'
import './design/portal.css'
import './design/education-refresh.css'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>{window.location.pathname.replace(/\/$/, '') === '/download-app' ? <DownloadApp /> : <App />}</LanguageProvider>
  </StrictMode>,
)
