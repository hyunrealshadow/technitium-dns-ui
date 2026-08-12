import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

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
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'mantine-core': ['@mantine/core', '@mantine/hooks'],
            'mantine-charts': ['@mantine/charts', 'recharts'],
            router: ['@tanstack/react-router'],
            state: ['jotai'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
