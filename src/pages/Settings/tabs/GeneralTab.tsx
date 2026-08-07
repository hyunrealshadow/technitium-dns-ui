import { Checkbox, Group, Paper, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { QpmRow, Settings } from '../types';
import { toList, toArray } from '../constants';
import { QpmTable } from '../components/QpmTable';

export function GeneralTab({ s, set }: { s: Settings; set: (patch: Partial<Settings>) => void }) {
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
