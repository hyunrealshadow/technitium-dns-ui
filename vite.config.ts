import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

const hasPackage = (id: string, packageName: string) =>
  id.includes(`/node_modules/${packageName}/`);

function manualChunks(rawId: string): string | undefined {
  const id = rawId.replaceAll('\\', '/');
  if (!id.includes('/node_modules/')) return undefined;

  if (['react', 'react-dom', 'scheduler'].some(name => hasPackage(id, name))) {
    return 'react-vendor';
  }

  if (['@mantine/charts', 'recharts'].some(name => hasPackage(id, name))) {
    return 'mantine-charts';
  }

  if (hasPackage(id, '@mantine/core') || hasPackage(id, '@mantine/hooks')) {
    return 'mantine-core';
  }

  if (
    [
      '@codemirror',
      '@lezer',
      '@uiw',
      '@platformos/lang-jsonc',
      '@marijn/find-cluster-break',
      'crelt',
      'style-mod',
      'w3c-keyname',
    ].some(name => hasPackage(id, name))
  ) {
    return 'code-editor';
  }

  if (
    ['@tanstack/react-router', '@tanstack/router-core', '@tanstack/history'].some(name =>
      hasPackage(id, name)
    )
  ) {
    return 'router';
  }

  if (['@tanstack/react-query', '@tanstack/query-core'].some(name => hasPackage(id, name))) {
    return 'query';
  }

  if (hasPackage(id, 'jotai')) return 'state';

  if (
    ['i18next', 'i18next-browser-languagedetector', 'react-i18next'].some(name =>
      hasPackage(id, name)
    )
  ) {
    return 'i18n';
  }

  if (hasPackage(id, 'zod')) return 'validation';

  return undefined;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5380';

  return {
    plugins: [tanstackRouter({ autoCodeSplitting: true }), react()],
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
      chunkSizeWarningLimit: 600,
    },
  };
});
