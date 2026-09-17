import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import releaseAssets from './release-assets.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), releaseAssets()],
})
