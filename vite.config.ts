import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', 'natural', 'vader-sentiment'],
    include: ['date-fns', 'react-spring']
  },
  define: {
    global: 'globalThis',
  },
  server: {
    fs: {
      strict: false
    }
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});
