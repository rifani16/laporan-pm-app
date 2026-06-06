/* eslint-disable no-undef */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gasUrl = env.VITE_GAS_URL;

  const config = {
    base: '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      },
    },
  };

  // Proxy hanya untuk development
  if (mode === 'development') {
    config.server = {
      proxy: {
        '/api': {
          target: gasUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    };
  }

  return config;
});