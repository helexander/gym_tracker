import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is '/gym_tracker/' so the app works on GitHub Pages at
// https://<user>.github.io/gym_tracker/ — override with VITE_BASE for other hosts.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/gym_tracker/',
})
