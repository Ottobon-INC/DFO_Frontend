import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 4500,
      host: true, // Exposes to local network (0.0.0.0)
      proxy: {
        '/api': {
          target: env.VITE_API_URL || env.VITE_BINDING_URL || 'http://localhost:3005',
          changeOrigin: true,
          secure: false,
        },
        '/thread': {
          target: env.VITE_API_URL || env.VITE_BINDING_URL || 'http://localhost:3005',
          changeOrigin: true,
          secure: false,
        },
        '/janmasethu': {
          target: env.VITE_API_URL || env.VITE_BINDING_URL || 'http://localhost:3005',
          changeOrigin: true,
          secure: false,
        },
        '/events': {
          target: env.VITE_API_URL || env.VITE_BINDING_URL || 'http://localhost:3005',
          changeOrigin: true,
          secure: false,
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
