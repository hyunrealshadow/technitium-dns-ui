import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

const editorPackages = [
  '@codemirror',
  '@lezer',
  '@marijn/find-cluster-break',
  '@platformos/lang-jsonc',
  '@uiw',
  'codemirror',
  'crelt',
  'style-mod',
  'w3c-keyname',
];

const editorModules = [
  '/src/components/CodeEditor.tsx',
  '/src/pages/Logs/components/logHighlightPlugin.ts',
  '/src/pages/Logs/components/logStackFolding.ts',
  '/src/utils/codeMirror.ts',
];

const chartPackages = [
  '@mantine/charts',
  'react-smooth',
  'recharts',
  'recharts-scale',
  'victory-vendor',
];

function belongsToPackage(id: string, packageName: string): boolean {
  return id.includes(`/node_modules/${packageName}/`);
}

function manualChunks(rawId: string): string | undefined {
  const id = rawId.replaceAll('\\', '/');
  if (editorModules.some(modulePath => id.endsWith(modulePath))) return 'editor';
  if (id.includes('commonjsHelpers.js')) return 'vendor';
  if (!id.includes('/node_modules/')) return undefined;

  if (editorPackages.some(packageName => belongsToPackage(id, packageName))) {
    return 'editor';
  }

  if (chartPackages.some(packageName => belongsToPackage(id, packageName))) {
    return 'vendor-charts';
  }

  return 'vendor';
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
      chunkSizeWarningLimit: 1000,
    },
  };
});
