import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Provider as JotaiProvider, useAtom } from 'jotai';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './i18n';

import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import './index.css';

import { theme } from './theme';
import { colorModeAtom } from './store/theme';
import { sessionAtom } from './store/auth';
import { jotaiStore } from './store/jotai';
import { apiClient } from './api/client';
import { router } from './router.ts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000, // 10 秒内不重新请求
      refetchOnWindowFocus: false,
    },
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

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

export function App() {
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
      <MantineProvider theme={theme}>
        <Notifications position="top-right" />
        <RouterProvider router={router} />
      </MantineProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JotaiProvider store={jotaiStore}>
      <App />
    </JotaiProvider>
  </StrictMode>
);
