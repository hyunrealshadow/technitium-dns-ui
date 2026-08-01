import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [tanstackRouter(), react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5380',
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
});
