import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 127.0.0.1 rather than localhost: on Windows localhost resolves to ::1
// first, and the Flask dev server binds IPv4, so the proxy would refuse.
const API = 'http://127.0.0.1:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Proxying keeps the frontend same-origin with the API, so there is no
    // CORS to configure and the /media/<key> URLs the backend composes work
    // verbatim in the browser.
    proxy: {
      '/api': API,
      '/media': API,
    },
  },
})
