/* eslint-disable no-undef */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gasUrl = env.VITE_GAS_URL;

  if (!gasUrl) {
    console.warn('⚠️ VITE_GAS_URL tidak ditemukan di environment. Proxy tidak akan berfungsi.');
  }

  return {
    base: '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: gasUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('proxy error', err);
            });
          },
        },
      },
    },
  };
});