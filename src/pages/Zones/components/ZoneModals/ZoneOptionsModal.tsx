import { useEffect, useState } from 'react';
import {
  Button,
  Center,
  Checkbox,
  Group,
  Modal,
  Loader,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../../components/notifications';
import { apiClient } from '../../../../api/client';

type ZoneOptionsTab = 'general' | 'queryAccess' | 'zoneTransfer' | 'notify' | 'dynamicUpdates';

function getAvailableTabs(
  zoneType: string,
  catalog: string,
  catalogOptionsCount: number
): ZoneOptionsTab[] {
  const tabs: ZoneOptionsTab[] = [];
  const showCatalogSection =
    ['Primary', 'Secondary', 'Stub', 'Forwarder', 'SecondaryForwarder'].includes(zoneType) &&
    (catalogOptionsCount > 0 || catalog !== '');
  const showPrimaryServerSection = [
    'Secondary',
    'SecondaryForwarder',
    'SecondaryCatalog',
    'Stub',
  ].includes(zoneType);

  if (showCatalogSection || showPrimaryServerSection) tabs.push('general');
  if (
    [
      'Primary',
      'Secondary',
      'Stub',
      'Forwarder',
      'SecondaryForwarder',
      'SecondaryCatalog',
      'Catalog',
    ].includes(zoneType)
  ) {
    tabs.push('queryAccess');
  }
  if (['Primary', 'Secondary', 'Forwarder', 'Catalog', 'SecondaryCatalog'].includes(zoneType)) {
    tabs.push('zoneTransfer');
  }
  if (['Primary', 'Secondary', 'Forwarder', 'Catalog'].includes(zoneType)) tabs.push('notify');
  if (['Primary', 'Secondary', 'SecondaryForwarder', 'Forwarder'].includes(zoneType)) {
    tabs.push('dynamicUpdates');
  }

  return tabs;
}

export function ZoneOptionsModal({
  zone,
  opened,
  onClose,
  onSuccess,
}: {
  zone: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [zoneType, setZoneType] = useState('');
  const [catalog, setCatalog] = useState('');
  const [catalogOptions, setCatalogOptions] = useState<{ value: string; label: string }[]>([]);
  const [overrideQueryAccess, setOverrideQueryAccess] = useState(false);
  const [overrideZoneTransfer, setOverrideZoneTransfer] = useState(false);
  const [overrideNotify, setOverrideNotify] = useState(false);
  const [overridePrimaryNameServers, setOverridePrimaryNameServers] = useState(false);
  const [isSecondaryCatalogMember, setIsSecondaryCatalogMember] = useState(false);

  const [primaryNsAddresses, setPrimaryNsAddresses] = useState('');
  const [primaryZoneTransferProtocol, setPrimaryZoneTransferProtocol] = useState('Tcp');
  const [primaryZoneTransferTsigKeyName, setPrimaryZoneTransferTsigKeyName] = useState('');
  const [tsigKeyOptions, setTsigKeyOptions] = useState<{ value: string; label: string }[]>([]);
  const [validateZone, setValidateZone] = useState(false);

  // Query Access
  const [queryAccess, setQueryAccess] = useState('Deny');
  const [queryAccessAcl, setQueryAccessAcl] = useState('');

  // Zone Transfer
  const [zoneTransfer, setZoneTransfer] = useState('Deny');
  const [zoneTransferAcl, setZoneTransferAcl] = useState('');
  const [zoneTransferTsigKeys, setZoneTransferTsigKeys] = useState('');

  // Notify
  const [notify, setNotify] = useState('None');
  const [notifyNameServers, setNotifyNameServers] = useState('');
  const [notifySecondaryCatalogNs, setNotifySecondaryCatalogNs] = useState('');
  const [notifyFailedFor, setNotifyFailedFor] = useState<string[]>([]);

  // Dynamic Updates
  const [update, setUpdate] = useState('Deny');
  const [updateAcl, setUpdateAcl] = useState('');
  const [updateSecurityPolicies, setUpdateSecurityPolicies] = useState<
    { tsigKeyName: string; domain: string; allowedTypes: string }[]
  >([]);

  const [tab, setTab] = useState<ZoneOptionsTab | null>(null);

  const QUERY_ACCESS_OPTIONS = [
    { value: 'Deny', label: t('zones.policyOptions.deny') },
    { value: 'Allow', label: t('zones.policyOptions.allowDefault') },
    { value: 'AllowOnlyPrivateNetworks', label: t('zones.policyOptions.allowOnlyPrivateNetworks') },
    { value: 'AllowOnlyZoneNameServers', label: t('zones.policyOptions.allowOnlyZoneNameServers') },
    { value: 'UseSpecifiedNetworkACL', label: t('zones.policyOptions.useSpecifiedNetworkACL') },
    {
      value: 'AllowZoneNameServersAndUseSpecifiedNetworkACL',
      label: t('zones.policyOptions.allowZoneNameServersAndUseSpecifiedNetworkACL'),
    },
  ];

  const ZONE_TRANSFER_OPTIONS = [
    { value: 'Deny', label: t('zones.policyOptions.deny') },
    { value: 'Allow', label: t('zones.policyOptions.allow') },
    { value: 'AllowOnlyZoneNameServers', label: t('zones.policyOptions.allowOnlyZoneNameServers') },
    { value: 'UseSpecifiedNetworkACL', label: t('zones.policyOptions.useSpecifiedNetworkACL') },
    {
      value: 'AllowZoneNameServersAndUseSpecifiedNetworkACL',
      label: t('zones.policyOptions.allowZoneNameServersAndUseSpecifiedNetworkACL'),
    },
  ];

  const NOTIFY_OPTIONS = [
    { value: 'None', label: t('zones.policyOptions.none') },
    { value: 'ZoneNameServers', label: t('zones.policyOptions.zoneNameServers') },
    { value: 'SpecifiedNameServers', label: t('zones.policyOptions.specifiedNameServers') },
    {
      value: 'BothZoneAndSpecifiedNameServers',
      label: t('zones.policyOptions.bothZoneAndSpecifiedNameServers'),
    },
    {
      value: 'SeparateNameServersForCatalogAndMemberZones',
      label: t('zones.policyOptions.separateNameServersForCatalogAndMemberZones'),
    },
  ];

  const UPDATE_OPTIONS = [
    { value: 'Deny', label: t('zones.policyOptions.denyDefault') },
    { value: 'Allow', label: t('zones.policyOptions.allow') },
    { value: 'AllowOnlyZoneNameServers', label: t('zones.policyOptions.allowOnlyZoneNameServers') },
    { value: 'UseSpecifiedNetworkACL', label: t('zones.policyOptions.useSpecifiedNetworkACL') },
    {
      value: 'AllowZoneNameServersAndUseSpecifiedNetworkACL',
      label: t('zones.policyOptions.allowZoneNameServersAndUseSpecifiedNetworkACL'),
    },
  ];

  useEffect(() => {
    if (!opened) return;
    const load = async () => {
      setLoadingOptions(true);
      setTab(null);
      try {
        const response = await fetch(
          `/api/zones/options/get?zone=${encodeURIComponent(zone)}&includeAvailableCatalogZoneNames=true&includeAvailableTsigKeyNames=true`,
          { headers: { Authorization: `Bearer ${apiClient.getToken() || ''}` } }
        );
        const data = await response.json();
        if (data.status === 'ok' && data.response) {
          const r = data.response;
          const nextZoneType = r.type || '';
          const nextCatalog = r.catalog || '';
          const nextCatalogOptions = (r.availableCatalogZoneNames || []).map((n: string) => ({
            value: n,
            label: n,
          }));
          setZoneType(nextZoneType);
          setCatalog(nextCatalog);
          setCatalogOptions(nextCatalogOptions);
          setTab(getAvailableTabs(nextZoneType, nextCatalog, nextCatalogOptions.length)[0] ?? null);
          setOverrideQueryAccess(r.overrideCatalogQueryAccess || false);
          setOverrideZoneTransfer(r.overrideCatalogZoneTransfer || false);
          setOverrideNotify(r.overrideCatalogNotify || false);
          setOverridePrimaryNameServers(r.overrideCatalogPrimaryNameServers || false);
          setIsSecondaryCatalogMember(r.isSecondaryCatalogMember || false);
          setPrimaryNsAddresses((r.primaryNameServerAddresses || []).join('\n'));
          setPrimaryZoneTransferProtocol(r.primaryZoneTransferProtocol || 'Tcp');
          setPrimaryZoneTransferTsigKeyName(r.primaryZoneTransferTsigKeyName || '');
          setTsigKeyOptions(
            (r.availableTsigKeyNames || []).map((n: string) => ({ value: n, label: n }))
          );
          setValidateZone(r.validateZone || false);
          setQueryAccess(r.queryAccess || 'Deny');
          setQueryAccessAcl((r.queryAccessNetworkACL || []).join('\n'));
          setZoneTransfer(r.zoneTransfer || 'Deny');
          setZoneTransferAcl((r.zoneTransferNetworkACL || []).join('\n'));
          setZoneTransferTsigKeys((r.zoneTransferTsigKeyNames || []).join('\n'));
          setNotify(r.notify || 'None');
          setNotifyNameServers((r.notifyNameServers || []).join('\n'));
          setNotifySecondaryCatalogNs((r.notifySecondaryCatalogsNameServers || []).join('\n'));
          setNotifyFailedFor(r.notifyFailedFor || []);
          setUpdate(r.update || 'Deny');
          setUpdateAcl((r.updateNetworkACL || []).join('\n'));
          setUpdateSecurityPolicies(r.updateSecurityPolicies || []);
        }
      } catch {
        error(t('common.error'), t('zones.optionsLoadFailed'));
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, [opened, zone, t]);

  const isCatalogMember = isSecondaryCatalogMember && catalog !== '';

  const showCatalogSection =
    ['Primary', 'Secondary', 'Stub', 'Forwarder', 'SecondaryForwarder'].includes(zoneType) &&
    (catalogOptions.length > 0 || catalog !== '');

  const showPrimaryServerSection = [
    'Secondary',
    'SecondaryForwarder',
    'SecondaryCatalog',
    'Stub',
  ].includes(zoneType);

  const availableTabs = getAvailableTabs(zoneType, catalog, catalogOptions.length);
  const canShowQueryAccessTab = availableTabs.includes('queryAccess');
  const canShowZoneTransferTab = availableTabs.includes('zoneTransfer');
  const canShowNotifyTab = availableTabs.includes('notify');
  const canShowUpdateTab = availableTabs.includes('dynamicUpdates');
  const firstAvailableTab = availableTabs[0] ?? null;
  const isCurrentTabAvailable = tab !== null && availableTabs.includes(tab);

  useEffect(() => {
    if (opened && firstAvailableTab && !isCurrentTabAvailable) {
      setTab(firstAvailableTab);
    }
  }, [opened, firstAvailableTab, isCurrentTabAvailable]);

  const showQueryAccessZoneNsOptions = zoneType === 'Primary' || zoneType === 'Secondary';
  const showZoneTransferZoneNsOptions = zoneType === 'Primary' || zoneType === 'Secondary';
  const showNotifyZoneNsOptions = zoneType !== 'Forwarder';
  const showUpdateZoneNsOptions = zoneType === 'Primary';
  const showSeparateCatalogNotify = zoneType === 'Catalog';

  const queryAccessDisabled = zoneType === 'SecondaryCatalog';
  const zoneTransferDisabled = zoneType === 'SecondaryCatalog';

  const handleAddSecurityPolicyRow = () => {
    setUpdateSecurityPolicies(prev => [
      ...prev,
      { tsigKeyName: '', domain: zone, allowedTypes: 'A,AAAA' },
    ]);
  };

  const handleRemoveSecurityPolicyRow = (index: number) => {
    setUpdateSecurityPolicies(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const params: Record<string, unknown> = { zone };

      params.catalog = catalog || '';
      params.overrideCatalogQueryAccess = overrideQueryAccess;
      params.overrideCatalogZoneTransfer = overrideZoneTransfer;
      params.overrideCatalogNotify = overrideNotify;

      if (showPrimaryServerSection) {
        params.primaryNameServerAddresses =
          primaryNsAddresses.trim().replace(/\n/g, ',') || 'false';
        params.primaryZoneTransferProtocol = primaryZoneTransferProtocol;
        params.primaryZoneTransferTsigKeyName = primaryZoneTransferTsigKeyName || '';
        if (zoneType === 'Secondary') params.validateZone = validateZone;
      }

      params.queryAccess = queryAccess;
      params.queryAccessNetworkACL = queryAccessAcl.trim().replace(/\n/g, ',') || 'false';
      params.zoneTransfer = zoneTransfer;
      params.zoneTransferNetworkACL = zoneTransferAcl.trim().replace(/\n/g, ',') || 'false';
      params.zoneTransferTsigKeyNames = zoneTransferTsigKeys.trim().replace(/\n/g, ',') || 'false';
      params.notify = notify;
      params.notifyNameServers = notifyNameServers.trim().replace(/\n/g, ',') || 'false';
      params.notifySecondaryCatalogsNameServers =
        notifySecondaryCatalogNs.trim().replace(/\n/g, ',') || 'false';
      params.update = update;
      params.updateNetworkACL = updateAcl.trim().replace(/\n/g, ',') || 'false';

      if (updateSecurityPolicies.length > 0) {
        params.updateSecurityPolicies = updateSecurityPolicies
          .map(p => `${p.tsigKeyName}|${p.domain}|${p.allowedTypes}`)
          .join('|');
      }

      await apiClient.post('/zones/options/set', params);
      success(t('common.success'), t('zones.optionsSaved'));
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), t('zones.optionsSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`${t('zones.zoneOptions')}: ${zone}`} size="lg">
      {loadingOptions && (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      )}
      <Tabs
        value={tab}
        onChange={v => v && setTab(v as ZoneOptionsTab)}
        style={{ display: loadingOptions ? 'none' : undefined }}
      >
        <Tabs.List>
          {(showCatalogSection || showPrimaryServerSection) && (
            <Tabs.Tab value="general">{t('zones.general')}</Tabs.Tab>
          )}
          {canShowQueryAccessTab && (
            <Tabs.Tab value="queryAccess">{t('zones.queryAccess')}</Tabs.Tab>
          )}
          {canShowZoneTransferTab && (
            <Tabs.Tab value="zoneTransfer">{t('zones.zoneTransfer')}</Tabs.Tab>
          )}
          {canShowNotifyTab && <Tabs.Tab value="notify">{t('zones.notify')}</Tabs.Tab>}
          {canShowUpdateTab && (
            <Tabs.Tab value="dynamicUpdates">{t('zones.dynamicUpdates')}</Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="general" pt="md">
          <Stack>
            {showCatalogSection && (
              <>
                <Select
                  label={t('zones.catalogZone')}
                  placeholder={t('common.optional')}
                  data={catalogOptions}
                  value={catalog}
                  onChange={v => {
                    setCatalog(v || '');
                    setOverrideQueryAccess(false);
                    setOverrideZoneTransfer(false);
                    setOverrideNotify(false);
                  }}
                  clearable
                  searchable
                  disabled={isCatalogMember}
                />
                {catalog !== '' && (
                  <Checkbox
                    label={t('zones.overrideQueryAccess')}
                    checked={overrideQueryAccess}
                    onChange={e => setOverrideQueryAccess(e.currentTarget.checked)}
                    disabled={isCatalogMember}
                  />
                )}
                {catalog !== '' &&
                  (zoneType === 'Primary' ||
                    zoneType === 'Forwarder' ||
                    zoneType === 'Secondary') && (
                    <Checkbox
                      label={t('zones.overrideZoneTransfer')}
                      checked={overrideZoneTransfer}
                      onChange={e => setOverrideZoneTransfer(e.currentTarget.checked)}
                      disabled={isCatalogMember}
                    />
                  )}
                {catalog !== '' && (zoneType === 'Primary' || zoneType === 'Forwarder') && (
                  <Checkbox
                    label={t('zones.overrideNotify')}
                    checked={overrideNotify}
                    onChange={e => setOverrideNotify(e.currentTarget.checked)}
                    disabled={isCatalogMember}
                  />
                )}
              </>
            )}

            {showPrimaryServerSection && (
              <>
                <Textarea
                  label={
                    zoneType === 'SecondaryForwarder' || zoneType === 'SecondaryCatalog'
                      ? t('zones.primaryNsRequired')
                      : t('zones.primaryNsOptional')
                  }
                  placeholder={t('common.onePerLine')}
                  value={primaryNsAddresses}
                  onChange={e => setPrimaryNsAddresses(e.target.value)}
                  minRows={3}
                  disabled={isCatalogMember && !overridePrimaryNameServers}
                />
                {(zoneType === 'Secondary' ||
                  zoneType === 'SecondaryForwarder' ||
                  zoneType === 'SecondaryCatalog') && (
                  <Select
                    label={t('zones.zoneTransferProtocol')}
                    data={[
                      { value: 'Tcp', label: t('zones.xfrOverTcp') },
                      { value: 'Tls', label: t('zones.xfrOverTls') },
                      { value: 'Quic', label: t('zones.xfrOverQuic') },
                    ]}
                    value={primaryZoneTransferProtocol}
                    onChange={v => setPrimaryZoneTransferProtocol(v || 'Tcp')}
                    disabled={isCatalogMember}
                  />
                )}
                {(zoneType === 'Secondary' ||
                  zoneType === 'SecondaryForwarder' ||
                  zoneType === 'SecondaryCatalog') && (
                  <Select
                    label={t('zones.tsigKeyOptional')}
                    placeholder={t('common.optional')}
                    data={tsigKeyOptions}
                    value={primaryZoneTransferTsigKeyName}
                    onChange={v => setPrimaryZoneTransferTsigKeyName(v || '')}
                    clearable
                    searchable
                    disabled={isCatalogMember}
                  />
                )}
                {zoneType === 'Secondary' && (
                  <Checkbox
                    label={t('zones.useZonemd')}
                    checked={validateZone}
                    onChange={e => setValidateZone(e.currentTarget.checked)}
                    disabled={isCatalogMember}
                  />
                )}
              </>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="queryAccess" pt="md">
          <Stack>
            <Select
              label={t('zones.queryAccessPolicy')}
              data={
                showQueryAccessZoneNsOptions
                  ? QUERY_ACCESS_OPTIONS
                  : QUERY_ACCESS_OPTIONS.filter(
                      o =>
                        o.value !== 'AllowOnlyZoneNameServers' &&
                        o.value !== 'AllowZoneNameServersAndUseSpecifiedNetworkACL'
                    )
              }
              value={queryAccess}
              onChange={v => setQueryAccess(v || 'Deny')}
              disabled={queryAccessDisabled}
            />
            <Textarea
              label={t('zones.networkAcl')}
              placeholder={t('zones.networkAclPlaceholder')}
              value={queryAccessAcl}
              onChange={e => setQueryAccessAcl(e.target.value)}
              minRows={5}
              disabled={
                queryAccessDisabled ||
                ![
                  'UseSpecifiedNetworkACL',
                  'AllowZoneNameServersAndUseSpecifiedNetworkACL',
                ].includes(queryAccess)
              }
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="zoneTransfer" pt="md">
          <Stack>
            <Select
              label={t('zones.zoneTransferPolicy')}
              data={
                showZoneTransferZoneNsOptions
                  ? ZONE_TRANSFER_OPTIONS
                  : ZONE_TRANSFER_OPTIONS.filter(
                      o =>
                        o.value !== 'AllowOnlyZoneNameServers' &&
                        o.value !== 'AllowZoneNameServersAndUseSpecifiedNetworkACL'
                    )
              }
              value={zoneTransfer}
              onChange={v => setZoneTransfer(v || 'Deny')}
              disabled={zoneTransferDisabled}
            />
            <Textarea
              label={t('zones.networkAcl')}
              placeholder={t('common.onePerLine')}
              value={zoneTransferAcl}
              onChange={e => setZoneTransferAcl(e.target.value)}
              minRows={5}
              disabled={
                zoneTransferDisabled ||
                ![
                  'UseSpecifiedNetworkACL',
                  'AllowZoneNameServersAndUseSpecifiedNetworkACL',
                ].includes(zoneTransfer)
              }
            />
            <Textarea
              label={t('zones.zoneTransferTsigKeyNames')}
              placeholder={t('common.onePerLine')}
              value={zoneTransferTsigKeys}
              onChange={e => setZoneTransferTsigKeys(e.target.value)}
              minRows={3}
              disabled={zoneTransferDisabled}
            />
            {tsigKeyOptions.length > 0 && (
              <Select
                label={t('common.quickAdd')}
                placeholder={t('zones.selectTsigKeyName')}
                data={tsigKeyOptions}
                value=""
                onChange={v => {
                  if (v) {
                    const list = zoneTransferTsigKeys.split('\n').filter(x => x.trim() !== '');
                    if (!list.includes(v)) {
                      list.push(v);
                      setZoneTransferTsigKeys(list.join('\n'));
                    }
                  }
                }}
                clearable
                searchable
                disabled={zoneTransferDisabled}
              />
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="notify" pt="md">
          <Stack>
            <Select
              label={t('zones.notifyPolicy')}
              data={
                showSeparateCatalogNotify
                  ? NOTIFY_OPTIONS
                  : showNotifyZoneNsOptions
                    ? NOTIFY_OPTIONS.filter(
                        o => o.value !== 'SeparateNameServersForCatalogAndMemberZones'
                      )
                    : NOTIFY_OPTIONS.filter(
                        o =>
                          o.value !== 'ZoneNameServers' &&
                          o.value !== 'BothZoneAndSpecifiedNameServers' &&
                          o.value !== 'SeparateNameServersForCatalogAndMemberZones'
                      )
              }
              value={notify}
              onChange={v => setNotify(v || 'None')}
            />
            <Textarea
              label={t('zones.specifiedNameServers')}
              placeholder={t('zones.enterIpAddresses')}
              value={notifyNameServers}
              onChange={e => setNotifyNameServers(e.target.value)}
              minRows={5}
              disabled={
                ![
                  'SpecifiedNameServers',
                  'BothZoneAndSpecifiedNameServers',
                  'SeparateNameServersForCatalogAndMemberZones',
                ].includes(notify)
              }
            />
            {showSeparateCatalogNotify && (
              <Textarea
                label={t('zones.secondaryCatalogNs')}
                placeholder={t('zones.enterIpAddresses')}
                value={notifySecondaryCatalogNs}
                onChange={e => setNotifySecondaryCatalogNs(e.target.value)}
                minRows={5}
                disabled={notify !== 'SeparateNameServersForCatalogAndMemberZones'}
              />
            )}
            {notifyFailedFor.length > 0 && (
              <Text size="sm" c="yellow">
                {t('zones.notifyFailedNs', { list: notifyFailedFor.join(', ') })}
              </Text>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="dynamicUpdates" pt="md">
          <Stack>
            <Select
              label={t('zones.dynamicUpdatePolicy')}
              data={
                showUpdateZoneNsOptions
                  ? UPDATE_OPTIONS
                  : UPDATE_OPTIONS.filter(
                      o =>
                        o.value !== 'AllowOnlyZoneNameServers' &&
                        o.value !== 'AllowZoneNameServersAndUseSpecifiedNetworkACL'
                    )
              }
              value={update}
              onChange={v => setUpdate(v || 'Deny')}
            />
            <Textarea
              label={t('zones.networkAcl')}
              placeholder={t('common.onePerLine')}
              value={updateAcl}
              onChange={e => setUpdateAcl(e.target.value)}
              minRows={5}
              disabled={
                ![
                  'UseSpecifiedNetworkACL',
                  'AllowZoneNameServersAndUseSpecifiedNetworkACL',
                ].includes(update)
              }
            />

            {(zoneType === 'Primary' || zoneType === 'Forwarder') && (
              <>
                <Text fw={600}>{t('zones.securityPolicy')}</Text>
                <Group>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('zones.tsigKeyName')}</Table.Th>
                        <Table.Th>{t('zones.domainName')}</Table.Th>
                        <Table.Th>{t('zones.allowedRecordTypes')}</Table.Th>
                        <Table.Th style={{ width: 60 }}>
                          <Button size="xs" variant="default" onClick={handleAddSecurityPolicyRow}>
                            {t('common.add')}
                          </Button>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {updateSecurityPolicies.map((policy, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>
                            <Select
                              size="xs"
                              data={tsigKeyOptions}
                              value={policy.tsigKeyName}
                              onChange={v =>
                                setUpdateSecurityPolicies(prev =>
                                  prev.map((p, i) =>
                                    i === index ? { ...p, tsigKeyName: v || '' } : p
                                  )
                                )
                              }
                              clearable
                              searchable
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              size="xs"
                              value={policy.domain}
                              onChange={e =>
                                setUpdateSecurityPolicies(prev =>
                                  prev.map((p, i) =>
                                    i === index ? { ...p, domain: e.target.value } : p
                                  )
                                )
                              }
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              size="xs"
                              value={policy.allowedTypes}
                              onChange={e =>
                                setUpdateSecurityPolicies(prev =>
                                  prev.map((p, i) =>
                                    i === index ? { ...p, allowedTypes: e.target.value } : p
                                  )
                                )
                              }
                            />
                          </Table.Td>
                          <Table.Td>
                            <Button
                              size="xs"
                              color="red"
                              variant="subtle"
                              onClick={() => handleRemoveSecurityPolicyRow(index)}
                            >
                              {t('common.remove')}
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Group>
              </>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Group justify="flex-end" mt="md">
        <Button variant="subtle" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} loading={saving} disabled={loadingOptions || !tab}>
          {t('common.save')}
        </Button>
      </Group>
    </Modal>
  );
}
