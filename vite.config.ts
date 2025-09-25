import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const AI_PROXY_TARGET = process.env.VITE_AI_PROXY_TARGET ?? 'http://localhost:3001';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/ai': {
        target: AI_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
