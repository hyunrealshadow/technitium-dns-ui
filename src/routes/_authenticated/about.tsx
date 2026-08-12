import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Center, Paper, Stack, Text, Title } from '@mantine/core';
import { apiClient } from '../../api/client';
import { formatDateTime } from '../../utils/dateTime';

interface ServerInfo {
  version: string;
  uptimestamp: string;
}

function AboutPage() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<ServerInfo | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await apiClient.get<ServerInfo>('/settings/get');
        if (response.status === 'ok' && response.response) {
          setInfo({
            version: String(response.response.version || ''),
            uptimestamp: String(response.response.uptimestamp || ''),
          });
        }
      } catch {
        /* ignore */
      }
    }
    load();
  }, []);

  return (
    <Center>
      <Paper shadow="sm" p="xl" withBorder style={{ maxWidth: 800, textAlign: 'center' }}>
        <Stack gap="md" align="center">
          <Title order={2}>{t('layout.title')}</Title>
          <Text>{t('about.version', { version: info?.version || '-' })}</Text>
          {info?.uptimestamp && (
            <Text>{t('about.upSince', { date: formatDateTime(info.uptimestamp) })}</Text>
          )}
          <Text size="sm" c="dimmed" style={{ maxWidth: 600 }}>
            {t('about.copyright', { year: new Date().getFullYear() })}
            <br />
            {t('about.warranty')}
          </Text>
          <Text size="sm">
            {t('about.sourceCodePrefix')}{' '}
            <a href="https://go.technitium.com/?id=24" target="_blank" rel="noreferrer">
              GNU General Public License v3.0
            </a>{' '}
            {t('about.sourceCodeOn')}{' '}
            <a
              href="https://github.com/TechnitiumSoftware/DnsServer"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </Text>

          <Stack gap={4} align="center" mt="md">
            <Title order={4}>
              <a href="https://go.technitium.com/?id=23" target="_blank" rel="noreferrer">
                {t('about.whatsNew')}
              </a>
            </Title>
            <Text size="sm">
              {t('about.readChangelogPrefix')}{' '}
              <a href="https://go.technitium.com/?id=23" target="_blank" rel="noreferrer">
                {t('about.readChangelogLink')}
              </a>{' '}
              {t('about.readChangelogSuffix')}
            </Text>

            <Title order={4} mt="md">
              <a
                href="https://github.com/TechnitiumSoftware/DnsServer/blob/master/APIDOCS.md"
                target="_blank"
                rel="noreferrer"
              >
                {t('about.apiDocumentation')}
              </a>
            </Title>
            <Text size="sm">{t('about.apiDocsHint')}</Text>

            <Title order={4} mt="md">
              <a href="https://go.technitium.com/?id=25" target="_blank" rel="noreferrer">
                {t('about.helpTopics')}
              </a>
            </Title>
            <Text size="sm">{t('about.helpHint')}</Text>

            <Title order={4} mt="md">
              {t('about.support')}
            </Title>
            <Text size="sm">
              {t('about.supportEmail')}{' '}
              <a href="mailto:support@technitium.com" target="_blank" rel="noreferrer">
                support@technitium.com
              </a>
              .
              <br />
              {t('about.joinRedditPrefix')}{' '}
              <a href="https://www.reddit.com/r/technitium/" target="_blank" rel="noreferrer">
                /r/technitium
              </a>{' '}
              {t('about.joinRedditSuffix')}
            </Text>

            <Title order={4} mt="md">
              <a href="https://go.technitium.com/?id=35" target="_blank" rel="noreferrer">
                {t('about.donate')}
              </a>
            </Title>
            <Text size="sm">{t('about.contributionHint')}</Text>
          </Stack>
        </Stack>
      </Paper>
    </Center>
  );
}

export const Route = createFileRoute('/_authenticated/about')({
  component: AboutPage,
});
