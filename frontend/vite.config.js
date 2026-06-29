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
        // The restart window (~300–600ms) causes ECONNREFUSED on any request
        // that arrives while the port isn't yet bound.
        //
        // Vite registers its own 'error' listener *after* opts.configure runs,
        // so our listener fires first. However, we cannot transparently retry
        // the request: HTTP does not allow holding a response mid-stream while
        // we wait for the backend, and any attempt to delay writing to `res`
        // causes Vite's handler to fire immediately and write a 502 (it checks
        // only headersSent, not whether a retry is pending).
        //
        // The fix: our handler writes a clean 503 + JSON body synchronously,
        // setting headersSent = true before Vite's handler runs. Vite then
        // skips its own 502 write (see its `if (!res.headersSent)` guard).
        // The 503 error text surfaces through the existing error_banner in the
        // UI so the user sees a legible message rather than a raw "502".
        //
        // The companion fix in backend/src/index.js moves app.listen into the
        // pg pool.connect() callback so the port is only bound once the DB
        // connection is verified — tightening the restart window to the
        // minimum (just process startup + DB handshake, with no extra slack).
        //
        // This is a dev-only concern: in production the backend is a
        // persistent process and never restarts mid-session.
        configure(proxy) {
          proxy.on('error', (err, _req, res) => {
            if (err.code !== 'ECONNREFUSED') return  // let other errors reach Vite's handler
            if (res.headersSent || res.writableEnded) return
            // Write our response before Vite's error handler fires.
            res.writeHead(503, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Backend restarting — please try again in a moment' }))
          })
        },
      },
    },
  },
})
