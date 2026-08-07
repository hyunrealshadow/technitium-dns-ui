import { useTranslation } from 'react-i18next';
import { createFileRoute } from '@tanstack/react-router';
import { Stack, Title } from '@mantine/core';
import { ZoneBrowser, ZoneBrowserSearchSchema } from '../../components/ZoneBrowser';

function AllowedPage() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Title order={2}>{t('nav.allowList')}</Title>
      <ZoneBrowser apiBase="allowed" />
    </Stack>
  );
}

export const Route = createFileRoute('/_authenticated/allowed')({
  component: AllowedPage,
  validateSearch: ZoneBrowserSearchSchema,
});
