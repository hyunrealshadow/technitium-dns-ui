import { Stack, Title } from '@mantine/core';
import { useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { LogViewerTab } from './tabs/LogViewerTab';
import { QueryLogsTab } from './tabs/QueryLogsTab';

export function LogsPage({ tab = 'view' }: { tab?: 'view' | 'query' }) {
  const { t } = useTranslation();
  const search = useSearch({ strict: false }) as { domain?: string; clientIp?: string };
  return (
    <Stack>
      <Title order={2}>{t('nav.logs')}</Title>
      {tab === 'query' ? (
        <QueryLogsTab initialQname={search.domain} initialClientIp={search.clientIp} />
      ) : (
        <LogViewerTab />
      )}
    </Stack>
  );
}
