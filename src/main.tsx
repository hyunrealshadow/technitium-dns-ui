import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
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
  const [session, setSession] = useAtom(sessionAtom);
  const lastTokenRef = React.useRef<string | null>(null);
  const titleInfoTokenRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const currentToken = session?.token || null;
    if (currentToken !== lastTokenRef.current) {
      lastTokenRef.current = currentToken;
      apiClient.setToken(currentToken);
    }
  }, [session]);

  // 兼容升级前已保存在 localStorage、尚未包含服务器标题信息的会话。
  React.useEffect(() => {
    if (!session?.token) {
      titleInfoTokenRef.current = null;
      return;
    }
    if (
      (session.dnsServerDomain && session.serverVersion) ||
      titleInfoTokenRef.current === session.token
    ) {
      return;
    }

    titleInfoTokenRef.current = session.token;

    let cancelled = false;
    apiClient
      .getSessionInfo(session.token)
      .then(response => {
        if (cancelled || response.status !== 'ok') return;

        setSession(current => {
          if (!current || current.token !== session.token) return current;

          return {
            ...current,
            dnsServerDomain: response.info?.dnsServerDomain,
            serverVersion: response.info?.version,
            permissions: response.info?.permissions ?? current.permissions,
          };
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [session?.dnsServerDomain, session?.serverVersion, session?.token, setSession]);

  React.useEffect(() => {
    document.title =
      session?.dnsServerDomain && session.serverVersion
        ? `${session.dnsServerDomain} - Technitium DNS Server v${session.serverVersion}`
        : 'Technitium DNS Server';
  }, [session?.dnsServerDomain, session?.serverVersion]);

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
        <ModalsProvider>
          <RouterProvider router={router} />
        </ModalsProvider>
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
