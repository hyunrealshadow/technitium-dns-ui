import { Checkbox, Grid, Paper, Stack, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Settings } from '../types';
import { toList, toArray } from '../constants';

export function OptionalProtocolsTab({
  s,
  set,
}: {
  s: Settings;
  set: (patch: Partial<Settings>) => void;
}) {
  const { t } = useTranslation();
  const protocols = [
    {
      key: 'enableDnsOverUdpProxy',
      portKey: 'dnsOverUdpProxyPort',
      label: 'DNS-over-UDP-PROXY',
      helpKey: 'enableDnsOverUdpProxyHelp',
      defaultPort: 538,
    },
    {
      key: 'enableDnsOverTcpProxy',
      portKey: 'dnsOverTcpProxyPort',
      label: 'DNS-over-TCP-PROXY',
      helpKey: 'enableDnsOverTcpProxyHelp',
      defaultPort: 538,
    },
    {
      key: 'enableDnsOverHttp',
      portKey: 'dnsOverHttpPort',
      label: 'DNS-over-HTTP',
      helpKey: 'enableDnsOverHttpHelp',
      defaultPort: 80,
    },
    {
      key: 'enableDnsOverTls',
      portKey: 'dnsOverTlsPort',
      label: 'DNS-over-TLS',
      helpKey: 'enableDnsOverTlsHelp',
      defaultPort: 853,
    },
    {
      key: 'enableDnsOverHttps',
      portKey: 'dnsOverHttpsPort',
      label: 'DNS-over-HTTPS',
      helpKey: 'enableDnsOverHttpsHelp',
      defaultPort: 443,
    },
    {
      key: 'enableDnsOverQuic',
      portKey: 'dnsOverQuicPort',
      label: 'DNS-over-QUIC',
      helpKey: 'enableDnsOverQuicHelp',
      defaultPort: 853,
    },
  ] as const;

  const tlsLikeEnabled = s.enableDnsOverTls || s.enableDnsOverHttps || s.enableDnsOverQuic;

  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        {protocols.map(p => (
          <Grid key={p.key} mt="xs" align="flex-start">
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <Checkbox
                label={t('settings.enableProtocol', { name: p.label })}
                checked={s[p.key]}
                onChange={e => set({ [p.key]: e.currentTarget.checked } as Partial<Settings>)}
                description={t(`settings.${p.helpKey}`)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label={t('settings.port')}
                value={s[p.portKey]}
                onChange={e => set({ [p.portKey]: e.target.value } as Partial<Settings>)}
                disabled={!s[p.key]}
                description={t('settings.portDefault', { port: p.defaultPort })}
              />
            </Grid.Col>
          </Grid>
        ))}
        <Checkbox
          mt="sm"
          label={t('settings.enableDoh3')}
          checked={s.enableDnsOverHttp3}
          onChange={e => set({ enableDnsOverHttp3: e.currentTarget.checked })}
          disabled={!s.enableDnsOverHttps}
          description={t('settings.enableDoh3Help')}
        />
        <Checkbox
          mt="sm"
          label={t('settings.enableDohHelpRedirect')}
          description={t('settings.enableDohHelpRedirectHelp')}
          checked={s.enableDnsOverHttpHelpRedirect}
          onChange={e => set({ enableDnsOverHttpHelpRedirect: e.currentTarget.checked })}
        />
        <div className="form-grid form-grid--2" style={{ marginTop: 'var(--mantine-spacing-md)' }}>
          <Stack gap="xs">
            <Checkbox
              label={t('settings.enableDohHttpUnixSocket')}
              checked={s.enableDnsOverHttpUnixSocket}
              onChange={e => set({ enableDnsOverHttpUnixSocket: e.currentTarget.checked })}
            />
            <TextInput
              label={t('settings.dohHttpUnixSocket')}
              description={t('settings.unixSocketHelp')}
              value={s.dnsOverHttpUnixSocket || ''}
              onChange={e => set({ dnsOverHttpUnixSocket: e.target.value })}
              disabled={!s.enableDnsOverHttpUnixSocket}
            />
          </Stack>
          <Stack gap="xs">
            <Checkbox
              label={t('settings.enableDohHttpsUnixSocket')}
              checked={s.enableDnsOverHttpsUnixSocket}
              onChange={e => set({ enableDnsOverHttpsUnixSocket: e.currentTarget.checked })}
            />
            <TextInput
              label={t('settings.dohHttpsUnixSocket')}
              description={t('settings.unixSocketHelp')}
              value={s.dnsOverHttpsUnixSocket || ''}
              onChange={e => set({ dnsOverHttpsUnixSocket: e.target.value })}
              disabled={!s.enableDnsOverHttpsUnixSocket}
            />
          </Stack>
        </div>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.tlsCertificateHeading')}
        </Text>
        <div className="form-grid form-grid--2">
          <Checkbox
            label={t('settings.enableEcsSourceAddress')}
            description={t('settings.enableEcsSourceAddressHelp')}
            checked={s.enableEDnsClientSubnetSourceAddress}
            onChange={e => set({ enableEDnsClientSubnetSourceAddress: e.currentTarget.checked })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.certificatePath')}
            value={s.dnsTlsCertificatePath || ''}
            onChange={e => set({ dnsTlsCertificatePath: e.target.value })}
            disabled={!tlsLikeEnabled}
            description={t('settings.certificatePathHelp')}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.certificatePassword')}
            type="password"
            value={s.dnsTlsCertificatePassword || ''}
            onChange={e => set({ dnsTlsCertificatePassword: e.target.value })}
            disabled={!tlsLikeEnabled}
            description={t('settings.certificatePasswordHelp')}
          />
        </div>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.optionalProtocolsNote1')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.optionalProtocolsNote2')}
        </Text>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.reverseProxyRealIp')}
        </Text>
        <div className="form-grid form-grid--2">
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.reverseProxyNetworkAcl')}
            description={t('settings.reverseProxyNetworkAclHelp')}
            value={toList(s.dnsReverseProxyNetworkACL)}
            onChange={e => set({ dnsReverseProxyNetworkACL: toArray(e.target.value).split(',') })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.dohRealIpHeader')}
            description={t('settings.dohRealIpHeaderHelp')}
            value={s.dnsOverHttpRealIpHeader}
            onChange={e => set({ dnsOverHttpRealIpHeader: e.target.value })}
          />
        </div>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.optionalProtocolsNote3')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.optionalProtocolsNote4')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.optionalProtocolsNote5')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.optionalProtocolsNote6')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.optionalProtocolsNote7')}
        </Text>
      </Paper>
    </Stack>
  );
}
