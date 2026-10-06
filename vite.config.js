/* eslint-disable no-undef */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Dev: jalankan handler yang sama dengan Vercel (api/index.js) agar API key
// dan token sesi diproses seperti di produksi.
function devApiProxy(env) {
  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      // process.env mengubah undefined jadi string "undefined"; salin yang terisi saja.
      for (const key of ['GAS_URL', 'GAS_API_KEY', 'ALLOWED_ORIGINS']) {
        if (env[key]) process.env[key] = env[key];
      }

      server.middlewares.use('/api', async (req, res) => {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks).toString();
        try {
          req.body = raw ? JSON.parse(raw) : undefined;
        } catch {
          req.body = undefined;
        }

        const shim = {
          setHeader: (k, v) => res.setHeader(k, v),
          status(code) {
            res.statusCode = code;
            return shim;
          },
          json(payload) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(payload));
          },
          end: () => res.end(),
        };

        const { default: handler } = await server.ssrLoadModule('/api/index.js');
        await handler(req, shim);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/',
    plugins: [react(), devApiProxy(env)],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      },
    },
  };
});
