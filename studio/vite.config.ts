import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: `npm run dev` proxies /api to the FastAPI server on :8000
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8000' } },
  base: './',
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: { output: { entryFileNames: 'assets/app.js', assetFileNames: 'assets/[name][extname]' } },
  },
});
