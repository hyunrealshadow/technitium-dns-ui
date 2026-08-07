import { useEffect, useState } from 'react';
import {
  Checkbox,
  Group,
  Paper,
  Radio,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { QuickForwarderList, Settings } from '../types';
import { toList } from '../constants';

export function ProxyForwardersTab({
  s,
  set,
}: {
  s: Settings;
  set: (patch: Partial<Settings>) => void;
}) {
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
              autosize
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
          autosize
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
