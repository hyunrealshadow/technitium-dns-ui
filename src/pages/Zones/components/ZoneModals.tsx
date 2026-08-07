import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Code,
  FileInput,
  Group,
  Modal,
  NumberInput,
  Radio,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';

export function ImportZoneModal({
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
  const [importType, setImportType] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [overwrite, setOverwrite] = useState(true);
  const [overwriteSoaSerial, setOverwriteSoaSerial] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (importType === 'file' && !file) {
      error(t('common.error'), t('zones.importFileRequired'));
      return;
    }
    if (importType === 'text' && !text.trim()) {
      error(t('common.error'), t('zones.importTextRequired'));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (importType === 'file') {
        formData.append('fileImportZone', file!);
      }

      const response = await fetch(
        `/api/zones/import?token=${encodeURIComponent(apiClient.getToken() || '')}&zone=${encodeURIComponent(zone)}&overwrite=${overwrite}&overwriteSoaSerial=${overwriteSoaSerial}`,
        {
          method: 'POST',
          headers: importType === 'text' ? { 'Content-Type': 'text/plain' } : undefined,
          body: importType === 'text' ? text : formData,
        }
      );

      const data = await response.json();
      if (data.status === 'ok') {
        success(t('common.success'), t('zones.zoneImportSuccess'));
        onClose();
        onSuccess();
      } else {
        throw new Error(data.errorMessage || 'Import failed');
      }
    } catch {
      error(t('common.error'), t('zones.zoneImportFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('zones.importZoneTitle', { zone })} size="md">
      <Stack>
        <Group>
          <Radio
            checked={importType === 'file'}
            onChange={() => setImportType('file')}
            label={t('zones.importTypeFile')}
          />
          <Radio
            checked={importType === 'text'}
            onChange={() => setImportType('text')}
            label={t('zones.importTypeText')}
          />
        </Group>

        {importType === 'file' ? (
          <FileInput
            label={t('zones.zoneFileLabel')}
            placeholder={t('zones.importFilePlaceholder')}
            value={file}
            onChange={setFile}
            accept=".zone,.txt"
          />
        ) : (
          <Textarea
            label={t('zones.zoneRecordsLabel')}
            placeholder={t('zones.zoneRecordsPlaceholder')}
            value={text}
            onChange={e => setText(e.target.value)}
            minRows={8}
            autosize
          />
        )}

        <Checkbox
          label={t('zones.overwriteRecords')}
          checked={overwrite}
          onChange={e => setOverwrite(e.currentTarget.checked)}
        />
        <Checkbox
          label={t('zones.overwriteSoaSerial')}
          checked={overwriteSoaSerial}
          onChange={e => setOverwriteSoaSerial(e.currentTarget.checked)}
          disabled={!overwrite}
        />

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleImport} loading={loading}>
            {t('common.import')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function CloneZoneModal({
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
  const [newZone, setNewZone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClone = async () => {
    if (!newZone.trim()) {
      error(t('common.error'), t('zones.newZoneNameRequired'));
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/zones/clone', { zone: newZone, sourceZone: zone });
      success(t('common.success'), t('zones.zoneImportSuccess'));
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), t('zones.cloneFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('zones.cloneZone')} size="md">
      <Stack>
        <TextInput label={t('zones.sourceZone')} value={zone} disabled />
        <TextInput
          label={t('zones.newZoneName')}
          placeholder={t('zones.newZoneNamePlaceholder')}
          value={newZone}
          onChange={e => setNewZone(e.target.value)}
          required
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleClone} loading={loading}>
            {t('zones.cloneZone')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function ConvertZoneModal({
  zone,
  zoneType,
  opened,
  onClose,
  onSuccess,
}: {
  zone: string;
  zoneType: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();

  const availableTypes = (() => {
    switch (zoneType) {
      case 'Primary':
        return ['Forwarder'];
      case 'Secondary':
      case 'SecondaryForwarder':
        return ['Primary', 'Forwarder'];
      case 'Forwarder':
        return ['Primary'];
      case 'SecondaryCatalog':
        return ['Catalog'];
      default:
        return [];
    }
  })();

  const [convertType, setConvertType] = useState(availableTypes[0] || '');
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!convertType) return;
    setLoading(true);
    try {
      await apiClient.post('/zones/convert', { zone, type: convertType });
      success(t('common.success'), t('zones.zoneConverted'));
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), t('zones.zoneConvertFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (availableTypes.length === 0) {
    return (
      <Modal opened={opened} onClose={onClose} title={t('zones.convertZone')} size="sm">
        <Text>{t('zones.convertNotSupported')}</Text>
        <Group justify="flex-end" mt="md">
          <Button onClick={onClose}>{t('common.close')}</Button>
        </Group>
      </Modal>
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('zones.convertZone')} size="sm">
      <Stack>
        <Text fw={500}>{t('zones.convertToType')}</Text>
        {availableTypes.map(type => (
          <Radio
            key={type}
            checked={convertType === type}
            onChange={() => setConvertType(type)}
            label={t(`zones.types.${type}`)}
          />
        ))}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConvert} loading={loading}>
            {t('zones.convertZone')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
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

  const [tab, setTab] = useState('general');

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
      setTab('general');
      try {
        const token = apiClient.getToken();
        const response = await fetch(
          `/api/zones/options/get?token=${encodeURIComponent(token || '')}&zone=${encodeURIComponent(zone)}&includeAvailableCatalogZoneNames=true&includeAvailableTsigKeyNames=true`
        );
        const data = await response.json();
        if (data.status === 'ok' && data.response) {
          const r = data.response;
          setZoneType(r.type || '');
          setCatalog(r.catalog || '');
          setCatalogOptions(
            (r.availableCatalogZoneNames || []).map((n: string) => ({ value: n, label: n }))
          );
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

  const canShowQueryAccessTab = [
    'Primary',
    'Secondary',
    'Stub',
    'Forwarder',
    'SecondaryForwarder',
    'SecondaryCatalog',
    'Catalog',
  ].includes(zoneType);
  const canShowZoneTransferTab = [
    'Primary',
    'Secondary',
    'Forwarder',
    'Catalog',
    'SecondaryCatalog',
  ].includes(zoneType);
  const canShowNotifyTab = ['Primary', 'Secondary', 'Forwarder', 'Catalog'].includes(zoneType);
  const canShowUpdateTab = ['Primary', 'Secondary', 'SecondaryForwarder', 'Forwarder'].includes(
    zoneType
  );

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
      <Tabs value={tab} onChange={v => setTab(v || 'general')}>
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
        <Button onClick={handleSave} loading={saving}>
          {t('common.save')}
        </Button>
      </Group>
    </Modal>
  );
}

export function SignZoneModal({
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
  const [algorithm, setAlgorithm] = useState('ECDSA');
  const [hashAlgorithm, setHashAlgorithm] = useState('SHA256');
  const [curve, setCurve] = useState('P256');
  const [kskKeySize, setKskKeySize] = useState(2048);
  const [zskKeySize, setZskKeySize] = useState(1024);
  const [pemKsk, setPemKsk] = useState('');
  const [pemZsk, setPemZsk] = useState('');
  const [nxProof, setNxProof] = useState<'NSEC' | 'NSEC3'>('NSEC');
  const [iterations, setIterations] = useState(0);
  const [saltLength, setSaltLength] = useState(0);
  const [dnsKeyTtl, setDnsKeyTtl] = useState('3600');
  const [zskRolloverDays, setZskRolloverDays] = useState(30);
  const [saving, setSaving] = useState(false);

  const handleSign = async () => {
    setSaving(true);
    try {
      const params: Record<string, unknown> = {
        zone,
        algorithm,
        nxProof,
        dnsKeyTtl,
        zskRolloverDays: pemZsk ? 0 : zskRolloverDays,
      };
      if (algorithm === 'RSA') {
        params.hashAlgorithm = hashAlgorithm;
        if (pemKsk) params.pemKskPrivateKey = pemKsk;
        else params.kskKeySize = kskKeySize;
        if (pemZsk) params.pemZskPrivateKey = pemZsk;
        else params.zskKeySize = zskKeySize;
      } else {
        params.curve = curve;
        if (pemKsk) params.pemKskPrivateKey = pemKsk;
        if (pemZsk) params.pemZskPrivateKey = pemZsk;
      }
      if (nxProof === 'NSEC3') {
        params.iterations = iterations;
        params.saltLength = saltLength;
      }
      await apiClient.post('/zones/dnssec/sign', params);
      success(t('common.success'), t('zones.zoneSigned'));
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), t('zones.signFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`${t('zones.signZone')}: ${zone}`} size="lg">
      <Stack>
        <Select
          label={t('zones.algorithm')}
          data={['RSA', 'ECDSA', 'EDDSA']}
          value={algorithm}
          onChange={v => setAlgorithm(v || 'ECDSA')}
        />

        {algorithm === 'RSA' && (
          <>
            <Select
              label={t('zones.hashAlgorithm')}
              data={['SHA1', 'SHA256', 'SHA512']}
              value={hashAlgorithm}
              onChange={v => setHashAlgorithm(v || 'SHA256')}
            />
            <NumberInput
              label={t('zones.kskKeySize')}
              value={kskKeySize}
              onChange={v => setKskKeySize(Number(v))}
              min={1024}
              max={4096}
              disabled={!!pemKsk}
            />
            <NumberInput
              label={t('zones.zskKeySize')}
              value={zskKeySize}
              onChange={v => setZskKeySize(Number(v))}
              min={512}
              max={2048}
              disabled={!!pemZsk}
            />
          </>
        )}

        {algorithm === 'ECDSA' && (
          <Select
            label={t('zones.curve')}
            data={['P256', 'P384']}
            value={curve}
            onChange={v => setCurve(v || 'P256')}
          />
        )}

        {algorithm === 'EDDSA' && (
          <Select
            label={t('zones.curve')}
            data={['ED25519', 'ED448']}
            value={curve}
            onChange={v => setCurve(v || 'ED25519')}
          />
        )}

        <Textarea
          label={t('zones.kskPrivateKey')}
          placeholder={t('zones.pemPlaceholder')}
          value={pemKsk}
          onChange={e => setPemKsk(e.target.value)}
          minRows={3}
          autosize
        />
        <Textarea
          label={t('zones.zskPrivateKey')}
          placeholder={t('zones.pemPlaceholder')}
          value={pemZsk}
          onChange={e => setPemZsk(e.target.value)}
          minRows={3}
          autosize
        />

        <NumberInput
          label={t('zones.zskAutoRollover')}
          value={zskRolloverDays}
          onChange={v => setZskRolloverDays(Number(v))}
          min={0}
          max={365}
          disabled={!!pemZsk}
        />
        <TextInput
          label={t('zones.dnskeyTtl')}
          placeholder="3600"
          value={dnsKeyTtl}
          onChange={e => setDnsKeyTtl(e.target.value)}
        />

        <Group>
          <Radio checked={nxProof === 'NSEC'} onChange={() => setNxProof('NSEC')} label="NSEC" />
          <Radio checked={nxProof === 'NSEC3'} onChange={() => setNxProof('NSEC3')} label="NSEC3" />
        </Group>

        {nxProof === 'NSEC3' && (
          <>
            <NumberInput
              label={t('zones.iterations')}
              value={iterations}
              onChange={v => setIterations(Number(v))}
              min={0}
              max={100}
            />
            <NumberInput
              label={t('zones.saltLength')}
              value={saltLength}
              onChange={v => setSaltLength(Number(v))}
              min={0}
              max={64}
            />
          </>
        )}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSign} loading={saving}>
            {t('zones.signZone')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function UnsignZoneModal({
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

  const handleUnsign = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/unsign', { zone });
      success(t('common.success'), t('zones.zoneUnsignSuccess'));
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), t('zones.zoneUnsignFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`${t('zones.unsignZone')}: ${zone}`} size="sm">
      <Stack>
        <Text>{t('zones.unsignConfirm', { zone })}</Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button color="red" onClick={handleUnsign} loading={saving}>
            {t('zones.unsignZone')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function ViewDsModal({
  zone,
  opened,
  onClose,
}: {
  zone: string;
  opened: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [dsData, setDsData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!opened) return;
    const load = async () => {
      setDsData(null);
      try {
        const token = apiClient.getToken();
        const response = await fetch(
          `/api/zones/dnssec/viewDS?token=${encodeURIComponent(token || '')}&zone=${encodeURIComponent(zone)}`
        );
        const data = await response.json();
        if (data.status === 'ok') setDsData(data.response);
        else setDsData({});
      } catch {
        setDsData({});
      }
    };
    load();
  }, [opened, zone]);

  const dsRecords = (dsData?.dsRecords as Array<Record<string, unknown>>) || [];

  return (
    <Modal opened={opened} onClose={onClose} title={`${t('zones.viewDsInfo')}: ${zone}`} size="lg">
      {dsData === null ? (
        <Text>{t('common.loading')}</Text>
      ) : dsRecords.length === 0 ? (
        <Text>{t('zones.noDsRecords')}</Text>
      ) : (
        <Stack>
          {dsRecords.map((ds, i) => (
            <Stack key={i} gap="xs">
              <Text fw={600}>
                {t('zones.keyTag')}: {String(ds.keyTag)}
              </Text>
              <Text size="sm">
                {t('zones.algorithm')}: {ds.algorithm as string} ({String(ds.algorithmNumber)})
              </Text>
              <Text size="sm">
                {t('zones.state')}: {ds.dnsKeyState as string}
              </Text>
              {(ds.digests as Array<Record<string, string>>)?.map((digest, j) => (
                <Stack key={j} gap={2}>
                  <Text size="sm">
                    {t('zones.digestType')}: {digest.digestType}
                  </Text>
                  <Code block>{digest.digest}</Code>
                </Stack>
              ))}
            </Stack>
          ))}
        </Stack>
      )}
      <Group justify="flex-end" mt="md">
        <Button onClick={onClose}>{t('common.close')}</Button>
      </Group>
    </Modal>
  );
}

export function DnssecPropertiesModal({
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
  const [zoneProps, setZoneProps] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [dnsKeyTtl, setDnsKeyTtl] = useState('3600');
  const [nsec3Iterations, setNsec3Iterations] = useState(0);
  const [nsec3SaltLength, setNsec3SaltLength] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setLoading(true);
    const load = async () => {
      try {
        const token = apiClient.getToken();
        const response = await fetch(
          `/api/zones/dnssec/properties/get?token=${encodeURIComponent(token || '')}&zone=${encodeURIComponent(zone)}`
        );
        const data = await response.json();
        if (data.status === 'ok' && data.response) {
          setZoneProps(data.response);
          setDnsKeyTtl(String(data.response.dnsKeyTtl || 3600));
          setNsec3Iterations(data.response.nsec3Iterations || 0);
          setNsec3SaltLength(data.response.nsec3SaltLength || 0);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    };
    load();
  }, [opened, zone]);

  const dnssecStatusStr = zoneProps?.dnssecStatus as string | undefined;
  const privateKeys = (zoneProps?.dnssecPrivateKeys as Array<Record<string, unknown>>) || [];
  const isNsec3 = dnssecStatusStr === 'SignedWithNSEC3';

  const handleUpdateDnsKeyTtl = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/updateDnsKeyTtl', {
        zone,
        dnsKeyTtl: Number(dnsKeyTtl),
      });
      success(t('common.success'), t('zones.dnskeyTtlUpdated'));
      await onSuccess();
    } catch {
      error(t('common.error'), t('zones.dnskeyTtlUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleConvertNsec3 = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/convertToNSEC3', {
        zone,
        iterations: nsec3Iterations,
        saltLength: nsec3SaltLength,
      });
      success(t('common.success'), t('zones.convertedToNsec3'));
      await onSuccess();
    } catch {
      error(t('common.error'), t('zones.convertToNsec3Failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleConvertNsec = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/convertToNSEC', { zone });
      success(t('common.success'), t('zones.convertedToNsec'));
      await onSuccess();
    } catch {
      error(t('common.error'), t('zones.convertToNsecFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNsec3Params = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/updateNSEC3Params', {
        zone,
        iterations: nsec3Iterations,
        saltLength: nsec3SaltLength,
      });
      success(t('common.success'), t('zones.nsec3ParamsUpdated'));
      await onSuccess();
    } catch {
      error(t('common.error'), t('zones.nsec3ParamsUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePublishAllKeys = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/publishAllPrivateKeys', { zone });
      success(t('common.success'), t('zones.privateKeysPublished'));
      await onSuccess();
    } catch {
      error(t('common.error'), t('zones.publishKeysFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${t('zones.dnssecProperties')}: ${zone}`}
      size="lg"
    >
      {loading ? (
        <Text>{t('common.loading')}</Text>
      ) : zoneProps ? (
        <Stack>
          <Text size="sm">
            {t('zones.statusColumn')}: <Code>{dnssecStatusStr || 'N/A'}</Code> |{' '}
            {t('zones.dnskeyTtl')}: <Code>{String(zoneProps?.dnsKeyTtl ?? 'N/A')}</Code>
          </Text>

          <TextInput
            label={t('zones.dnskeyTtl')}
            value={dnsKeyTtl}
            onChange={e => setDnsKeyTtl(e.target.value)}
          />
          <Group>
            <Button size="sm" onClick={handleUpdateDnsKeyTtl} loading={saving}>
              {t('zones.updateDnskeyTtl')}
            </Button>
          </Group>

          {isNsec3 ? (
            <Stack>
              <NumberInput
                label={t('zones.nsec3Iterations')}
                value={nsec3Iterations}
                onChange={v => setNsec3Iterations(Number(v))}
                min={0}
              />
              <NumberInput
                label={t('zones.nsec3SaltLength')}
                value={nsec3SaltLength}
                onChange={v => setNsec3SaltLength(Number(v))}
                min={0}
              />
              <Group>
                <Button size="sm" onClick={handleUpdateNsec3Params} loading={saving}>
                  {t('zones.updateNsec3Params')}
                </Button>
                <Button size="sm" variant="default" onClick={handleConvertNsec} loading={saving}>
                  {t('zones.convertToNsec')}
                </Button>
              </Group>
            </Stack>
          ) : (
            <Stack>
              <NumberInput
                label={t('zones.nsec3Iterations')}
                value={nsec3Iterations}
                onChange={v => setNsec3Iterations(Number(v))}
                min={0}
              />
              <NumberInput
                label={t('zones.nsec3SaltLength')}
                value={nsec3SaltLength}
                onChange={v => setNsec3SaltLength(Number(v))}
                min={0}
              />
              <Button
                size="sm"
                variant="default"
                onClick={handleConvertNsec3}
                loading={saving}
                style={{ alignSelf: 'flex-start' }}
              >
                {t('zones.convertToNsec3')}
              </Button>
            </Stack>
          )}

          <Text fw={600} mt="md">
            {t('zones.privateKeys', { count: privateKeys.length })}
          </Text>
          {privateKeys.length > 0 ? (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('zones.keyTag')}</Table.Th>
                  <Table.Th>{t('zones.type')}</Table.Th>
                  <Table.Th>{t('zones.algorithm')}</Table.Th>
                  <Table.Th>{t('zones.state')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {privateKeys.map((key, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{String(key.keyTag)}</Table.Td>
                    <Table.Td>{key.keyType as string}</Table.Td>
                    <Table.Td>{key.algorithm as string}</Table.Td>
                    <Table.Td>{key.state as string}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text c="dimmed" size="sm">
              {t('zones.noPrivateKeys')}
            </Text>
          )}

          <Button variant="default" onClick={handlePublishAllKeys} loading={saving}>
            {t('zones.publishAllPrivateKeys')}
          </Button>
        </Stack>
      ) : (
        <Text c="dimmed">{t('zones.propertiesLoadFailed')}</Text>
      )}
      <Group justify="flex-end" mt="md">
        <Button onClick={onClose}>{t('common.close')}</Button>
      </Group>
    </Modal>
  );
}

export function PermissionsModal({
  zone,
  opened,
  onClose,
}: {
  zone: string;
  opened: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [userPerms, setUserPerms] = useState<
    Array<{ username: string; canView: boolean; canModify: boolean; canDelete: boolean }>
  >([]);
  const [groupPerms, setGroupPerms] = useState<
    Array<{ name: string; canView: boolean; canModify: boolean; canDelete: boolean }>
  >([]);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setLoading(true);
    const load = async () => {
      try {
        const token = apiClient.getToken();
        const response = await fetch(
          `/api/zones/permissions/get?token=${encodeURIComponent(token || '')}&zone=${encodeURIComponent(zone)}&includeUsersAndGroups=true`
        );
        const data = await response.json();
        if (data.status === 'ok' && data.response) {
          setUserPerms(data.response.userPermissions || []);
          setGroupPerms(data.response.groupPermissions || []);
          setAvailableUsers(data.response.users || []);
          setAvailableGroups(data.response.groups || []);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    };
    load();
  }, [opened, zone]);

  const toggleUserPerm = (username: string, field: 'canView' | 'canModify' | 'canDelete') => {
    setUserPerms(prev =>
      prev.map(p => (p.username === username ? { ...p, [field]: !p[field] } : p))
    );
  };

  const toggleGroupPerm = (name: string, field: 'canView' | 'canModify' | 'canDelete') => {
    setGroupPerms(prev => prev.map(p => (p.name === name ? { ...p, [field]: !p[field] } : p)));
  };

  const addUserPerm = (username: string) => {
    if (username && !userPerms.find(p => p.username === username)) {
      setUserPerms(prev => [
        ...prev,
        { username, canView: true, canModify: false, canDelete: false },
      ]);
    }
  };

  const addGroupPerm = (name: string) => {
    if (name && !groupPerms.find(p => p.name === name)) {
      setGroupPerms(prev => [...prev, { name, canView: true, canModify: false, canDelete: false }]);
    }
  };

  const removeUserPerm = (username: string) => {
    setUserPerms(prev => prev.filter(p => p.username !== username));
  };

  const removeGroupPerm = (name: string) => {
    setGroupPerms(prev => prev.filter(p => p.name !== name));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userPermissions = userPerms
        .map(p => `${p.username}|${p.canView}|${p.canModify}|${p.canDelete}`)
        .join('|');
      const groupPermissions = groupPerms
        .map(p => `${p.name}|${p.canView}|${p.canModify}|${p.canDelete}`)
        .join('|');
      await apiClient.post('/zones/permissions/set', { zone, userPermissions, groupPermissions });
      success(t('common.success'), t('zones.permissionsUpdated'));
      onClose();
    } catch {
      error(t('common.error'), t('zones.permissionsUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const [newUser, setNewUser] = useState('');
  const [newGroup, setNewGroup] = useState('');

  if (loading) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title={t('zones.permissionsTitle', { zone })}
        size="lg"
      >
        <Text>{t('common.loading')}</Text>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('zones.permissionsTitle', { zone })}
      size="lg"
    >
      <Stack>
        <Text fw={600}>{t('zones.userPermissions')}</Text>
        <Group>
          <Select
            data={availableUsers.filter(u => !userPerms.find(p => p.username === u))}
            value={newUser}
            onChange={v => {
              if (v) {
                addUserPerm(v);
                setNewUser('');
              }
            }}
            placeholder={t('zones.addUserPlaceholder')}
            clearable
            searchable
          />
        </Group>
        {userPerms.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.user')}</Table.Th>
                <Table.Th>{t('common.view')}</Table.Th>
                <Table.Th>{t('common.modify')}</Table.Th>
                <Table.Th>{t('common.delete')}</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {userPerms.map(p => (
                <Table.Tr key={p.username}>
                  <Table.Td>{p.username}</Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canView}
                      onChange={() => toggleUserPerm(p.username, 'canView')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canModify}
                      onChange={() => toggleUserPerm(p.username, 'canModify')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canDelete}
                      onChange={() => toggleUserPerm(p.username, 'canDelete')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => removeUserPerm(p.username)}
                    >
                      {t('common.remove')}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" size="sm">
            {t('zones.noUserPermissions')}
          </Text>
        )}

        <Text fw={600} mt="md">
          {t('zones.groupPermissions')}
        </Text>
        <Group>
          <Select
            data={availableGroups.filter(g => !groupPerms.find(p => p.name === g))}
            value={newGroup}
            onChange={v => {
              if (v) {
                addGroupPerm(v);
                setNewGroup('');
              }
            }}
            placeholder={t('zones.addGroupPlaceholder')}
            clearable
            searchable
          />
        </Group>
        {groupPerms.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.group')}</Table.Th>
                <Table.Th>{t('common.view')}</Table.Th>
                <Table.Th>{t('common.modify')}</Table.Th>
                <Table.Th>{t('common.delete')}</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {groupPerms.map(p => (
                <Table.Tr key={p.name}>
                  <Table.Td>{p.name}</Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canView}
                      onChange={() => toggleGroupPerm(p.name, 'canView')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canModify}
                      onChange={() => toggleGroupPerm(p.name, 'canModify')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canDelete}
                      onChange={() => toggleGroupPerm(p.name, 'canDelete')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => removeGroupPerm(p.name)}
                    >
                      {t('common.remove')}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" size="sm">
            {t('zones.noGroupPermissions')}
          </Text>
        )}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
