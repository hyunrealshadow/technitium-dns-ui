import { Checkbox, Group, Paper, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Settings } from '../types';
import { toList } from '../constants';

export function WebServiceTab({
  s,
  set,
}: {
  s: Settings;
  set: (patch: Partial<Settings>) => void;
}) {
  const { t } = useTranslation();
  const tlsEnabled = s.webServiceEnableTls;
  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Textarea
          label={t('settings.webServiceLocalAddresses')}
          value={toList(s.webServiceLocalAddresses)}
          onChange={e => set({ webServiceLocalAddresses: e.target.value.split('\n') })}
          minRows={3}
          autosize
          description={t('settings.webServiceLocalAddressesHelp')}
        />
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.httpPort')}
            description={t('settings.httpPortHelp')}
            value={s.webServiceHttpPort}
            onChange={e => set({ webServiceHttpPort: e.target.value })}
          />
        </Group>
        <Group align="flex-start" mt="sm">
          <Checkbox
            label={t('settings.enableTls')}
            checked={s.webServiceEnableTls}
            onChange={e => set({ webServiceEnableTls: e.currentTarget.checked })}
          />
          <Checkbox
            label={t('settings.enableHttp3')}
            checked={s.webServiceEnableHttp3}
            onChange={e => set({ webServiceEnableHttp3: e.currentTarget.checked })}
            disabled={!tlsEnabled}
          />
          <Checkbox
            label={t('settings.httpToTlsRedirect')}
            checked={s.webServiceHttpToTlsRedirect}
            onChange={e => set({ webServiceHttpToTlsRedirect: e.currentTarget.checked })}
            disabled={!tlsEnabled}
          />
          <Checkbox
            label={t('settings.useSelfSignedTlsCertificate')}
            checked={s.webServiceUseSelfSignedTlsCertificate}
            onChange={e => set({ webServiceUseSelfSignedTlsCertificate: e.currentTarget.checked })}
            disabled={!tlsEnabled}
          />
        </Group>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
            marginTop: 'var(--mantine-spacing-sm)',
          }}
        >
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.tlsPort')}
            description={t('settings.tlsPortHelp')}
            value={s.webServiceTlsPort}
            onChange={e => set({ webServiceTlsPort: e.target.value })}
            disabled={!tlsEnabled}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.tlsCertificatePath')}
            value={s.webServiceTlsCertificatePath || ''}
            onChange={e => set({ webServiceTlsCertificatePath: e.target.value })}
            disabled={!tlsEnabled}
            description={t('settings.tlsCertificatePathHelp')}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.tlsCertificatePassword')}
            type="password"
            value={s.webServiceTlsCertificatePassword || ''}
            onChange={e => set({ webServiceTlsCertificatePassword: e.target.value })}
            disabled={!tlsEnabled}
            description={t('settings.tlsCertificatePasswordHelp')}
          />
        </div>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.realIpHeader')}
            description={t('settings.realIpHeaderHelp')}
            value={s.webServiceRealIpHeader}
            onChange={e => set({ webServiceRealIpHeader: e.target.value })}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.webServiceNote1')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.webServiceNote2')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.webServiceNote3')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.webServiceNote4')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.webServiceNote5')}
        </Text>
      </Paper>
    </Stack>
  );
}
