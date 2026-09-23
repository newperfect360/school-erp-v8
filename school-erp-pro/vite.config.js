import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import releaseAssets from './release-assets.js'
import {fileURLToPath} from 'node:url'

// https://vite.dev/config/
export default defineConfig(({mode,command}) => {
  const env = {...loadEnv(mode, process.cwd(), ''), ...process.env};
  // Only these public URL values are exposed; never forward arbitrary server env.
  const publicKeys = ['WEB_BASE_URL', 'API_BASE_URL', 'APP_DOWNLOAD_URL', 'PUBLIC_SITE_URL'];
  return {
    resolve: {alias: {'@development-auth': fileURLToPath(new URL(command === 'serve' && ['development','test'].includes(mode) && env.DEV_ADMIN_LOGIN === 'true' ? './src/backend/developmentAuth.js' : './src/backend/developmentAuth.disabled.js', import.meta.url))}},
    plugins: [react(), releaseAssets()],
    define: Object.fromEntries(publicKeys.map(key => [`import.meta.env.VITE_${key}`, JSON.stringify(env[key] || env[`VITE_${key}`] || '')])),
  };
})
