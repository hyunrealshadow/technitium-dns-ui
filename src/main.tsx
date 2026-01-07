import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {MantineProvider} from '@mantine/core';
import {Notifications} from '@mantine/notifications';
import {Provider as JotaiProvider, useAtom} from 'jotai';
import {RouterProvider} from '@tanstack/react-router';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

import './i18n';

import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

import {colorModeAtom} from './store/theme';
import {sessionAtom} from './store/auth';
import {apiClient} from './api/client';
import {router} from './router.ts';

// 创建 query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000, // 10 秒内不重新请求
      refetchOnWindowFocus: false,
    },
  },
});

// 注册路由类型
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// 将自定义颜色模式转换为 Mantine 的颜色方案
function getMantineColorScheme(colorMode: string): 'light' | 'dark' {
  if (colorMode === 'auto') {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }
  return colorMode as 'light' | 'dark';
}

function App() {
  const [colorMode] = useAtom(colorModeAtom);
  const [session] = useAtom(sessionAtom);
  const lastTokenRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const currentToken = session?.token || null;
    if (currentToken !== lastTokenRef.current) {
      lastTokenRef.current = currentToken;
      apiClient.setToken(currentToken);
    }
  }, [session]);

  React.useEffect(() => {
    const newScheme = getMantineColorScheme(colorMode);
    document.documentElement.setAttribute('data-mantine-color-scheme', newScheme);
    document.documentElement.classList.remove('mantine-dark', 'mantine-light');
    document.documentElement.classList.add(`mantine-${newScheme}`);
  }, [colorMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications position="top-right" />
        <RouterProvider router={router} />
      </MantineProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JotaiProvider>
      <App />
    </JotaiProvider>
  </StrictMode>
);
