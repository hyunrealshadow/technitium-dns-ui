import { Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { LeasesTab } from './tabs/LeasesTab';
import { ScopesTab } from './tabs/ScopesTab';

export function DhcpPage({ tab = 'leases' }: { tab?: 'leases' | 'scopes' }) {
  const { t } = useTranslation();
  return (
    <Stack>
      <Title order={2}>{t('nav.dhcp')}</Title>
      {tab === 'scopes' ? <ScopesTab /> : <LeasesTab />}
    </Stack>
  );
}
