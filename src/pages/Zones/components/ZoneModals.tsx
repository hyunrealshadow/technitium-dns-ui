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
      error(t('common.error'), 'Please select a zone file');
      return;
    }
    if (importType === 'text' && !text.trim()) {
      error(t('common.error'), 'Please enter zone records');
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
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${t('common.import')} Zone: ${zone}`}
      size="md"
    >
      <Stack>
        <Radio.Group value={importType} onChange={v => setImportType(v as 'file' | 'text')}>
          <Group>
            <Radio value="file" label="File" />
            <Radio value="text" label="Text" />
          </Group>
        </Radio.Group>

        {importType === 'file' ? (
          <FileInput
            label="Zone File"
            placeholder="Select .zone file"
            value={file}
            onChange={setFile}
            accept=".zone,.txt"
          />
        ) : (
          <Textarea
            label="Zone Records"
            placeholder="Paste zone file content..."
            value={text}
            onChange={e => setText(e.target.value)}
            minRows={8}
            autosize
          />
        )}

        <Checkbox
          label="Overwrite existing records"
          checked={overwrite}
          onChange={e => setOverwrite(e.currentTarget.checked)}
        />
        <Checkbox
          label="Overwrite SOA serial"
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
      error(t('common.error'), 'Please enter a new zone name');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/zones/clone', { zone: newZone, sourceZone: zone });
      success(t('common.success'), t('zones.zoneImportSuccess'));
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), 'Failed to clone zone');
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
          placeholder="newzone.com"
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
        <Text>This zone type cannot be converted.</Text>
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
        <Radio.Group value={convertType} onChange={setConvertType}>
          <Stack>
            {availableTypes.map(t => (
              <Radio
                key={t}
                value={t}
                label={t === 'Forwarder' ? 'Forwarder' : t === 'Catalog' ? 'Catalog' : t}
              />
            ))}
          </Stack>
        </Radio.Group>
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

  // General
  const [disabled, setDisabled] = useState(false);
  const [catalog, setCatalog] = useState('');
  const [overrideQueryAccess, setOverrideQueryAccess] = useState(false);
  const [overrideZoneTransfer, setOverrideZoneTransfer] = useState(false);
  const [overrideNotify, setOverrideNotify] = useState(false);
  const [primaryNsAddresses, setPrimaryNsAddresses] = useState('');
  const [primaryZoneTransferProtocol, setPrimaryZoneTransferProtocol] = useState('Tcp');
  const [primaryZoneTransferTsigKeyName, setPrimaryZoneTransferTsigKeyName] = useState('');
  const [validateZone, setValidateZone] = useState(false);

  // Query Access
  const [queryAccess, setQueryAccess] = useState('Allow');
  const [queryAccessAcl, setQueryAccessAcl] = useState('');

  // Zone Transfer
  const [zoneTransfer, setZoneTransfer] = useState('Deny');
  const [zoneTransferAcl, setZoneTransferAcl] = useState('');
  const [zoneTransferTsigKeys, setZoneTransferTsigKeys] = useState('');

  // Notify
  const [notify, setNotify] = useState('Never');
  const [notifyNameServers, setNotifyNameServers] = useState('');

  // Dynamic Updates
  const [update, setUpdate] = useState('Deny');
  const [updateAcl, setUpdateAcl] = useState('');

  const [tab, setTab] = useState('general');

  const QUERY_ACCESS_OPTIONS = [
    { value: 'Allow', label: 'Allow' },
    { value: 'AllowOnlyPrivateNetworks', label: 'Allow Only Private Networks' },
    { value: 'AllowOnlyZoneNameServers', label: 'Allow Only Zone Name Servers' },
    { value: 'UseSpecifiedNetworkACL', label: 'Use Specified Network ACL' },
    {
      value: 'AllowZoneNameServersAndUseSpecifiedNetworkACL',
      label: 'Allow Zone NS And Specified ACL',
    },
    { value: 'Deny', label: 'Deny' },
  ];

  const ZONE_TRANSFER_OPTIONS = [
    { value: 'Deny', label: 'Deny' },
    { value: 'AllowOnlyZoneNameServers', label: 'Allow Only Zone Name Servers' },
    { value: 'UseSpecifiedNetworkACL', label: 'Use Specified Network ACL' },
    {
      value: 'AllowZoneNameServersAndUseSpecifiedNetworkACL',
      label: 'Allow Zone NS And Specified ACL',
    },
  ];

  const NOTIFY_OPTIONS = [
    { value: 'Never', label: 'Never' },
    { value: 'Always', label: 'Always' },
    { value: 'SpecifiedNameServers', label: 'Specified Name Servers' },
    { value: 'BothZoneAndSpecifiedNameServers', label: 'Zone NS & Specified' },
    {
      value: 'SeparateNameServersForCatalogAndMemberZones',
      label: 'Separate NS For Catalog & Member',
    },
  ];

  const UPDATE_OPTIONS = [
    { value: 'Deny', label: 'Deny' },
    { value: 'AllowOnlyZoneNameServers', label: 'Allow Only Zone Name Servers' },
    { value: 'UseSpecifiedNetworkACL', label: 'Use Specified Network ACL' },
    {
      value: 'AllowZoneNameServersAndUseSpecifiedNetworkACL',
      label: 'Allow Zone NS And Specified ACL',
    },
  ];

  useEffect(() => {
    if (!opened) return;
    const load = async () => {
      try {
        const token = apiClient.getToken();
        const response = await fetch(
          `/api/zones/options/get?token=${encodeURIComponent(token || '')}&zone=${encodeURIComponent(zone)}&includeAvailableCatalogZoneNames=true&includeAvailableTsigKeyNames=true`
        );
        const data = await response.json();
        if (data.status === 'ok' && data.response) {
          const r = data.response;
          setDisabled(r.disabled || false);
          setCatalog(r.catalog || '');
          setOverrideQueryAccess(r.overrideCatalogQueryAccess || false);
          setOverrideZoneTransfer(r.overrideCatalogZoneTransfer || false);
          setOverrideNotify(r.overrideCatalogNotify || false);
          setPrimaryNsAddresses((r.primaryNameServerAddresses || []).join('\n'));
          setPrimaryZoneTransferProtocol(r.primaryZoneTransferProtocol || 'Tcp');
          setPrimaryZoneTransferTsigKeyName(r.primaryZoneTransferTsigKeyName || '');
          setValidateZone(r.validateZone || false);
          setQueryAccess(r.queryAccess || 'Allow');
          setQueryAccessAcl((r.queryAccessNetworkACL || []).join('\n'));
          setZoneTransfer(r.zoneTransfer || 'Deny');
          setZoneTransferAcl((r.zoneTransferNetworkACL || []).join('\n'));
          setZoneTransferTsigKeys((r.zoneTransferTsigKeyNames || []).join('\n'));
          setNotify(r.notify || 'Never');
          setNotifyNameServers((r.notifyNameServers || []).join('\n'));
          setUpdate(r.update || 'Deny');
          setUpdateAcl((r.updateNetworkACL || []).join('\n'));
        }
      } catch {
        error(t('common.error'), 'Failed to load zone options');
      }
    };
    load();
  }, [opened, zone, t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const params: Record<string, unknown> = { zone };
      if (disabled) params.disabled = true;

      if (catalog) params.catalog = catalog;
      else params.catalog = '';

      params.overrideCatalogQueryAccess = overrideQueryAccess;
      params.overrideCatalogZoneTransfer = overrideZoneTransfer;
      params.overrideCatalogNotify = overrideNotify;
      params.queryAccess = queryAccess;
      params.queryAccessNetworkACL = queryAccessAcl || 'false';
      params.zoneTransfer = zoneTransfer;
      params.zoneTransferNetworkACL = zoneTransferAcl || 'false';
      params.zoneTransferTsigKeyNames = zoneTransferTsigKeys || 'false';
      params.notify = notify;
      params.notifyNameServers = notifyNameServers || 'false';
      params.update = update;
      params.updateNetworkACL = updateAcl || 'false';

      await apiClient.post('/zones/options/set', params);
      success(t('common.success'), 'Zone options saved');
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), 'Failed to save zone options');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`${t('zones.zoneOptions')}: ${zone}`} size="lg">
      <Stack>
        <Select
          data={[
            { value: 'general', label: t('zones.general') },
            { value: 'queryAccess', label: t('zones.queryAccess') },
            { value: 'zoneTransfer', label: t('zones.zoneTransfer') },
            { value: 'notify', label: t('zones.notify') },
            { value: 'dynamicUpdates', label: t('zones.dynamicUpdates') },
          ]}
          value={tab}
          onChange={v => setTab(v || 'general')}
        />

        {tab === 'general' && (
          <Stack>
            <Checkbox
              label="Disabled"
              checked={disabled}
              onChange={e => setDisabled(e.currentTarget.checked)}
            />
            <TextInput
              label="Catalog Zone"
              placeholder="Optional"
              value={catalog}
              onChange={e => setCatalog(e.target.value)}
            />
            <Checkbox
              label="Override Catalog Query Access"
              checked={overrideQueryAccess}
              onChange={e => setOverrideQueryAccess(e.currentTarget.checked)}
            />
            <Checkbox
              label="Override Catalog Zone Transfer"
              checked={overrideZoneTransfer}
              onChange={e => setOverrideZoneTransfer(e.currentTarget.checked)}
            />
            <Checkbox
              label="Override Catalog Notify"
              checked={overrideNotify}
              onChange={e => setOverrideNotify(e.currentTarget.checked)}
            />
            <Textarea
              label="Primary Name Server Addresses"
              placeholder="One per line"
              value={primaryNsAddresses}
              onChange={e => setPrimaryNsAddresses(e.target.value)}
              minRows={3}
            />
            <Select
              label="Zone Transfer Protocol"
              data={['Tcp', 'Tls', 'Quic'].map(v => ({ value: v, label: v }))}
              value={primaryZoneTransferProtocol}
              onChange={v => setPrimaryZoneTransferProtocol(v || 'Tcp')}
            />
            <TextInput
              label="TSIG Key Name"
              placeholder="Optional"
              value={primaryZoneTransferTsigKeyName}
              onChange={e => setPrimaryZoneTransferTsigKeyName(e.target.value)}
            />
            <Checkbox
              label="Validate Zone"
              checked={validateZone}
              onChange={e => setValidateZone(e.currentTarget.checked)}
            />
          </Stack>
        )}

        {tab === 'queryAccess' && (
          <Stack>
            <Select
              label="Query Access Policy"
              data={QUERY_ACCESS_OPTIONS}
              value={queryAccess}
              onChange={v => setQueryAccess(v || 'Allow')}
            />
            <Textarea
              label="Network ACL"
              placeholder="One per line (e.g. 10.0.0.0/8)"
              value={queryAccessAcl}
              onChange={e => setQueryAccessAcl(e.target.value)}
              minRows={3}
              disabled={
                ![
                  'UseSpecifiedNetworkACL',
                  'AllowZoneNameServersAndUseSpecifiedNetworkACL',
                ].includes(queryAccess)
              }
            />
          </Stack>
        )}

        {tab === 'zoneTransfer' && (
          <Stack>
            <Select
              label="Zone Transfer Policy"
              data={ZONE_TRANSFER_OPTIONS}
              value={zoneTransfer}
              onChange={v => setZoneTransfer(v || 'Deny')}
            />
            <Textarea
              label="Network ACL"
              placeholder="One per line"
              value={zoneTransferAcl}
              onChange={e => setZoneTransferAcl(e.target.value)}
              minRows={3}
              disabled={
                ![
                  'UseSpecifiedNetworkACL',
                  'AllowZoneNameServersAndUseSpecifiedNetworkACL',
                ].includes(zoneTransfer)
              }
            />
            <Textarea
              label="TSIG Key Names"
              placeholder="One per line"
              value={zoneTransferTsigKeys}
              onChange={e => setZoneTransferTsigKeys(e.target.value)}
              minRows={3}
            />
          </Stack>
        )}

        {tab === 'notify' && (
          <Stack>
            <Select
              label="Notify Policy"
              data={NOTIFY_OPTIONS}
              value={notify}
              onChange={v => setNotify(v || 'Never')}
            />
            <Textarea
              label="Notify Name Servers"
              placeholder="One per line"
              value={notifyNameServers}
              onChange={e => setNotifyNameServers(e.target.value)}
              minRows={3}
              disabled={notify === 'Never'}
            />
          </Stack>
        )}

        {tab === 'dynamicUpdates' && (
          <Stack>
            <Select
              label="Dynamic Update Policy"
              data={UPDATE_OPTIONS}
              value={update}
              onChange={v => setUpdate(v || 'Deny')}
            />
            <Textarea
              label="Network ACL"
              placeholder="One per line"
              value={updateAcl}
              onChange={e => setUpdateAcl(e.target.value)}
              minRows={3}
              disabled={
                ![
                  'UseSpecifiedNetworkACL',
                  'AllowZoneNameServersAndUseSpecifiedNetworkACL',
                ].includes(update)
              }
            />
          </Stack>
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
      success(t('common.success'), 'Zone signed successfully');
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), 'Failed to sign zone');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`Sign Zone: ${zone}`} size="lg">
      <Stack>
        <Select
          label="Algorithm"
          data={['RSA', 'ECDSA', 'EDDSA']}
          value={algorithm}
          onChange={v => setAlgorithm(v || 'ECDSA')}
        />

        {algorithm === 'RSA' && (
          <>
            <Select
              label="Hash Algorithm"
              data={['SHA1', 'SHA256', 'SHA512']}
              value={hashAlgorithm}
              onChange={v => setHashAlgorithm(v || 'SHA256')}
            />
            <NumberInput
              label="KSK Key Size"
              value={kskKeySize}
              onChange={v => setKskKeySize(Number(v))}
              min={1024}
              max={4096}
              disabled={!!pemKsk}
            />
            <NumberInput
              label="ZSK Key Size"
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
            label="Curve"
            data={['P256', 'P384']}
            value={curve}
            onChange={v => setCurve(v || 'P256')}
          />
        )}

        {algorithm === 'EDDSA' && (
          <Select
            label="Curve"
            data={['ED25519', 'ED448']}
            value={curve}
            onChange={v => setCurve(v || 'ED25519')}
          />
        )}

        <Textarea
          label="KSK Private Key (PEM, optional)"
          placeholder="Paste PEM private key..."
          value={pemKsk}
          onChange={e => setPemKsk(e.target.value)}
          minRows={3}
          autosize
        />
        <Textarea
          label="ZSK Private Key (PEM, optional)"
          placeholder="Paste PEM private key..."
          value={pemZsk}
          onChange={e => setPemZsk(e.target.value)}
          minRows={3}
          autosize
        />

        <NumberInput
          label="ZSK Auto Rollover (days)"
          value={zskRolloverDays}
          onChange={v => setZskRolloverDays(Number(v))}
          min={0}
          max={365}
          disabled={!!pemZsk}
        />
        <TextInput
          label="DNSKEY TTL"
          placeholder="3600"
          value={dnsKeyTtl}
          onChange={e => setDnsKeyTtl(e.target.value)}
        />

        <Radio.Group value={nxProof} onChange={v => setNxProof(v as 'NSEC' | 'NSEC3')}>
          <Group>
            <Radio value="NSEC" label="NSEC" />
            <Radio value="NSEC3" label="NSEC3" />
          </Group>
        </Radio.Group>

        {nxProof === 'NSEC3' && (
          <>
            <NumberInput
              label="Iterations"
              value={iterations}
              onChange={v => setIterations(Number(v))}
              min={0}
              max={100}
            />
            <NumberInput
              label="Salt Length (bytes)"
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
            Sign Zone
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
  const [saving, setSaving] = useState(false);

  const handleUnsign = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/unsign', { zone });
      success('Success', 'Zone unsigned successfully');
      onClose();
      onSuccess();
    } catch {
      error('Error', 'Failed to unsign zone');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`Unsign Zone: ${zone}`} size="sm">
      <Stack>
        <Text>
          {`Are you sure you want to unsign the zone "${zone}"? This will remove all DNSSEC signatures and records.`}
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleUnsign} loading={saving}>
            Unsign Zone
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
    <Modal opened={opened} onClose={onClose} title={`DS Info: ${zone}`} size="lg">
      {dsData === null ? (
        <Text>Loading...</Text>
      ) : dsRecords.length === 0 ? (
        <Text>No DS records found.</Text>
      ) : (
        <Stack>
          {dsRecords.map((ds, i) => (
            <Stack key={i} gap="xs">
              <Text fw={600}>Key Tag: {String(ds.keyTag)}</Text>
              <Text size="sm">
                Algorithm: {ds.algorithm as string} ({String(ds.algorithmNumber)})
              </Text>
              <Text size="sm">State: {ds.dnsKeyState as string}</Text>
              {(ds.digests as Array<Record<string, string>>)?.map((digest, j) => (
                <Stack key={j} gap={2}>
                  <Text size="sm">Digest Type: {digest.digestType}</Text>
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
      success(t('common.success'), 'DNSKEY TTL updated');
      await onSuccess();
    } catch {
      error(t('common.error'), 'Failed to update DNSKEY TTL');
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
      success(t('common.success'), 'Converted to NSEC3');
      await onSuccess();
    } catch {
      error(t('common.error'), 'Failed to convert to NSEC3');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertNsec = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/convertToNSEC', { zone });
      success(t('common.success'), 'Converted to NSEC');
      await onSuccess();
    } catch {
      error(t('common.error'), 'Failed to convert to NSEC');
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
      success(t('common.success'), 'NSEC3 parameters updated');
      await onSuccess();
    } catch {
      error(t('common.error'), 'Failed to update NSEC3 parameters');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishAllKeys = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/publishAllPrivateKeys', { zone });
      success(t('common.success'), 'All private keys published');
      await onSuccess();
    } catch {
      error(t('common.error'), 'Failed to publish keys');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`DNSSEC Properties: ${zone}`} size="lg">
      {loading ? (
        <Text>{t('common.loading')}</Text>
      ) : zoneProps ? (
        <Stack>
          <Text size="sm">
            Status: <Code>{dnssecStatusStr || 'N/A'}</Code> | DNSKEY TTL:{' '}
            <Code>{String(zoneProps?.dnsKeyTtl ?? 'N/A')}</Code>
          </Text>

          <TextInput
            label="DNSKEY TTL"
            value={dnsKeyTtl}
            onChange={e => setDnsKeyTtl(e.target.value)}
          />
          <Group>
            <Button size="sm" onClick={handleUpdateDnsKeyTtl} loading={saving}>
              Update DNSKEY TTL
            </Button>
          </Group>

          {isNsec3 ? (
            <Stack>
              <NumberInput
                label="NSEC3 Iterations"
                value={nsec3Iterations}
                onChange={v => setNsec3Iterations(Number(v))}
                min={0}
              />
              <NumberInput
                label="NSEC3 Salt Length"
                value={nsec3SaltLength}
                onChange={v => setNsec3SaltLength(Number(v))}
                min={0}
              />
              <Group>
                <Button size="sm" onClick={handleUpdateNsec3Params} loading={saving}>
                  Update NSEC3 Params
                </Button>
                <Button size="sm" variant="default" onClick={handleConvertNsec} loading={saving}>
                  Convert to NSEC
                </Button>
              </Group>
            </Stack>
          ) : (
            <Stack>
              <NumberInput
                label="NSEC3 Iterations"
                value={nsec3Iterations}
                onChange={v => setNsec3Iterations(Number(v))}
                min={0}
              />
              <NumberInput
                label="NSEC3 Salt Length"
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
                Convert to NSEC3
              </Button>
            </Stack>
          )}

          <Text fw={600} mt="md">
            Private Keys ({privateKeys.length})
          </Text>
          {privateKeys.length > 0 ? (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Key Tag</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Algorithm</Table.Th>
                  <Table.Th>State</Table.Th>
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
              No private keys
            </Text>
          )}

          <Button variant="default" onClick={handlePublishAllKeys} loading={saving}>
            Publish All Private Keys
          </Button>
        </Stack>
      ) : (
        <Text c="dimmed">Failed to load properties</Text>
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
      success(t('common.success'), 'Permissions updated');
      onClose();
    } catch {
      error(t('common.error'), 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const [newUser, setNewUser] = useState('');
  const [newGroup, setNewGroup] = useState('');

  if (loading) {
    return (
      <Modal opened={opened} onClose={onClose} title={`Permissions: ${zone}`} size="lg">
        <Text>{t('common.loading')}</Text>
      </Modal>
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`Permissions: ${zone}`} size="lg">
      <Stack>
        <Text fw={600}>User Permissions</Text>
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
            placeholder="Add user..."
            clearable
            searchable
          />
        </Group>
        {userPerms.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>View</Table.Th>
                <Table.Th>Modify</Table.Th>
                <Table.Th>Delete</Table.Th>
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
                      Remove
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" size="sm">
            No user permissions
          </Text>
        )}

        <Text fw={600} mt="md">
          Group Permissions
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
            placeholder="Add group..."
            clearable
            searchable
          />
        </Group>
        {groupPerms.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Group</Table.Th>
                <Table.Th>View</Table.Th>
                <Table.Th>Modify</Table.Th>
                <Table.Th>Delete</Table.Th>
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
                      Remove
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" size="sm">
            No group permissions
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
