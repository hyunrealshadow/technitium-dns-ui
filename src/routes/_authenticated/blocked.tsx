import { useTranslation } from 'react-i18next';
import { createFileRoute } from '@tanstack/react-router';
import { Stack, Title } from '@mantine/core';
import { ZoneBrowser, ZoneBrowserSearchSchema } from '../../components/ZoneBrowser';

function BlockedPage() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Title order={2}>{t('nav.blockList')}</Title>
      <ZoneBrowser apiBase="blocked" />
    </Stack>
  );
}

export const Route = createFileRoute('/_authenticated/blocked')({
  component: BlockedPage,
  validateSearch: ZoneBrowserSearchSchema,
});
