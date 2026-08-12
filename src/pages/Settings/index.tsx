import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  FileInput,
  Group,
  Modal,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../components/notifications';
import { apiClient } from '../../api/client';
import type { Settings } from './types';
import { emptySettings, toArray, toList } from './constants';
import { GeneralTab } from './tabs/GeneralTab';
import { WebServiceTab } from './tabs/WebServiceTab';
import { OptionalProtocolsTab } from './tabs/OptionalProtocolsTab';
import { TsigTab } from './tabs/TsigTab';
import { RecursionTab } from './tabs/RecursionTab';
import { CacheTab } from './tabs/CacheTab';
import { BlockingTab } from './tabs/BlockingTab';
import { ProxyForwardersTab } from './tabs/ProxyForwardersTab';
import { LoggingTab } from './tabs/LoggingTab';

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
          const loadedSettings = { ...emptySettings, ...response.response };
          for (const key of Object.keys(emptySettings) as (keyof Settings)[]) {
            if (loadedSettings[key] == null) {
              Object.assign(loadedSettings, { [key]: emptySettings[key] });
            }
          }
          setSettings(loadedSettings);
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
    <Stack maw={1440} mx="auto" w="100%">
      <Group
        className="settings-page-header"
        align="flex-start"
        justify="space-between"
        wrap="wrap"
        gap="sm"
      >
        <Title order={2}>{t('nav.settings')}</Title>
        <Group align="flex-start" gap="xs">
          <Button size="xs" variant="default" onClick={() => setBackupOpen(true)}>
            {t('settings.backup')}
          </Button>
          <Button size="xs" variant="default" onClick={() => setRestoreOpen(true)}>
            {t('settings.restore')}
          </Button>
          <Button size="xs" onClick={save} loading={saving} disabled={loading}>
            {t('common.save')}
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Stack gap="sm">
          <Skeleton height={140} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </Stack>
      ) : (
        <Stack>
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
