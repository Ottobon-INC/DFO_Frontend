import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 4500,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: env.VITE_BINDING_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const keepApiPrefixes = [
              '/api/auth/',
              '/api/appointments',
              '/api/v1/clinics/patients',
              '/api/leads',
              '/api/knowledge',
              '/api/dashboard',
              '/api/control-tower',
              '/api/internal-assistant',
              '/api/clinic/'
            ];
            if (keepApiPrefixes.some(prefix => path.startsWith(prefix))) {
              return path;
            }
            return path.replace(/^\/api/, '');
          },
        }
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
