import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Enable HTTPS with auto-generated self-signed certificate (valid for 100 years)
    // Browser will show a warning - this is expected for self-signed certs
    // Users can replace with their own certificates via backend API
    basicSsl(),
  ],
  publicDir: 'src/public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      // WebSocket 代理 - 必须放在普通 API 代理之前
      '/api/terminal': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            const errorCode = (err as any).code;
            if (errorCode === 'ECONNABORTED' || 
                errorCode === 'ECONNRESET' || 
                errorCode === 'EPIPE' ||
                errorCode === 'ETIMEDOUT') {
              return;
            }
            console.warn('[Vite WS Proxy] Error:', err.message);
          });
          
          proxy.on('proxyReqWs', (_proxyReq, _req, socket, _options, _head) => {
            socket.on('error', (err) => {
              const errorCode = (err as any).code;
              if (errorCode === 'ECONNABORTED' || 
                  errorCode === 'ECONNRESET' || 
                  errorCode === 'EPIPE') {
                return;
              }
            });
          });
        },
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        timeout: 30 * 60 * 1000,
      },
    },
  },
})