import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Button,
  Checkbox,
  FileInput,
  Group,
  Modal,
  NumberInput,
  Paper,
  Radio,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { success, error } from '../components/notifications';
import { apiClient } from '../api/client';

interface Settings {
  dnsServerDomain: string;
  dnsServerLocalEndPoints?: string[];
  dnsServerIPv4SourceAddresses?: string[];
  dnsServerIPv6SourceAddresses?: string[];
  defaultRecordTtl: string;
  defaultNsRecordTtl: string;
  defaultSoaRecordTtl: string;
  defaultResponsiblePerson: string;
  useSoaSerialDateScheme: boolean;
  minSoaRefresh: string;
  minSoaRetry: string;
  zoneTransferAllowedNetworks?: string[];
  notifyAllowedNetworks?: string[];
  dnsAppsEnableAutomaticUpdate: boolean;
  preferIPv6: boolean;
  enableUdpSocketPool: boolean;
  socketPoolExcludedPorts?: string[];
  udpPayloadSize: string;
  dnssecValidation: boolean;
  eDnsClientSubnet: boolean;
  eDnsClientSubnetIPv4PrefixLength: string;
  eDnsClientSubnetIPv6PrefixLength: string;
  eDnsClientSubnetIpv4Override: string;
  eDnsClientSubnetIpv6Override: string;
  qpmPrefixLimitsIPv4?: { prefix: string; udpLimit: number; tcpLimit: number }[];
  qpmPrefixLimitsIPv6?: { prefix: string; udpLimit: number; tcpLimit: number }[];
  qpmLimitSampleMinutes: string;
  qpmLimitUdpTruncationPercentage: string;
  qpmLimitBypassList?: string[];
  clientTimeout: string;
  tcpSendTimeout: string;
  tcpReceiveTimeout: string;
  quicIdleTimeout: string;
  quicMaxInboundStreams: string;
  listenBacklog: string;
  maxConcurrentResolutionsPerCore: string;
  webServiceLocalAddresses?: string[];
  webServiceHttpPort: string;
  webServiceEnableTls: boolean;
  webServiceEnableHttp3: boolean;
  webServiceHttpToTlsRedirect: boolean;
  webServiceUseSelfSignedTlsCertificate: boolean;
  webServiceTlsPort: string;
  webServiceTlsCertificatePath?: string;
  webServiceTlsCertificatePassword?: string;
  webServiceRealIpHeader: string;
  enableDnsOverUdpProxy: boolean;
  enableDnsOverTcpProxy: boolean;
  enableDnsOverHttp: boolean;
  enableDnsOverTls: boolean;
  enableDnsOverHttps: boolean;
  enableDnsOverHttp3: boolean;
  enableDnsOverQuic: boolean;
  dnsOverUdpProxyPort: string;
  dnsOverTcpProxyPort: string;
  dnsOverHttpPort: string;
  dnsOverTlsPort: string;
  dnsOverHttpsPort: string;
  dnsOverQuicPort: string;
  reverseProxyNetworkACL?: string[];
  dnsTlsCertificatePath?: string;
  dnsTlsCertificatePassword?: string;
  dnsOverHttpRealIpHeader: string;
  tsigKeys?: { keyName: string; sharedSecret: string; algorithmName: string }[];
  recursion: string;
  recursionNetworkACL?: string[];
  randomizeName: boolean;
  qnameMinimization: boolean;
  resolverRetries: string;
  resolverTimeout: string;
  resolverConcurrency: string;
  resolverMaxStackCount: string;
  saveCache: boolean;
  serveStale: boolean;
  serveStaleTtl: string;
  serveStaleAnswerTtl: string;
  serveStaleResetTtl: string;
  serveStaleMaxWaitTime: string;
  cacheMaximumEntries: string;
  cacheMinimumRecordTtl: string;
  cacheMaximumRecordTtl: string;
  cacheNegativeRecordTtl: string;
  cacheFailureRecordTtl: string;
  cachePrefetchEligibility: string;
  cachePrefetchTrigger: string;
  cachePrefetchSampleIntervalInMinutes: string;
  cachePrefetchSampleEligibilityHitsPerHour: string;
  enableBlocking: boolean;
  allowTxtBlockingReport: boolean;
  temporaryDisableBlockingTill?: string;
  blockingBypassList?: string[];
  blockingType: string;
  customBlockingAddresses?: string[];
  blockingAnswerTtl: string;
  blockListUrls?: string[];
  blockListUpdateIntervalHours: string;
  blockListNextUpdatedOn?: string;
  proxy?: {
    type: string;
    address?: string;
    port?: string;
    username?: string;
    password?: string;
    bypass?: string[];
  } | null;
  forwarders?: string[];
  forwarderProtocol: string;
  concurrentForwarding: boolean;
  forwarderRetries: string;
  forwarderTimeout: string;
  forwarderConcurrency: string;
  loggingType: string;
  ignoreResolverLogs: boolean;
  logQueries: boolean;
  useLocalTime: boolean;
  logFolder: string;
  maxLogFileDays: string;
  enableInMemoryStats: boolean;
  maxStatFileDays: string;
}

const emptySettings: Settings = {
  dnsServerDomain: '',
  defaultRecordTtl: '300',
  defaultNsRecordTtl: '3600',
  defaultSoaRecordTtl: '3600',
  defaultResponsiblePerson: '',
  useSoaSerialDateScheme: false,
  minSoaRefresh: '300',
  minSoaRetry: '300',
  dnsAppsEnableAutomaticUpdate: true,
  preferIPv6: false,
  enableUdpSocketPool: false,
  udpPayloadSize: '1232',
  dnssecValidation: false,
  eDnsClientSubnet: false,
  eDnsClientSubnetIPv4PrefixLength: '24',
  eDnsClientSubnetIPv6PrefixLength: '56',
  eDnsClientSubnetIpv4Override: '',
  eDnsClientSubnetIpv6Override: '',
  qpmLimitSampleMinutes: '1',
  qpmLimitUdpTruncationPercentage: '25',
  clientTimeout: '3000',
  tcpSendTimeout: '5000',
  tcpReceiveTimeout: '5000',
  quicIdleTimeout: '30000',
  quicMaxInboundStreams: '2000',
  listenBacklog: '512',
  maxConcurrentResolutionsPerCore: '128',
  webServiceHttpPort: '5380',
  webServiceEnableTls: false,
  webServiceEnableHttp3: false,
  webServiceHttpToTlsRedirect: false,
  webServiceUseSelfSignedTlsCertificate: false,
  webServiceTlsPort: '53443',
  webServiceRealIpHeader: 'X-Forwarded-For',
  enableDnsOverUdpProxy: false,
  enableDnsOverTcpProxy: false,
  enableDnsOverHttp: false,
  enableDnsOverTls: false,
  enableDnsOverHttps: false,
  enableDnsOverHttp3: false,
  enableDnsOverQuic: false,
  dnsOverUdpProxyPort: '53',
  dnsOverTcpProxyPort: '53',
  dnsOverHttpPort: '5380',
  dnsOverTlsPort: '853',
  dnsOverHttpsPort: '443',
  dnsOverQuicPort: '853',
  dnsOverHttpRealIpHeader: 'X-Forwarded-For',
  recursion: 'Deny',
  randomizeName: true,
  qnameMinimization: true,
  resolverRetries: '3',
  resolverTimeout: '3000',
  resolverConcurrency: '16',
  resolverMaxStackCount: '50',
  saveCache: false,
  serveStale: false,
  serveStaleTtl: '172800',
  serveStaleAnswerTtl: '30',
  serveStaleResetTtl: '300',
  serveStaleMaxWaitTime: '3000',
  cacheMaximumEntries: '10000',
  cacheMinimumRecordTtl: '10',
  cacheMaximumRecordTtl: '172800',
  cacheNegativeRecordTtl: '300',
  cacheFailureRecordTtl: '60',
  cachePrefetchEligibility: '2',
  cachePrefetchTrigger: '0.5',
  cachePrefetchSampleIntervalInMinutes: '5',
  cachePrefetchSampleEligibilityHitsPerHour: '60',
  enableBlocking: false,
  allowTxtBlockingReport: false,
  blockingType: 'AnyAddress',
  blockingAnswerTtl: '60',
  blockListUpdateIntervalHours: '24',
  forwarderProtocol: 'Udp',
  concurrentForwarding: false,
  forwarderRetries: '2',
  forwarderTimeout: '3000',
  forwarderConcurrency: '16',
  loggingType: 'None',
  ignoreResolverLogs: false,
  logQueries: false,
  useLocalTime: false,
  logFolder: 'logs',
  maxLogFileDays: '30',
  enableInMemoryStats: false,
  maxStatFileDays: '3650',
};

const toList = (v?: string[]): string => (v || []).join('\n');
const toArray = (text: string): string =>
  text
    .split('\n')
    .map(x => x.trim())
    .filter(x => x !== '')
    .join(',');

