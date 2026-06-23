import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In dev, forward /api/* to the Express backend on port 3001.
      // In production (same-origin deploy), no proxy is needed.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),

        // During dev, `node --watch` restarts the backend on file saves.
        // The restart window (~600–800ms) causes ECONNREFUSED, which
        // http-proxy-3 translates into a 502. The `configure` hook lets us
        // intercept the proxy error event and retry the request once after a
        // short delay, covering the restart window without surfacing a false
        // 502 to the browser.
        //
        // This is a dev-only concern: in production the backend is a
        // persistent process and never restarts mid-session.
        configure(proxy) {
          proxy.on('error', (err, req, res) => {
            if (err.code !== 'ECONNREFUSED') return  // let non-connection errors through

            // Only retry once — if the backend is genuinely down, fail fast.
            if (req.__proxy_retried) return

            req.__proxy_retried = true
            setTimeout(() => {
              proxy.web(req, res, {
                target: 'http://localhost:3001',
                changeOrigin: true,
              })
            }, 800)
          })
        },
      },
    },
  },
})
