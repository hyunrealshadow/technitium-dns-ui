import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

function manualChunks(rawId: string): string | undefined {
  const id = rawId.replaceAll('\\', '/');
  return id.includes('/node_modules/') ? 'vendor' : undefined;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5380';

  return {
    plugins: [tanstackRouter(), react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/json': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks,
          onlyExplicitManualChunks: true,
        },
      },
      // A larger vendor chunk is intentional: dependencies share one stable cache boundary.
      chunkSizeWarningLimit: 2000,
    },
  };
});