interface QpmRow {
  prefix: string;
  udpLimit: number;
  tcpLimit: number;
}

function QpmTable({
  rows,
  label,
  description,
  onAdd,
  onUpdate,
  onRemove,
}: {
  rows: QpmRow[];
  label: string;
  description?: string;
  onAdd: () => void;
  onUpdate: (
    index: number,
    field: 'prefix' | 'udpLimit' | 'tcpLimit',
    value: string | number
  ) => void;
  onRemove: (index: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Text fw={500} size="sm" mb="xs">
        {label}
      </Text>
      {description && (
        <Text size="xs" c="dimmed" mb="xs">
          {description}
        </Text>
      )}
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('settings.prefix')}</Table.Th>
            <Table.Th>{t('settings.udpLimit')}</Table.Th>
            <Table.Th>{t('settings.tcpLimit')}</Table.Th>
            <Table.Th style={{ width: 60 }}>
              <Button size="xs" variant="default" onClick={onAdd}>
                {t('common.add')}
              </Button>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, i) => (
            <Table.Tr key={i}>
              <Table.Td>
                <TextInput
                  size="xs"
                  value={row.prefix}
                  onChange={e => onUpdate(i, 'prefix', e.target.value)}
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  size="xs"
                  value={row.udpLimit}
                  onChange={v => onUpdate(i, 'udpLimit', Number(v))}
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  size="xs"
                  value={row.tcpLimit}
                  onChange={v => onUpdate(i, 'tcpLimit', Number(v))}
                />
              </Table.Td>
              <Table.Td>
                <ActionIcon
                  size="sm"
                  color="red"
                  variant="subtle"
                  aria-label={t('common.delete')}
                  onClick={() => onRemove(i)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
}

function GeneralTab({ s, set }: { s: Settings; set: (patch: Partial<Settings>) => void }) {
  const { t } = useTranslation();
  const qpm4 = s.qpmPrefixLimitsIPv4 || [];
  const qpm6 = s.qpmPrefixLimitsIPv6 || [];

  const addRow = (which: 'v4' | 'v6') => {
    const row: QpmRow = { prefix: '', udpLimit: 0, tcpLimit: 0 };
    if (which === 'v4') set({ qpmPrefixLimitsIPv4: [...qpm4, row] });
    else set({ qpmPrefixLimitsIPv6: [...qpm6, row] });
  };

  const updateRow = (
    which: 'v4' | 'v6',
    index: number,
    field: 'prefix' | 'udpLimit' | 'tcpLimit',
    value: string | number
  ) => {
    if (which === 'v4') {
      set({
        qpmPrefixLimitsIPv4: qpm4.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
      });
    } else {
      set({
        qpmPrefixLimitsIPv6: qpm6.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
      });
    }
  };

  const removeRow = (which: 'v4' | 'v6', index: number) => {
    if (which === 'v4') set({ qpmPrefixLimitsIPv4: qpm4.filter((_, i) => i !== index) });
    else set({ qpmPrefixLimitsIPv6: qpm6.filter((_, i) => i !== index) });
  };

  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.server')}
        </Text>
        <TextInput
          label={t('settings.dnsServerDomain')}
          value={s.dnsServerDomain}
          onChange={e => set({ dnsServerDomain: e.target.value })}
          description={t('settings.dnsServerDomainHelp')}
        />
        <Textarea
          mt="sm"
          label={t('settings.dnsServerLocalEndPoints')}
          placeholder={'0.0.0.0:53\n[::]:53'}
          value={toList(s.dnsServerLocalEndPoints)}
          onChange={e => set({ dnsServerLocalEndPoints: e.target.value.split('\n') })}
          minRows={3}
          autosize
          description={t('settings.dnsServerLocalEndPointsHelp')}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
            marginTop: 'var(--mantine-spacing-sm)',
          }}
        >
          <Textarea
            label={t('settings.ipv4SourceAddresses')}
            value={toList(s.dnsServerIPv4SourceAddresses)}
            onChange={e => set({ dnsServerIPv4SourceAddresses: e.target.value.split('\n') })}
            rows={3}
            description={t('settings.ipv4SourceAddressesHelp')}
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
          />
          <Textarea
            label={t('settings.ipv6SourceAddresses')}
            value={toList(s.dnsServerIPv6SourceAddresses)}
            onChange={e => set({ dnsServerIPv6SourceAddresses: e.target.value.split('\n') })}
            rows={3}
            description={t('settings.ipv6SourceAddressesHelp')}
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
          />
        </div>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.localEndPointsNote1')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.localEndPointsNote2')}
        </Text>
      </Paper>

      {/* Default Parameters */}
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.defaults')}
        </Text>
        <Group align="flex-start" grow>
          <TextInput
            label={t('settings.defaultRecordTtl')}
            description={t('settings.defaultRecordTtlHelp')}
            value={s.defaultRecordTtl}
            onChange={e => set({ defaultRecordTtl: e.target.value })}
          />
          <TextInput
            label={t('settings.defaultNsRecordTtl')}
            description={t('settings.defaultNsRecordTtlHelp')}
            value={s.defaultNsRecordTtl}
            onChange={e => set({ defaultNsRecordTtl: e.target.value })}
          />
          <TextInput
            label={t('settings.defaultSoaRecordTtl')}
            description={t('settings.defaultSoaRecordTtlHelp')}
            value={s.defaultSoaRecordTtl}
            onChange={e => set({ defaultSoaRecordTtl: e.target.value })}
          />
        </Group>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.defaultResponsiblePerson')}
            description={t('settings.defaultResponsiblePersonHelp')}
            value={s.defaultResponsiblePerson}
            onChange={e => set({ defaultResponsiblePerson: e.target.value })}
          />
          <Checkbox
            label={t('settings.useSoaSerialDateScheme')}
            description={t('settings.useSoaSerialDateSchemeHelp')}
            checked={s.useSoaSerialDateScheme}
            onChange={e => set({ useSoaSerialDateScheme: e.currentTarget.checked })}
            mt={30}
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
            label={t('settings.minSoaRefresh')}
            description={t('settings.minSoaRefreshHelp')}
            value={s.minSoaRefresh}
            onChange={e => set({ minSoaRefresh: e.target.value })}
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
          />
          <TextInput
            label={t('settings.minSoaRetry')}
            description={t('settings.minSoaRetryHelp')}
            value={s.minSoaRetry}
            onChange={e => set({ minSoaRetry: e.target.value })}
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
          />
          <TextInput
            label={t('settings.zoneTransferAllowedNetworks')}
            description={t('settings.zoneTransferAllowedNetworksHelp')}
            value={toList(s.zoneTransferAllowedNetworks)}
            onChange={e => set({ zoneTransferAllowedNetworks: toArray(e.target.value).split(',') })}
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
          />
        </div>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.notifyAllowedNetworks')}
            description={t('settings.notifyAllowedNetworksHelp')}
            value={toList(s.notifyAllowedNetworks)}
            onChange={e => set({ notifyAllowedNetworks: toArray(e.target.value).split(',') })}
          />
        </Group>
      </Paper>

      {/* DNS Apps */}
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.dnsApps')}
        </Text>
        <Checkbox
          label={t('settings.appsAutoUpdate')}
          description={t('settings.appsAutoUpdateHelp')}
          checked={s.dnsAppsEnableAutomaticUpdate}
          onChange={e => set({ dnsAppsEnableAutomaticUpdate: e.currentTarget.checked })}
        />
      </Paper>

      {/* IPv6 */}
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.ipv6')}
        </Text>
        <Checkbox
          label={t('settings.preferIpv6')}
          description={t('settings.preferIpv6Help')}
          checked={s.preferIPv6}
          onChange={e => set({ preferIPv6: e.currentTarget.checked })}
        />
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.ipv6Warning')}
        </Text>
      </Paper>

      {/* UDP Socket Pool */}
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.udpSocketPool')}
        </Text>
        <Group align="flex-start" grow>
          <Checkbox
            label={t('settings.udpSocketPool')}
            description={t('settings.udpSocketPoolHelp')}
            checked={s.enableUdpSocketPool}
            onChange={e => set({ enableUdpSocketPool: e.currentTarget.checked })}
          />
          <TextInput
            label={t('settings.udpSocketPoolExcludedPorts')}
            description={t('settings.udpSocketPoolExcludedPortsHelp')}
            value={toList(s.socketPoolExcludedPorts)}
            onChange={e => set({ socketPoolExcludedPorts: toArray(e.target.value).split(',') })}
            disabled={!s.enableUdpSocketPool}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.udpSocketPoolNote')}
        </Text>
      </Paper>

      {/* EDNS */}
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.edns')}
        </Text>
        <TextInput
          label={t('settings.ednsUdpPayloadSize')}
          description={t('settings.ednsUdpPayloadSizeHelp')}
          value={s.udpPayloadSize}
          onChange={e => set({ udpPayloadSize: e.target.value })}
          style={{ maxWidth: 320 }}
        />
      </Paper>

      {/* DNSSEC */}
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.dnssec')}
        </Text>
        <Checkbox
          label={t('settings.dnssecValidation')}
          description={t('settings.dnssecValidationHelp')}
          checked={s.dnssecValidation}
          onChange={e => set({ dnssecValidation: e.currentTarget.checked })}
        />
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.dnssecWarning1')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.dnssecWarning2')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.dnssecNote')}
        </Text>
      </Paper>

      {/* EDNS Client Subnet */}
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.ednsClientSubnet')}
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
          }}
        >
          <Checkbox
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.ednsClientSubnet')}
            description={t('settings.ednsClientSubnetHelp')}
            checked={s.eDnsClientSubnet}
            onChange={e => set({ eDnsClientSubnet: e.currentTarget.checked })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.ecsIpv4PrefixLength')}
            description={t('settings.ecsIpv4PrefixLengthHelp')}
            value={s.eDnsClientSubnetIPv4PrefixLength}
            onChange={e => set({ eDnsClientSubnetIPv4PrefixLength: e.target.value })}
            disabled={!s.eDnsClientSubnet}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.ecsIpv6PrefixLength')}
            description={t('settings.ecsIpv6PrefixLengthHelp')}
            value={s.eDnsClientSubnetIPv6PrefixLength}
            onChange={e => set({ eDnsClientSubnetIPv6PrefixLength: e.target.value })}
            disabled={!s.eDnsClientSubnet}
          />
        </div>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.ecsIpv4Override')}
            description={t('settings.ecsIpv4OverrideHelp')}
            value={s.eDnsClientSubnetIpv4Override}
            onChange={e => set({ eDnsClientSubnetIpv4Override: e.target.value })}
            disabled={!s.eDnsClientSubnet}
          />
          <TextInput
            label={t('settings.ecsIpv6Override')}
            description={t('settings.ecsIpv6OverrideHelp')}
            value={s.eDnsClientSubnetIpv6Override}
            onChange={e => set({ eDnsClientSubnetIpv6Override: e.target.value })}
            disabled={!s.eDnsClientSubnet}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.ecsWarning')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.ecsNote1')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.ecsNote2')}
        </Text>
      </Paper>

      {/* Rate Limiting */}
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.rateLimiting')}
        </Text>
        <QpmTable
          rows={qpm4}
          label={t('settings.ipv4PrefixLimits')}
          description={t('settings.qpmIpv4LimitsHelp')}
          onAdd={() => addRow('v4')}
          onUpdate={(i, f, v) => updateRow('v4', i, f, v)}
          onRemove={i => removeRow('v4', i)}
        />
        <QpmTable
          rows={qpm6}
          label={t('settings.ipv6PrefixLimits')}
          description={t('settings.qpmIpv6LimitsHelp')}
          onAdd={() => addRow('v6')}
          onUpdate={(i, f, v) => updateRow('v6', i, f, v)}
          onRemove={i => removeRow('v6', i)}
        />
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.qpmNote1')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.qpmNote2')}
        </Text>
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
            label={t('settings.qpmLimitSampleMinutes')}
            description={t('settings.qpmLimitSampleMinutesHelp')}
            value={s.qpmLimitSampleMinutes}
            onChange={e => set({ qpmLimitSampleMinutes: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.qpmLimitUdpTruncationPercentage')}
            description={t('settings.qpmLimitUdpTruncationPercentageHelp')}
            value={s.qpmLimitUdpTruncationPercentage}
            onChange={e => set({ qpmLimitUdpTruncationPercentage: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.qpmLimitBypassList')}
            description={t('settings.qpmLimitBypassListHelp')}
            value={toList(s.qpmLimitBypassList)}
            onChange={e => set({ qpmLimitBypassList: toArray(e.target.value).split(',') })}
          />
        </div>
      </Paper>

      {/* Advanced Options */}
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.advancedOptions')}
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
          }}
        >
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.clientTimeout')}
            description={t('settings.clientTimeoutHelp')}
            value={s.clientTimeout}
            onChange={e => set({ clientTimeout: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.tcpSendTimeout')}
            description={t('settings.tcpSendTimeoutHelp')}
            value={s.tcpSendTimeout}
            onChange={e => set({ tcpSendTimeout: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.tcpReceiveTimeout')}
            description={t('settings.tcpReceiveTimeoutHelp')}
            value={s.tcpReceiveTimeout}
            onChange={e => set({ tcpReceiveTimeout: e.target.value })}
          />
        </div>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.quicIdleTimeout')}
            description={t('settings.quicIdleTimeoutHelp')}
            value={s.quicIdleTimeout}
            onChange={e => set({ quicIdleTimeout: e.target.value })}
          />
          <TextInput
            label={t('settings.quicMaxInboundStreams')}
            description={t('settings.quicMaxInboundStreamsHelp')}
            value={s.quicMaxInboundStreams}
            onChange={e => set({ quicMaxInboundStreams: e.target.value })}
          />
          <TextInput
            label={t('settings.listenBacklog')}
            description={t('settings.listenBacklogHelp')}
            value={s.listenBacklog}
            onChange={e => set({ listenBacklog: e.target.value })}
          />
        </Group>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.maxConcurrentResolutions')}
            value={s.maxConcurrentResolutionsPerCore}
            onChange={e => set({ maxConcurrentResolutionsPerCore: e.target.value })}
            description={t('settings.maxConcurrentResolutionsPerCoreHelp')}
          />
        </Group>
      </Paper>
    </Stack>
  );
}

function WebServiceTab({ s, set }: { s: Settings; set: (patch: Partial<Settings>) => void }) {
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

function OptionalProtocolsTab({
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
      portHelpKey: 'dnsOverUdpProxyPortHelp',
    },
    {
      key: 'enableDnsOverTcpProxy',
      portKey: 'dnsOverTcpProxyPort',
      label: 'DNS-over-TCP-PROXY',
      helpKey: 'enableDnsOverTcpProxyHelp',
      portHelpKey: 'dnsOverTcpProxyPortHelp',
    },
    {
      key: 'enableDnsOverHttp',
      portKey: 'dnsOverHttpPort',
      label: 'DNS-over-HTTP',
      helpKey: 'enableDnsOverHttpHelp',
      portHelpKey: 'dnsOverHttpPortHelp',
    },
    {
      key: 'enableDnsOverTls',
      portKey: 'dnsOverTlsPort',
      label: 'DNS-over-TLS',
      helpKey: 'enableDnsOverTlsHelp',
      portHelpKey: 'dnsOverTlsPortHelp',
    },
    {
      key: 'enableDnsOverHttps',
      portKey: 'dnsOverHttpsPort',
      label: 'DNS-over-HTTPS',
      helpKey: 'enableDnsOverHttpsHelp',
      portHelpKey: 'dnsOverHttpsPortHelp',
    },
    {
      key: 'enableDnsOverQuic',
      portKey: 'dnsOverQuicPort',
      label: 'DNS-over-QUIC',
      helpKey: 'enableDnsOverQuicHelp',
      portHelpKey: 'dnsOverQuicPortHelp',
    },
  ] as const;

  const tlsLikeEnabled = s.enableDnsOverTls || s.enableDnsOverHttps || s.enableDnsOverQuic;

  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        {protocols.map(p => (
          <Group align="flex-start" key={p.key} mt="xs">
            <Checkbox
              label={t('settings.enableProtocol', { name: p.label })}
              checked={s[p.key]}
              onChange={e => set({ [p.key]: e.currentTarget.checked } as Partial<Settings>)}
              style={{ width: 260 }}
              description={t(`settings.${p.helpKey}`)}
            />
            <TextInput
              label={t('settings.port')}
              value={s[p.portKey]}
              onChange={e => set({ [p.portKey]: e.target.value } as Partial<Settings>)}
              w={120}
              disabled={!s[p.key]}
              description={t(`settings.${p.portHelpKey}`)}
            />
          </Group>
        ))}
        <Checkbox
          mt="sm"
          label={t('settings.enableDoh3')}
          checked={s.enableDnsOverHttp3}
          onChange={e => set({ enableDnsOverHttp3: e.currentTarget.checked })}
          disabled={!s.enableDnsOverHttps}
          description={t('settings.enableDoh3Help')}
        />
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.tlsCertificateHeading')}
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
          }}
        >
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
          }}
        >
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.reverseProxyNetworkAcl')}
            description={t('settings.reverseProxyNetworkAclHelp')}
            value={toList(s.reverseProxyNetworkACL)}
            onChange={e => set({ reverseProxyNetworkACL: toArray(e.target.value).split(',') })}
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

function TsigTab({ s, set }: { s: Settings; set: (patch: Partial<Settings>) => void }) {
  const { t } = useTranslation();
  const keys = s.tsigKeys || [];
  const updateKey = (
    index: number,
    field: 'keyName' | 'sharedSecret' | 'algorithmName',
    value: string
  ) => {
    const newKeys = keys.map((k, i) => (i === index ? { ...k, [field]: value } : k));
    set({ tsigKeys: newKeys });
  };
  const removeKey = (index: number) => {
    set({ tsigKeys: keys.filter((_, i) => i !== index) });
  };

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Group align="flex-start" justify="space-between" mb="sm">
        <Text fw={600}>{t('settings.tsigKeys')}</Text>
        <Button
          size="xs"
          variant="default"
          onClick={() =>
            set({
              tsigKeys: [...keys, { keyName: '', sharedSecret: '', algorithmName: 'HMAC-SHA256' }],
            })
          }
        >
          {t('common.add')}
        </Button>
      </Group>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('settings.keyName')}</Table.Th>
            <Table.Th>{t('settings.sharedSecret')}</Table.Th>
            <Table.Th>{t('settings.algorithm')}</Table.Th>
            <Table.Th style={{ width: 60 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {keys.map((key, i) => (
            <Table.Tr key={i}>
              <Table.Td>
                <TextInput
                  size="xs"
                  value={key.keyName}
                  onChange={e => updateKey(i, 'keyName', e.target.value)}
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  size="xs"
                  value={key.sharedSecret}
                  onChange={e => updateKey(i, 'sharedSecret', e.target.value)}
                />
              </Table.Td>
              <Table.Td>
                <Select
                  size="xs"
                  data={[
                    'HMAC-MD5',
                    'HMAC-SHA1',
                    'HMAC-SHA224',
                    'HMAC-SHA256',
                    'HMAC-SHA384',
                    'HMAC-SHA512',
                  ]}
                  value={key.algorithmName}
                  onChange={v => updateKey(i, 'algorithmName', v || 'HMAC-SHA256')}
                  allowDeselect={false}
                />
              </Table.Td>
              <Table.Td>
                <ActionIcon
                  size="sm"
                  color="red"
                  variant="subtle"
                  aria-label={t('common.delete')}
                  onClick={() => removeKey(i)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {keys.length === 0 && (
        <Text c="dimmed" size="sm">
          {t('settings.noTsigKeys')}
        </Text>
      )}
      <Text size="xs" c="dimmed" mt="sm">
        {t('settings.tsigKeysHelp')}
      </Text>
      <Text size="xs" c="dimmed">
        {t('settings.tsigNote')}
      </Text>
    </Paper>
  );
}

function RecursionTab({ s, set }: { s: Settings; set: (patch: Partial<Settings>) => void }) {
  const { t } = useTranslation();
  const showAcl = s.recursion === 'UseSpecifiedNetworkACL';
  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            {t('settings.recursion')}
          </Text>
          <Radio
            checked={s.recursion === 'Allow'}
            onChange={() => set({ recursion: 'Allow' })}
            label={t('settings.allow')}
            description={t('settings.recursionAllowHelp')}
          />
          <Radio
            checked={s.recursion === 'AllowOnlyForPrivateNetworks'}
            onChange={() => set({ recursion: 'AllowOnlyForPrivateNetworks' })}
            label={t('settings.allowOnlyForPrivateNetworks')}
            description={t('settings.recursionPrivateHelp')}
          />
          <Radio
            checked={s.recursion === 'UseSpecifiedNetworkACL'}
            onChange={() => set({ recursion: 'UseSpecifiedNetworkACL' })}
            label={t('settings.useSpecifiedNetworkACL')}
            description={t('settings.recursionAclHelp')}
          />
          <Radio
            checked={s.recursion === 'Deny'}
            onChange={() => set({ recursion: 'Deny' })}
            label={t('settings.denyDefault')}
            description={t('settings.recursionDenyHelp')}
          />
        </Stack>
        <Textarea
          mt="sm"
          label={t('settings.recursionNetworkAcl')}
          description={t('settings.recursionNetworkAclHelp')}
          value={toList(s.recursionNetworkACL)}
          onChange={e => set({ recursionNetworkACL: e.target.value.split('\n') })}
          minRows={4}
          disabled={!showAcl}
        />
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.recursionNote')}
        </Text>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.recursiveResolver')}
        </Text>
        <Group align="flex-start">
          <Checkbox
            label={t('settings.randomizeName')}
            description={t('settings.randomizeNameHelp')}
            checked={s.randomizeName}
            onChange={e => set({ randomizeName: e.currentTarget.checked })}
          />
          <Checkbox
            label={t('settings.qnameMinimization')}
            description={t('settings.qnameMinimizationHelp')}
            checked={s.qnameMinimization}
            onChange={e => set({ qnameMinimization: e.currentTarget.checked })}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.randomizeNameWarning')}
        </Text>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.resolver')}
        </Text>
        <Group align="flex-start" grow>
          <TextInput
            label={t('settings.resolverRetries')}
            description={t('settings.resolverRetriesHelp')}
            value={s.resolverRetries}
            onChange={e => set({ resolverRetries: e.target.value })}
          />
          <TextInput
            label={t('settings.resolverTimeout')}
            description={t('settings.resolverTimeoutHelp')}
            value={s.resolverTimeout}
            onChange={e => set({ resolverTimeout: e.target.value })}
          />
          <TextInput
            label={t('settings.resolverConcurrency')}
            description={t('settings.resolverConcurrencyHelp')}
            value={s.resolverConcurrency}
            onChange={e => set({ resolverConcurrency: e.target.value })}
          />
        </Group>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.resolverMaxStackCount')}
            description={t('settings.resolverMaxStackCountHelp')}
            value={s.resolverMaxStackCount}
            onChange={e => set({ resolverMaxStackCount: e.target.value })}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.resolverNote1')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.resolverNote2')}
        </Text>
      </Paper>
    </Stack>
  );
}

function CacheTab({
  s,
  set,
  onFlushCache,
}: {
  s: Settings;
  set: (patch: Partial<Settings>) => void;
  onFlushCache: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.dnsCache')}
        </Text>
        <Group align="flex-start">
          <Checkbox
            label={t('settings.saveCache')}
            description={t('settings.saveCacheHelp')}
            checked={s.saveCache}
            onChange={e => set({ saveCache: e.currentTarget.checked })}
          />
          <Button size="xs" color="red" onClick={onFlushCache}>
            {t('settings.flushCache')}
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.saveCacheNote')}
        </Text>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.serveStale')}
        </Text>
        <Checkbox
          label={t('settings.serveStale')}
          description={t('settings.serveStaleHelp')}
          checked={s.serveStale}
          onChange={e => set({ serveStale: e.currentTarget.checked })}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
            marginTop: 'var(--mantine-spacing-sm)',
          }}
        >
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.serveStaleTtl')}
            description={t('settings.serveStaleTtlHelp')}
            value={s.serveStaleTtl}
            onChange={e => set({ serveStaleTtl: e.target.value })}
            disabled={!s.serveStale}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.serveStaleAnswerTtl')}
            description={t('settings.serveStaleAnswerTtlHelp')}
            value={s.serveStaleAnswerTtl}
            onChange={e => set({ serveStaleAnswerTtl: e.target.value })}
            disabled={!s.serveStale}
          />
        </div>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.serveStaleResetTtl')}
            description={t('settings.serveStaleResetTtlHelp')}
            value={s.serveStaleResetTtl}
            onChange={e => set({ serveStaleResetTtl: e.target.value })}
            disabled={!s.serveStale}
          />
          <TextInput
            label={t('settings.serveStaleMaxWaitTime')}
            description={t('settings.serveStaleMaxWaitTimeHelp')}
            value={s.serveStaleMaxWaitTime}
            onChange={e => set({ serveStaleMaxWaitTime: e.target.value })}
            disabled={!s.serveStale}
          />
        </Group>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.cache')}
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
          }}
        >
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.cacheMaximumEntries')}
            description={t('settings.cacheMaximumEntriesHelp')}
            value={s.cacheMaximumEntries}
            onChange={e => set({ cacheMaximumEntries: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.minimumRecordTtl')}
            description={t('settings.minimumRecordTtlHelp')}
            value={s.cacheMinimumRecordTtl}
            onChange={e => set({ cacheMinimumRecordTtl: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.maximumRecordTtl')}
            description={t('settings.maximumRecordTtlHelp')}
            value={s.cacheMaximumRecordTtl}
            onChange={e => set({ cacheMaximumRecordTtl: e.target.value })}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
            marginTop: 'var(--mantine-spacing-sm)',
          }}
        >
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.negativeRecordTtl')}
            description={t('settings.negativeRecordTtlHelp')}
            value={s.cacheNegativeRecordTtl}
            onChange={e => set({ cacheNegativeRecordTtl: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.failureRecordTtl')}
            description={t('settings.failureRecordTtlHelp')}
            value={s.cacheFailureRecordTtl}
            onChange={e => set({ cacheFailureRecordTtl: e.target.value })}
          />
        </div>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.prefetch')}
        </Text>
        <Group align="flex-start" grow>
          <TextInput
            label={t('settings.prefetchEligibility')}
            description={t('settings.prefetchEligibilityHelp')}
            value={s.cachePrefetchEligibility}
            onChange={e => set({ cachePrefetchEligibility: e.target.value })}
          />
          <TextInput
            label={t('settings.prefetchTrigger')}
            description={t('settings.prefetchTriggerHelp')}
            value={s.cachePrefetchTrigger}
            onChange={e => set({ cachePrefetchTrigger: e.target.value })}
          />
          <TextInput
            label={t('settings.sampleInterval')}
            description={t('settings.sampleIntervalHelp')}
            value={s.cachePrefetchSampleIntervalInMinutes}
            onChange={e => set({ cachePrefetchSampleIntervalInMinutes: e.target.value })}
          />
        </Group>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.sampleEligibility')}
            description={t('settings.sampleEligibilityHelp')}
            value={s.cachePrefetchSampleEligibilityHitsPerHour}
            onChange={e => set({ cachePrefetchSampleEligibilityHitsPerHour: e.target.value })}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.prefetchNote')}
        </Text>
      </Paper>
    </Stack>
  );
}

interface QuickBlockList {
  name: string;
  urls: string[];
}

interface QuickForwarderList {
  name: string;
  protocol: string;
  addresses: string[];
  proxyType?: string;
  proxyAddress?: string;
  proxyPort?: string;
  proxyUsername?: string;
  proxyPassword?: string;
  bypass?: string[];
}

function BlockingTab({
  s,
  set,
  onUpdateBlockLists,
  onTemporaryDisable,
}: {
  s: Settings;
  set: (patch: Partial<Settings>) => void;
  onUpdateBlockLists: () => void;
  onTemporaryDisable: (minutes: number) => void;
}) {
  const { t } = useTranslation();
  const enabled = s.enableBlocking;
  const [quickBlockLists, setQuickBlockLists] = useState<QuickBlockList[]>([]);
  const [temporaryMinutes, setTemporaryMinutes] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/json/quick-block-lists-builtin.json')
      .then(r => r.json())
      .then((list: QuickBlockList[]) => {
        if (!cancelled) setQuickBlockLists(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const applyQuickBlockList = (name: string | null) => {
    if (!name) return;
    if (name === 'none') {
      set({ blockListUrls: [] });
      return;
    }
    const item = quickBlockLists.find(x => x.name === name);
    if (!item) return;
    const existing = toList(s.blockListUrls)
      .split('\n')
      .filter(x => x.trim() !== '');
    const merged = [...existing];
    for (const url of item.urls) {
      if (!merged.includes(url)) merged.push(url);
    }
    set({ blockListUrls: merged });
  };

  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Group align="flex-start">
          <Checkbox
            label={t('settings.enableBlocking')}
            description={t('settings.enableBlockingHelp')}
            checked={s.enableBlocking}
            onChange={e => set({ enableBlocking: e.currentTarget.checked })}
          />
          <Checkbox
            label={t('settings.allowTxtBlockingReport')}
            description={t('settings.allowTxtBlockingReportHelp')}
            checked={s.allowTxtBlockingReport}
            onChange={e => set({ allowTxtBlockingReport: e.currentTarget.checked })}
            disabled={!enabled}
          />
        </Group>
        <Stack gap="xs" mt="sm">
          <Text size="sm" fw={500}>
            {t('settings.blockingType')}
          </Text>
          <Radio
            disabled={!enabled}
            checked={s.blockingType === 'AnyAddress'}
            onChange={() => set({ blockingType: 'AnyAddress' })}
            label={t('settings.anyAddress')}
            description={t('settings.blockingTypeAnyHelp')}
          />
          <Radio
            disabled={!enabled}
            checked={s.blockingType === 'NxDomain'}
            onChange={() => set({ blockingType: 'NxDomain' })}
            label={t('settings.nxdomain')}
            description={t('settings.blockingTypeNxHelp')}
          />
          <Radio
            disabled={!enabled}
            checked={s.blockingType === 'CustomAddress'}
            onChange={() => set({ blockingType: 'CustomAddress' })}
            label={t('settings.customAddress')}
            description={t('settings.blockingTypeCustomHelp')}
          />
        </Stack>
        <Textarea
          mt="sm"
          label={t('settings.customBlockingAddresses')}
          value={toList(s.customBlockingAddresses)}
          onChange={e => set({ customBlockingAddresses: e.target.value.split('\n') })}
          minRows={3}
          disabled={!enabled || s.blockingType !== 'CustomAddress'}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
            marginTop: 'var(--mantine-spacing-sm)',
          }}
        >
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.blockingAnswerTtl')}
            description={t('settings.blockingAnswerTtlHelp')}
            value={s.blockingAnswerTtl}
            onChange={e => set({ blockingAnswerTtl: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.blockingBypassList')}
            description={t('settings.blockingBypassListHelp')}
            value={toList(s.blockingBypassList)}
            onChange={e => set({ blockingBypassList: toArray(e.target.value).split(',') })}
            disabled={!enabled}
          />
        </div>
        <Group mt="sm" align="end">
          <TextInput
            label={t('settings.temporarilyDisableBlocking')}
            type="number"
            value={temporaryMinutes}
            onChange={e => setTemporaryMinutes(e.target.value)}
            w={220}
            disabled={!enabled}
          />
          <Button
            color="yellow"
            disabled={!enabled}
            onClick={() => {
              const minutes = Number(temporaryMinutes);
              if (!minutes) {
                error(t('common.error'), t('settings.tempDisableMinutesRequired'));
                return;
              }
              onTemporaryDisable(minutes);
            }}
          >
            {t('settings.disableBlockingNow')}
          </Button>
          {s.temporaryDisableBlockingTill && (
            <Text size="sm" c="orange">
              {t('settings.temporarilyDisabledTill', {
                date: new Date(s.temporaryDisableBlockingTill).toLocaleString(),
              })}
            </Text>
          )}
        </Group>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.blockLists')}
        </Text>
        <Textarea
          label={t('settings.blockListUrls')}
          description={t('settings.blockListUrlsHelp')}
          placeholder={t('common.onePerLine')}
          value={toList(s.blockListUrls)}
          onChange={e => set({ blockListUrls: e.target.value.split('\n') })}
          minRows={4}
          disabled={!enabled}
        />
        <Text size="xs" c="dimmed" mt="xs">
          {t('settings.blockListUrlsNote1')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.blockListUrlsNote2')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.blockListUrlsNote3')}
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
            marginTop: 'var(--mantine-spacing-sm)',
          }}
        >
          <Select
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('common.quickAdd')}
            placeholder={t('settings.selectQuickBlockList')}
            data={[
              { value: 'none', label: t('settings.none') },
              ...quickBlockLists.map(x => ({ value: x.name, label: x.name })),
            ]}
            value={null}
            onChange={v => applyQuickBlockList(v)}
            disabled={!enabled}
            clearable
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.blockListUpdateInterval')}
            description={t('settings.blockListUpdateIntervalHelp')}
            value={s.blockListUpdateIntervalHours}
            onChange={e => set({ blockListUpdateIntervalHours: e.target.value })}
            disabled={!enabled}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.nextUpdatedOn')}
            description={t('settings.blockListNextUpdateOnHelp')}
            value={
              s.blockListNextUpdatedOn
                ? new Date(s.blockListNextUpdatedOn).toLocaleString()
                : t('settings.notScheduled')
            }
            disabled
          />
        </div>
        <Group align="flex-start" mt="sm">
          <Button
            size="xs"
            variant="default"
            onClick={onUpdateBlockLists}
            disabled={!enabled || (s.blockListUrls || []).length === 0}
          >
            {t('settings.updateBlockListsNow')}
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.blockListsNote')}
        </Text>
      </Paper>
    </Stack>
  );
}

function ProxyForwardersTab({ s, set }: { s: Settings; set: (patch: Partial<Settings>) => void }) {
  const { t } = useTranslation();
  const proxyType = s.proxy ? s.proxy.type.toLowerCase() : 'none';
  const showProxyFields = proxyType !== 'none';
  const [quickForwarders, setQuickForwarders] = useState<QuickForwarderList[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/json/quick-forwarders-list-builtin.json')
      .then(r => r.json())
      .then((list: QuickForwarderList[]) => {
        if (!cancelled) setQuickForwarders(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const updateProxy = (patch: Partial<NonNullable<Settings['proxy']>>) => {
    const current: NonNullable<Settings['proxy']> = s.proxy || { type: 'none' };
    set({ proxy: { ...current, ...patch } });
  };

  const applyQuickForwarder = (name: string | null) => {
    if (!name) return;
    if (name === 'none') {
      set({ forwarders: [], forwarderProtocol: 'Udp' });
      return;
    }
    const item = quickForwarders.find(x => x.name === name);
    if (!item) return;
    set({ forwarders: item.addresses, forwarderProtocol: item.protocol || 'Udp' });
    if (item.proxyType) {
      updateProxy({
        type: item.proxyType.toLowerCase(),
        address: item.proxyAddress || '',
        port: item.proxyPort || '',
        username: item.proxyUsername || '',
        password: item.proxyPassword || '',
        bypass: item.bypass || [],
      });
    }
  };

  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.networkProxy')}
        </Text>
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            {t('settings.proxyType')}
          </Text>
          <Radio
            checked={proxyType === 'none'}
            onChange={() => updateProxy({ type: 'none' })}
            label={t('settings.none')}
          />
          <Radio
            checked={proxyType === 'http'}
            onChange={() => updateProxy({ type: 'http' })}
            label={t('settings.http')}
          />
          <Radio
            checked={proxyType === 'socks5'}
            onChange={() => updateProxy({ type: 'socks5' })}
            label={t('settings.socks5')}
          />
        </Stack>
        {showProxyFields && (
          <>
            <Group align="flex-start" grow mt="sm">
              <TextInput
                label={t('settings.proxyAddress')}
                value={s.proxy?.address || ''}
                onChange={e => updateProxy({ address: e.target.value })}
              />
              <TextInput
                label={t('settings.proxyPort')}
                value={s.proxy?.port || ''}
                onChange={e => updateProxy({ port: e.target.value })}
              />
            </Group>
            <Group align="flex-start" grow mt="sm">
              <TextInput
                label={t('settings.proxyUsername')}
                value={s.proxy?.username || ''}
                onChange={e => updateProxy({ username: e.target.value })}
              />
              <TextInput
                label={t('settings.proxyPassword')}
                type="password"
                value={s.proxy?.password || ''}
                onChange={e => updateProxy({ password: e.target.value })}
              />
            </Group>
            <Textarea
              mt="sm"
              label={t('settings.proxyBypassList')}
              description={t('settings.proxyBypassListHelp')}
              value={toList(s.proxy?.bypass)}
              onChange={e => updateProxy({ bypass: e.target.value.split('\n') })}
              minRows={3}
            />
          </>
        )}
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.proxyNote')}
        </Text>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.forwarders')}
        </Text>
        <Textarea
          label={t('settings.forwarders')}
          placeholder="8.8.8.8 or https://cloudflare-dns.com/dns-query"
          value={toList(s.forwarders)}
          onChange={e => set({ forwarders: e.target.value.split('\n') })}
          minRows={4}
          description={t('settings.forwardersHelp')}
        />
        <Select
          mt="sm"
          label={t('common.quickAdd')}
          placeholder={t('settings.selectQuickForwarderList')}
          data={[
            { value: 'none', label: t('settings.none') },
            ...quickForwarders.map(x => ({ value: x.name, label: x.name })),
          ]}
          value={null}
          onChange={v => applyQuickForwarder(v)}
          clearable
        />
        <Stack gap="xs" mt="sm">
          <Text size="sm" fw={500}>
            {t('settings.forwarderProtocol')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('settings.forwarderProtocolHelp')}
          </Text>
          <Radio
            checked={s.forwarderProtocol === 'Udp'}
            onChange={() => set({ forwarderProtocol: 'Udp' })}
            label={t('zones.dnsOverUdp')}
          />
          <Radio
            checked={s.forwarderProtocol === 'Tcp'}
            onChange={() => set({ forwarderProtocol: 'Tcp' })}
            label={t('zones.dnsOverTcp')}
          />
          <Radio
            checked={s.forwarderProtocol === 'Tls'}
            onChange={() => set({ forwarderProtocol: 'Tls' })}
            label={t('zones.dnsOverTls')}
          />
          <Radio
            checked={s.forwarderProtocol === 'Https'}
            onChange={() => set({ forwarderProtocol: 'Https' })}
            label={t('zones.dnsOverHttps')}
          />
          <Radio
            checked={s.forwarderProtocol === 'Quic'}
            onChange={() => set({ forwarderProtocol: 'Quic' })}
            label={t('zones.dnsOverQuic')}
          />
        </Stack>
        <Group align="flex-start" mt="sm">
          <Checkbox
            label={t('settings.enableConcurrentForwarding')}
            description={t('settings.enableConcurrentForwardingHelp')}
            checked={s.concurrentForwarding}
            onChange={e => set({ concurrentForwarding: e.currentTarget.checked })}
          />
        </Group>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.forwarderRetries')}
            description={t('settings.forwarderRetriesHelp')}
            value={s.forwarderRetries}
            onChange={e => set({ forwarderRetries: e.target.value })}
          />
          <TextInput
            label={t('settings.forwarderTimeout')}
            description={t('settings.forwarderTimeoutHelp')}
            value={s.forwarderTimeout}
            onChange={e => set({ forwarderTimeout: e.target.value })}
          />
          <TextInput
            label={t('settings.forwarderConcurrency')}
            description={t('settings.forwarderConcurrencyHelp')}
            value={s.forwarderConcurrency}
            onChange={e => set({ forwarderConcurrency: e.target.value })}
            disabled={!s.concurrentForwarding}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.forwardersNote1')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.forwardersNote2')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.forwardersNote3')}
        </Text>
      </Paper>
    </Stack>
  );
}

function LoggingTab({ s, set }: { s: Settings; set: (patch: Partial<Settings>) => void }) {
  const { t } = useTranslation();
  const enabled = s.loggingType !== 'None';
  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            {t('settings.loggingType')}
          </Text>
          <Radio
            checked={s.loggingType === 'None'}
            onChange={() => set({ loggingType: 'None' })}
            label={t('settings.none')}
            description={t('settings.loggingTypeNoneHelp')}
          />
          <Radio
            checked={s.loggingType === 'File'}
            onChange={() => set({ loggingType: 'File' })}
            label={t('settings.file')}
            description={t('settings.loggingTypeFileHelp')}
          />
          <Radio
            checked={s.loggingType === 'Console'}
            onChange={() => set({ loggingType: 'Console' })}
            label={t('settings.console')}
            description={t('settings.loggingTypeConsoleHelp')}
          />
          <Radio
            checked={s.loggingType === 'FileAndConsole'}
            onChange={() => set({ loggingType: 'FileAndConsole' })}
            label={t('settings.fileAndConsole')}
            description={t('settings.loggingTypeBothHelp')}
          />
        </Stack>
        <Group align="flex-start" mt="sm">
          <Checkbox
            label={t('settings.ignoreResolverLogs')}
            description={t('settings.ignoreResolverLogsHelp')}
            checked={s.ignoreResolverLogs}
            onChange={e => set({ ignoreResolverLogs: e.currentTarget.checked })}
            disabled={!enabled}
          />
          <Checkbox
            label={t('settings.logQueries')}
            description={t('settings.logQueriesHelp')}
            checked={s.logQueries}
            onChange={e => set({ logQueries: e.currentTarget.checked })}
            disabled={!enabled}
          />
          <Checkbox
            label={t('settings.useLocalTime')}
            description={t('settings.useLocalTimeHelp')}
            checked={s.useLocalTime}
            onChange={e => set({ useLocalTime: e.currentTarget.checked })}
            disabled={!enabled}
          />
        </Group>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.logFolderPath')}
            description={t('settings.logFolderPathHelp')}
            value={s.logFolder}
            onChange={e => set({ logFolder: e.target.value })}
            disabled={!enabled}
          />
          <TextInput
            label={t('settings.maxLogFileDays')}
            description={t('settings.maxLogFileDaysHelp')}
            value={s.maxLogFileDays}
            onChange={e => set({ maxLogFileDays: e.target.value })}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.loggingWarning')}
        </Text>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.stats')}
        </Text>
        <Group align="flex-start">
          <Checkbox
            label={t('settings.enableInMemoryStats')}
            description={t('settings.enableInMemoryStatsHelp')}
            checked={s.enableInMemoryStats}
            onChange={e => set({ enableInMemoryStats: e.currentTarget.checked })}
          />
        </Group>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.maxStatFileDays')}
            description={t('settings.maxStatFileDaysHelp')}
            value={s.maxStatFileDays}
            onChange={e => set({ maxStatFileDays: e.target.value })}
          />
        </Group>
      </Paper>
    </Stack>
  );
}

export function SettingsPage({ tab = 'general' }: { tab?: string }) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const set = (patch: Partial<Settings>) => setSettings(prev => ({ ...prev, ...patch }));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<Settings>('/settings/get')
      .then((response: { status: string; response?: Settings }) => {
        if (!cancelled && response.status === 'ok' && response.response) {
          setSettings({ ...emptySettings, ...response.response });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cleanList = (text: string) =>
    text
      .replace(/\n/g, ',')
      .split(',')
      .filter(x => x.trim() !== '')
      .join(',');

  const save = async () => {
    setSaving(true);
    try {
      const params: Record<string, unknown> = {};

      params.dnsServerDomain = settings.dnsServerDomain;
      params.dnsServerLocalEndPoints =
        toArray(toList(settings.dnsServerLocalEndPoints)) || '0.0.0.0:53,[::]:53';
      params.dnsServerIPv4SourceAddresses =
        toArray(toList(settings.dnsServerIPv4SourceAddresses)) || 'false';
      params.dnsServerIPv6SourceAddresses =
        toArray(toList(settings.dnsServerIPv6SourceAddresses)) || 'false';
      params.defaultRecordTtl = settings.defaultRecordTtl;
      params.defaultNsRecordTtl = settings.defaultNsRecordTtl;
      params.defaultSoaRecordTtl = settings.defaultSoaRecordTtl;
      params.defaultResponsiblePerson = settings.defaultResponsiblePerson;
      params.useSoaSerialDateScheme = settings.useSoaSerialDateScheme;
      params.minSoaRefresh = settings.minSoaRefresh;
      params.minSoaRetry = settings.minSoaRetry;
      params.zoneTransferAllowedNetworks =
        toArray(toList(settings.zoneTransferAllowedNetworks)) || 'false';
      params.notifyAllowedNetworks = toArray(toList(settings.notifyAllowedNetworks)) || 'false';
      params.dnsAppsEnableAutomaticUpdate = settings.dnsAppsEnableAutomaticUpdate;
      params.preferIPv6 = settings.preferIPv6;
      params.enableUdpSocketPool = settings.enableUdpSocketPool;
      params.socketPoolExcludedPorts = toArray(toList(settings.socketPoolExcludedPorts)) || 'false';
      params.udpPayloadSize = settings.udpPayloadSize;
      params.dnssecValidation = settings.dnssecValidation;
      params.eDnsClientSubnet = settings.eDnsClientSubnet;
      params.eDnsClientSubnetIPv4PrefixLength = settings.eDnsClientSubnetIPv4PrefixLength;
      params.eDnsClientSubnetIPv6PrefixLength = settings.eDnsClientSubnetIPv6PrefixLength;
      params.eDnsClientSubnetIpv4Override = settings.eDnsClientSubnetIpv4Override;
      params.eDnsClientSubnetIpv6Override = settings.eDnsClientSubnetIpv6Override;
      if (settings.qpmPrefixLimitsIPv4?.length)
        params.qpmPrefixLimitsIPv4 = settings.qpmPrefixLimitsIPv4
          .map(r => `${r.prefix}|${r.udpLimit}|${r.tcpLimit}`)
          .join('|');
      if (settings.qpmPrefixLimitsIPv6?.length)
        params.qpmPrefixLimitsIPv6 = settings.qpmPrefixLimitsIPv6
          .map(r => `${r.prefix}|${r.udpLimit}|${r.tcpLimit}`)
          .join('|');
      params.qpmLimitSampleMinutes = settings.qpmLimitSampleMinutes;
      params.qpmLimitUdpTruncationPercentage = settings.qpmLimitUdpTruncationPercentage;
      params.qpmLimitBypassList = toArray(toList(settings.qpmLimitBypassList)) || 'false';
      params.clientTimeout = settings.clientTimeout;
      params.tcpSendTimeout = settings.tcpSendTimeout;
      params.tcpReceiveTimeout = settings.tcpReceiveTimeout;
      params.quicIdleTimeout = settings.quicIdleTimeout;
      params.quicMaxInboundStreams = settings.quicMaxInboundStreams;
      params.listenBacklog = settings.listenBacklog;
      params.maxConcurrentResolutionsPerCore = settings.maxConcurrentResolutionsPerCore;

      params.webServiceLocalAddresses =
        toArray(toList(settings.webServiceLocalAddresses)) || '0.0.0.0,[::]';
      params.webServiceHttpPort = settings.webServiceHttpPort;
      params.webServiceEnableTls = settings.webServiceEnableTls;
      params.webServiceEnableHttp3 = settings.webServiceEnableHttp3;
      params.webServiceHttpToTlsRedirect = settings.webServiceHttpToTlsRedirect;
      params.webServiceUseSelfSignedTlsCertificate = settings.webServiceUseSelfSignedTlsCertificate;
      params.webServiceTlsPort = settings.webServiceTlsPort;
      params.webServiceTlsCertificatePath = settings.webServiceTlsCertificatePath || '';
      params.webServiceTlsCertificatePassword = settings.webServiceTlsCertificatePassword || '';
      params.webServiceRealIpHeader = settings.webServiceRealIpHeader;

      params.enableDnsOverUdpProxy = settings.enableDnsOverUdpProxy;
      params.enableDnsOverTcpProxy = settings.enableDnsOverTcpProxy;
      params.enableDnsOverHttp = settings.enableDnsOverHttp;
      params.enableDnsOverTls = settings.enableDnsOverTls;
      params.enableDnsOverHttps = settings.enableDnsOverHttps;
      params.enableDnsOverHttp3 = settings.enableDnsOverHttp3;
      params.enableDnsOverQuic = settings.enableDnsOverQuic;
      params.dnsOverUdpProxyPort = settings.dnsOverUdpProxyPort;
      params.dnsOverTcpProxyPort = settings.dnsOverTcpProxyPort;
      params.dnsOverHttpPort = settings.dnsOverHttpPort;
      params.dnsOverTlsPort = settings.dnsOverTlsPort;
      params.dnsOverHttpsPort = settings.dnsOverHttpsPort;
      params.dnsOverQuicPort = settings.dnsOverQuicPort;
      params.reverseProxyNetworkACL = toArray(toList(settings.reverseProxyNetworkACL)) || 'false';
      params.dnsTlsCertificatePath = settings.dnsTlsCertificatePath || '';
      params.dnsTlsCertificatePassword = settings.dnsTlsCertificatePassword || '';
      params.dnsOverHttpRealIpHeader = settings.dnsOverHttpRealIpHeader;

      if (settings.tsigKeys?.length)
        params.tsigKeys = settings.tsigKeys
          .map(k => `${k.keyName}|${k.sharedSecret}|${k.algorithmName}`)
          .join('|');

      params.recursion = settings.recursion;
      params.recursionNetworkACL = toArray(toList(settings.recursionNetworkACL)) || 'false';
      params.randomizeName = settings.randomizeName;
      params.qnameMinimization = settings.qnameMinimization;
      params.resolverRetries = settings.resolverRetries;
      params.resolverTimeout = settings.resolverTimeout;
      params.resolverConcurrency = settings.resolverConcurrency;
      params.resolverMaxStackCount = settings.resolverMaxStackCount;

      params.saveCache = settings.saveCache;
      params.serveStale = settings.serveStale;
      params.serveStaleTtl = settings.serveStaleTtl;
      params.serveStaleAnswerTtl = settings.serveStaleAnswerTtl;
      params.serveStaleResetTtl = settings.serveStaleResetTtl;
      params.serveStaleMaxWaitTime = settings.serveStaleMaxWaitTime;
      params.cacheMaximumEntries = settings.cacheMaximumEntries;
      params.cacheMinimumRecordTtl = settings.cacheMinimumRecordTtl;
      params.cacheMaximumRecordTtl = settings.cacheMaximumRecordTtl;
      params.cacheNegativeRecordTtl = settings.cacheNegativeRecordTtl;
      params.cacheFailureRecordTtl = settings.cacheFailureRecordTtl;
      params.cachePrefetchEligibility = settings.cachePrefetchEligibility;
      params.cachePrefetchTrigger = settings.cachePrefetchTrigger;
      params.cachePrefetchSampleIntervalInMinutes = settings.cachePrefetchSampleIntervalInMinutes;
      params.cachePrefetchSampleEligibilityHitsPerHour =
        settings.cachePrefetchSampleEligibilityHitsPerHour;

      params.enableBlocking = settings.enableBlocking;
      params.allowTxtBlockingReport = settings.allowTxtBlockingReport;
      params.blockingBypassList = toArray(toList(settings.blockingBypassList)) || 'false';
      params.blockingType = settings.blockingType;
      params.customBlockingAddresses = toArray(toList(settings.customBlockingAddresses)) || 'false';
      params.blockingAnswerTtl = settings.blockingAnswerTtl;
      params.blockListUrls = toArray(toList(settings.blockListUrls)) || 'false';
      params.blockListUpdateIntervalHours = settings.blockListUpdateIntervalHours;

      const proxyType = settings.proxy?.type?.toLowerCase() || 'none';
      params.proxyType = proxyType;
      if (proxyType !== 'none') {
        params.proxyAddress = settings.proxy?.address || '';
        params.proxyPort = settings.proxy?.port || '';
        params.proxyUsername = settings.proxy?.username || '';
        params.proxyPassword = settings.proxy?.password || '';
        params.proxyBypass = cleanList(toList(settings.proxy?.bypass));
      }
      params.forwarders = toArray(toList(settings.forwarders)) || 'false';
      params.forwarderProtocol = settings.forwarderProtocol;
      params.concurrentForwarding = settings.concurrentForwarding;
      params.forwarderRetries = settings.forwarderRetries;
      params.forwarderTimeout = settings.forwarderTimeout;
      params.forwarderConcurrency = settings.forwarderConcurrency;

      params.loggingType = settings.loggingType;
      params.ignoreResolverLogs = settings.ignoreResolverLogs;
      params.logQueries = settings.logQueries;
      params.useLocalTime = settings.useLocalTime;
      params.logFolder = settings.logFolder;
      params.maxLogFileDays = settings.maxLogFileDays;
      params.enableInMemoryStats = settings.enableInMemoryStats;
      params.maxStatFileDays = settings.maxStatFileDays;

      const response = await apiClient.post('/settings/set', params);
      if (response.status === 'ok') {
        success(t('common.success'), t('settings.saved'));
      } else {
        throw new Error(response.errorMessage || t('settings.saveFailed'));
      }
    } catch (e) {
      error(t('common.error'), e instanceof Error ? e.message : t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const flushCache = async () => {
    if (!window.confirm(t('settings.flushCacheConfirm'))) return;
    try {
      const response = await apiClient.post('/cache/flush', {});
      if (response.status === 'ok') {
        success(t('common.success'), t('settings.cacheFlushed'));
      }
    } catch {
      error(t('common.error'), t('settings.cacheFlushFailed'));
    }
  };

  const updateBlockListsNow = async () => {
    try {
      const response = await apiClient.post('/settings/forceUpdateBlockLists', {});
      if (response.status === 'ok') {
        success(t('common.success'), t('settings.blockListsUpdated'));
      }
    } catch {
      error(t('common.error'), t('settings.blockListsUpdateFailed'));
    }
  };

  const temporaryDisableBlocking = async (minutes: number) => {
    if (!window.confirm(t('settings.tempDisableConfirm', { minutes }))) return;
    try {
      const response = await apiClient.post(
        `/settings/temporaryDisableBlocking?minutes=${minutes}`,
        {}
      );
      if (response.status === 'ok' && response.response) {
        success(t('common.success'), t('settings.tempDisabled', { minutes }));
        const till = (response.response as { temporaryDisableBlockingTill?: string })
          .temporaryDisableBlockingTill;
        if (till) set({ temporaryDisableBlockingTill: till });
      }
    } catch {
      error(t('common.error'), t('settings.tempDisableBlockingFailed'));
    }
  };

  const [backupOpen, setBackupOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [backupItems, setBackupItems] = useState<Record<string, boolean>>({
    authConfig: true,
    clusterConfig: true,
    webServiceSettings: true,
    dnsSettings: true,
    logSettings: true,
    zones: true,
    allowedZones: true,
    blockedZones: true,
    blockLists: true,
    apps: true,
    scopes: true,
    stats: true,
    logs: false,
  });
  const [restoreItems, setRestoreItems] = useState<Record<string, boolean>>({ ...backupItems });
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [deleteExistingFiles, setDeleteExistingFiles] = useState(true);

  const BACKUP_ITEMS = [
    { key: 'authConfig', label: t('settings.backupItems.authConfig') },
    { key: 'clusterConfig', label: t('settings.backupItems.clusterConfig') },
    { key: 'webServiceSettings', label: t('settings.backupItems.webServiceSettings') },
    { key: 'dnsSettings', label: t('settings.backupItems.dnsSettings') },
    { key: 'logSettings', label: t('settings.backupItems.logSettings') },
    { key: 'zones', label: t('settings.backupItems.zones') },
    { key: 'allowedZones', label: t('settings.backupItems.allowedZones') },
    { key: 'blockedZones', label: t('settings.backupItems.blockedZones') },
    { key: 'blockLists', label: t('settings.backupItems.blockLists') },
    { key: 'apps', label: t('settings.backupItems.apps') },
    { key: 'scopes', label: t('settings.backupItems.scopes') },
    { key: 'stats', label: t('settings.backupItems.stats') },
    { key: 'logs', label: t('settings.backupItems.logs') },
  ];

  const doBackup = () => {
    const selected = BACKUP_ITEMS.filter(i => backupItems[i.key]);
    if (selected.length === 0) {
      error(t('common.error'), t('settings.selectBackupItems'));
      return;
    }
    const token = apiClient.getToken();
    if (!token) return;
    const query = selected.map(i => `${i.key}=true`).join('&');
    window.open(
      `/api/settings/backup?token=${encodeURIComponent(token)}&${query}&ts=${Date.now()}`,
      '_blank'
    );
    setBackupOpen(false);
    success(t('common.success'), t('settings.backedUp'));
  };

  const doRestore = async () => {
    if (!restoreFile) {
      error(t('common.error'), t('settings.selectRestoreZip'));
      return;
    }
    const selected = BACKUP_ITEMS.filter(i => restoreItems[i.key]);
    if (selected.length === 0) {
      error(t('common.error'), t('settings.selectRestoreItems'));
      return;
    }
    try {
      const formData = new FormData();
      formData.append('fileBackupZip', restoreFile);
      const query = selected.map(i => `${i.key}=true`).join('&');
      const response = await fetch(
        `/api/settings/restore?token=${encodeURIComponent(apiClient.getToken() || '')}&${query}&deleteExistingFiles=${deleteExistingFiles}`,
        { method: 'POST', body: formData }
      ).then(r => r.json());
      if (response.status === 'ok') {
        success(t('common.success'), t('settings.restored'));
        setRestoreOpen(false);
        setRestoreFile(null);
      } else {
        throw new Error(response.errorMessage || 'Failed');
      }
    } catch {
      error(t('common.error'), t('settings.restoreFailed'));
    }
  };

  const toggleBackupItem = (key: string) =>
    setBackupItems(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleRestoreItem = (key: string) =>
    setRestoreItems(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <Stack>
      <Group align="flex-start" justify="space-between">
        <Title order={2}>{t('nav.settings')}</Title>
        <Group align="flex-start">
          <Button variant="default" onClick={() => setBackupOpen(true)}>
            {t('settings.backup')}
          </Button>
          <Button variant="default" onClick={() => setRestoreOpen(true)}>
            {t('settings.restore')}
          </Button>
          <Button onClick={save} loading={saving} disabled={loading}>
            {t('common.save')}
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Stack mt="md" gap="sm">
          <Skeleton height={140} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </Stack>
      ) : (
        <Stack mt="md">
          {tab === 'general' && <GeneralTab s={settings} set={set} />}
          {tab === 'webService' && <WebServiceTab s={settings} set={set} />}
          {tab === 'optionalProtocols' && <OptionalProtocolsTab s={settings} set={set} />}
          {tab === 'tsig' && <TsigTab s={settings} set={set} />}
          {tab === 'recursion' && <RecursionTab s={settings} set={set} />}
          {tab === 'cache' && <CacheTab s={settings} set={set} onFlushCache={flushCache} />}
          {tab === 'blocking' && (
            <BlockingTab
              s={settings}
              set={set}
              onUpdateBlockLists={updateBlockListsNow}
              onTemporaryDisable={temporaryDisableBlocking}
            />
          )}
          {tab === 'proxyForwarders' && <ProxyForwardersTab s={settings} set={set} />}
          {tab === 'logging' && <LoggingTab s={settings} set={set} />}
        </Stack>
      )}

      <Modal
        opened={backupOpen}
        onClose={() => setBackupOpen(false)}
        title={t('settings.backupSettings')}
        centered
      >
        <Stack>
          <Text size="sm">{t('settings.selectItemsToBackup')}</Text>
          <Group align="flex-start">
            {BACKUP_ITEMS.map(item => (
              <Checkbox
                key={item.key}
                label={item.label}
                checked={backupItems[item.key]}
                onChange={() => toggleBackupItem(item.key)}
              />
            ))}
          </Group>
          <Group align="flex-start" justify="flex-end">
            <Button variant="subtle" onClick={() => setBackupOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={doBackup}>{t('settings.backup')}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title={t('settings.restoreSettings')}
        centered
      >
        <Stack>
          <FileInput
            label={t('settings.backupZipFile')}
            placeholder={t('settings.selectBackupZipPlaceholder')}
            value={restoreFile}
            onChange={setRestoreFile}
            accept=".zip"
          />
          <Text size="sm">{t('settings.selectItemsToRestore')}</Text>
          <Group align="flex-start">
            {BACKUP_ITEMS.map(item => (
              <Checkbox
                key={item.key}
                label={item.label}
                checked={restoreItems[item.key]}
                onChange={() => toggleRestoreItem(item.key)}
              />
            ))}
          </Group>
          <Checkbox
            label={t('settings.deleteExistingFiles')}
            checked={deleteExistingFiles}
            onChange={e => setDeleteExistingFiles(e.currentTarget.checked)}
          />
          <Group align="flex-start" justify="flex-end">
            <Button variant="subtle" onClick={() => setRestoreOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={doRestore}>{t('settings.restore')}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
