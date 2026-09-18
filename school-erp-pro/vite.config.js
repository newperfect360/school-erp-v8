import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import releaseAssets from './release-assets.js'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const env = {...loadEnv(mode, process.cwd(), ''), ...process.env};
  // Only these public URL values are exposed; never forward arbitrary server env.
  const publicKeys = ['WEB_BASE_URL', 'API_BASE_URL', 'APP_DOWNLOAD_URL', 'PUBLIC_SITE_URL'];
  return {
    plugins: [react(), releaseAssets()],
    define: Object.fromEntries(publicKeys.map(key => [`import.meta.env.VITE_${key}`, JSON.stringify(env[key] || env[`VITE_${key}`] || '')])),
  };
})
