import { useTranslation } from 'react-i18next';
import { createFileRoute } from '@tanstack/react-router';
import { Stack, Title } from '@mantine/core';
import { ZoneBrowser, ZoneBrowserSearchSchema } from '../../components/ZoneBrowser';

function CachePage() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Title order={2}>{t('nav.cachedZones')}</Title>
      <ZoneBrowser apiBase="cache" />
    </Stack>
  );
}

export const Route = createFileRoute('/_authenticated/cache')({
  component: CachePage,
  validateSearch: ZoneBrowserSearchSchema,
});
