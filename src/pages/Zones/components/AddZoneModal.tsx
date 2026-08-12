import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  FileInput,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';

interface AddZoneModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: (zone: string) => void;
}

export function AddZoneModal({ opened, onClose, onSuccess }: AddZoneModalProps) {
  const { t } = useTranslation();

  const ZONE_TYPE_OPTIONS = [
    { value: 'Primary', label: t('zones.types.Primary') },
    { value: 'Secondary', label: t('zones.types.Secondary') },
    { value: 'Stub', label: t('zones.types.Stub') },
    { value: 'Forwarder', label: t('zones.types.Forwarder') },
    { value: 'SecondaryForwarder', label: t('zones.types.SecondaryForwarder') },
    { value: 'Catalog', label: t('zones.types.Catalog') },
    { value: 'SecondaryCatalog', label: t('zones.types.SecondaryCatalog') },
    { value: 'SecondaryRoot', label: t('zones.types.SecondaryRoot') },
  ];

  const [zoneType, setZoneType] = useState<string>('Primary');
  const [zoneName, setZoneName] = useState('');
  const [loading, setLoading] = useState(false);

  const [catalog, setCatalog] = useState('');
  const [catalogOptions, setCatalogOptions] = useState<{ value: string; label: string }[]>([]);

  const [useSoaSerialDateScheme, setUseSoaSerialDateScheme] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const [initializeForwarder, setInitializeForwarder] = useState(true);
  const [forwarderProtocol, setForwarderProtocol] = useState('Udp');
  const [forwarder, setForwarder] = useState('');
  const [forwarderDnssecValidation, setForwarderDnssecValidation] = useState(false);
  const [forwarderThisServer, setForwarderThisServer] = useState(false);
  const [forwarderProxyType, setForwarderProxyType] = useState('DefaultProxy');
  const [forwarderProxyAddress, setForwarderProxyAddress] = useState('');
  const [forwarderProxyPort, setForwarderProxyPort] = useState('');
  const [forwarderProxyUsername, setForwarderProxyUsername] = useState('');
  const [forwarderProxyPassword, setForwarderProxyPassword] = useState('');

  const [primaryNsAddresses, setPrimaryNsAddresses] = useState('');
  const [zoneTransferProtocol, setZoneTransferProtocol] = useState('Tcp');
  const [tsigKeyName, setTsigKeyName] = useState('');
  const [tsigKeyOptions, setTsigKeyOptions] = useState<{ value: string; label: string }[]>([]);
  const [validateZone, setValidateZone] = useState(true);

  useEffect(() => {
    if (!opened) return;

    setZoneType('Primary');
    setZoneName('');
    setLoading(false);
    setCatalog('');
    setUseSoaSerialDateScheme(false);
    setImportFile(null);
    setInitializeForwarder(true);
    setForwarderProtocol('Udp');
    setForwarder('');
    setForwarderDnssecValidation(false);
    setForwarderThisServer(false);
    setForwarderProxyType('DefaultProxy');
    setForwarderProxyAddress('');
    setForwarderProxyPort('');
    setForwarderProxyUsername('');
    setForwarderProxyPassword('');
    setPrimaryNsAddresses('');
    setZoneTransferProtocol('Tcp');
    setTsigKeyName('');
    setValidateZone(true);

    loadCatalogZones();
    loadTsigKeys();
  }, [opened]);

  async function loadCatalogZones() {
    try {
      const res = await apiClient.get<{ catalogZoneNames: string[] }>('/zones/catalogs/list');
      if (res.status === 'ok' && res.response) {
        setCatalogOptions(
          res.response.catalogZoneNames.map((n: string) => ({ value: n, label: n }))
        );
      }
    } catch {
      setCatalogOptions([]);
    }
  }

  async function loadTsigKeys() {
    try {
      const res = await apiClient.get<{ tsigKeyNames: string[] }>('/settings/getTsigKeyNames');
      if (res.status === 'ok' && res.response) {
        setTsigKeyOptions(res.response.tsigKeyNames.map((n: string) => ({ value: n, label: n })));
      }
    } catch {
      setTsigKeyOptions([]);
    }
  }

  const handleAdd = async () => {
    if (zoneType !== 'SecondaryRoot' && !zoneName.trim()) {
      error(t('common.error'), t('zones.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      let type = zoneType;
      const params: Record<string, unknown> = {};

      params.catalog = catalog || '';

      switch (zoneType) {
        case 'Primary':
          params.useSoaSerialDateScheme = useSoaSerialDateScheme;
          break;

        case 'Secondary':
          params.primaryNameServerAddresses = primaryNsAddresses || '';
          params.zoneTransferProtocol = zoneTransferProtocol;
          params.tsigKeyName = tsigKeyName || '';
          params.validateZone = validateZone;
          break;

        case 'Stub':
          params.primaryNameServerAddresses = primaryNsAddresses || '';
          break;

        case 'Forwarder':
          if (initializeForwarder) {
            if (!forwarder.trim()) {
              error(t('common.error'), t('zones.forwarderRequired'));
              setLoading(false);
              return;
            }
            params.protocol = forwarderProtocol;
            params.forwarder = forwarder;
            params.dnssecValidation = forwarderDnssecValidation;
            params.initializeForwarder = true;
            params.proxyType = forwarderProxyType;
            if (forwarderProxyType === 'Http' || forwarderProxyType === 'Socks5') {
              params.proxyAddress = forwarderProxyAddress;
              params.proxyPort = forwarderProxyPort;
              params.proxyUsername = forwarderProxyUsername || '';
              params.proxyPassword = forwarderProxyPassword || '';
            }
          } else {
            params.initializeForwarder = false;
          }
          break;

        case 'SecondaryForwarder':
        case 'SecondaryCatalog':
          if (!primaryNsAddresses.trim()) {
            error(t('common.error'), t('zones.forwarderRequired'));
            setLoading(false);
            return;
          }
          params.primaryNameServerAddresses = primaryNsAddresses;
          params.zoneTransferProtocol = zoneTransferProtocol;
          params.tsigKeyName = tsigKeyName || '';
          break;

        case 'SecondaryRoot':
          type = 'Secondary';
          params.primaryNameServerAddresses =
            '199.9.14.201,192.33.4.12,199.7.91.13,192.5.5.241,192.112.36.4,193.0.14.129,192.0.47.132,192.0.32.132,[2001:500:200::b],[2001:500:2::c],[2001:500:2d::d],[2001:500:2f::f],[2001:500:12::d0d],[2001:7fd::1],[2620:0:2830:202::132],[2620:0:2d0:202::132]';
          params.zoneTransferProtocol = 'Tcp';
          params.validateZone = true;
          break;
      }

      const formData = new FormData();
      if (importFile) {
        formData.append('fileImportZone', importFile);
      }

      let url = `/zones/create?zone=${encodeURIComponent(zoneType === 'SecondaryRoot' ? '.' : zoneName)}&type=${type}`;
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '' && value !== false) {
          url += `&${key}=${encodeURIComponent(String(value))}`;
        }
      }

      const response = importFile
        ? await fetch(`/api${url}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiClient.getToken() || ''}` },
            body: formData,
          }).then(r => r.json())
        : await apiClient.post(url, {});

      if (response.status === 'ok') {
        success(t('common.success'), t('zones.created', { zone: zoneName || '.' }));
        const domain = response.response?.domain || zoneType === 'SecondaryRoot' ? '.' : zoneName;
        onSuccess(domain);
        onClose();
      } else {
        throw new Error(response.errorMessage || t('zones.createFailed'));
      }
    } catch {
      error(t('common.error'), t('zones.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('zones.addZone')} size="lg">
      <Stack>
        <TextInput
          label={t('zones.zoneFieldLabel')}
          placeholder={t('zones.zonePlaceholder')}
          value={zoneType === 'SecondaryRoot' ? '.' : zoneName}
          onChange={e => setZoneName(e.target.value)}
          disabled={zoneType === 'SecondaryRoot'}
          maxLength={255}
        />

        <Select
          label={t('zones.type')}
          data={ZONE_TYPE_OPTIONS}
          value={zoneType}
          onChange={v => setZoneType(v || 'Primary')}
        />

        {(zoneType === 'Primary' ||
          zoneType === 'Secondary' ||
          zoneType === 'Stub' ||
          zoneType === 'Forwarder' ||
          zoneType === 'SecondaryRoot') &&
          catalogOptions.length > 0 && (
            <Select
              label={t('zones.catalogZone')}
              placeholder={t('common.optional')}
              data={catalogOptions}
              value={catalog}
              onChange={v => setCatalog(v || '')}
              clearable
            />
          )}

        {zoneType === 'Primary' && (
          <>
            <Checkbox
              label={t('zones.soaSerialDateScheme')}
              checked={useSoaSerialDateScheme}
              onChange={e => setUseSoaSerialDateScheme(e.currentTarget.checked)}
            />
            <FileInput
              label={t('zones.importZoneFile')}
              placeholder={t('zones.importFilePlaceholder')}
              value={importFile}
              onChange={setImportFile}
              accept=".zone,.txt"
            />
          </>
        )}

        {(zoneType === 'Secondary' || zoneType === 'Stub') && (
          <Textarea
            label={t('zones.primaryNsOptional')}
            placeholder={t('zones.primaryNsPlaceholder')}
            value={primaryNsAddresses}
            onChange={e => setPrimaryNsAddresses(e.target.value)}
            minRows={4}
            autosize
          />
        )}

        {zoneType === 'Secondary' && (
          <>
            <Select
              label={t('zones.zoneTransferProtocol')}
              data={[
                { value: 'Tcp', label: t('zones.xfrOverTcp') },
                { value: 'Tls', label: t('zones.xfrOverTls') },
                { value: 'Quic', label: t('zones.xfrOverQuic') },
              ]}
              value={zoneTransferProtocol}
              onChange={v => setZoneTransferProtocol(v || 'Tcp')}
            />

            <Select
              label={t('zones.tsigKeyOptional')}
              placeholder={t('common.optional')}
              data={tsigKeyOptions}
              value={tsigKeyName}
              onChange={v => setTsigKeyName(v || '')}
              clearable
              searchable
            />

            <Checkbox
              label={t('zones.useZonemd')}
              description={t('zones.zonemdDescription')}
              checked={validateZone}
              onChange={e => setValidateZone(e.currentTarget.checked)}
            />
          </>
        )}

        {zoneType === 'Forwarder' && (
          <>
            <Checkbox
              label={t('zones.initForwarderRecord')}
              checked={initializeForwarder}
              onChange={e => setInitializeForwarder(e.currentTarget.checked)}
            />

            {initializeForwarder ? (
              <>
                <Select
                  label={t('zones.forwarderProtocol')}
                  data={[
                    { value: 'Udp', label: t('zones.dnsOverUdp') },
                    { value: 'Tcp', label: t('zones.dnsOverTcp') },
                    { value: 'Tls', label: t('zones.dnsOverTls') },
                    { value: 'Https', label: t('zones.dnsOverHttps') },
                    { value: 'Quic', label: t('zones.dnsOverQuic') },
                  ]}
                  value={forwarderProtocol}
                  onChange={v => setForwarderProtocol(v || 'Udp')}
                />

                <Stack gap={4}>
                  <Text size="sm" fw={500}>
                    {t('zones.forwarderHeading')}
                  </Text>
                  <Checkbox
                    label={t('zones.useThisServer')}
                    description={t('zones.useThisServerDesc')}
                    checked={forwarderThisServer}
                    onChange={e => {
                      setForwarderThisServer(e.currentTarget.checked);
                      if (e.currentTarget.checked) setForwarder('this-server');
                      else setForwarder('');
                    }}
                  />
                  <TextInput
                    placeholder={t('zones.forwarderPlaceholder')}
                    value={forwarder}
                    onChange={e => setForwarder(e.target.value)}
                    disabled={forwarderThisServer}
                  />
                  <Text size="xs" c="dimmed">
                    {t('zones.forwarderHint')}
                  </Text>
                </Stack>

                {!forwarderThisServer && (
                  <>
                    <Checkbox
                      label={t('zones.enableDnssecValidation')}
                      checked={forwarderDnssecValidation}
                      onChange={e => setForwarderDnssecValidation(e.currentTarget.checked)}
                    />

                    <Select
                      label={t('zones.forwarderProxyType')}
                      data={[
                        { value: 'NoProxy', label: t('zones.noProxy') },
                        { value: 'DefaultProxy', label: t('zones.defaultProxy') },
                        { value: 'Http', label: t('zones.httpProxy') },
                        { value: 'Socks5', label: t('zones.socks5Proxy') },
                      ]}
                      value={forwarderProxyType}
                      onChange={v => setForwarderProxyType(v || 'DefaultProxy')}
                    />

                    {(forwarderProxyType === 'Http' || forwarderProxyType === 'Socks5') && (
                      <>
                        <TextInput
                          label={t('zones.proxyAddress')}
                          placeholder={t('zones.proxyAddressPlaceholder')}
                          value={forwarderProxyAddress}
                          onChange={e => setForwarderProxyAddress(e.target.value)}
                        />
                        <TextInput
                          label={t('zones.proxyPort')}
                          placeholder={t('zones.proxyPortPlaceholder')}
                          value={forwarderProxyPort}
                          onChange={e => setForwarderProxyPort(e.target.value)}
                          type="number"
                        />
                        <TextInput
                          label={t('zones.proxyUsername')}
                          placeholder={t('zones.proxyUsernamePlaceholder')}
                          value={forwarderProxyUsername}
                          onChange={e => setForwarderProxyUsername(e.target.value)}
                        />
                        <TextInput
                          label={t('zones.proxyPassword')}
                          placeholder={t('zones.proxyPasswordPlaceholder')}
                          type="password"
                          value={forwarderProxyPassword}
                          onChange={e => setForwarderProxyPassword(e.target.value)}
                        />
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <FileInput
                label={t('zones.importZoneFile')}
                placeholder={t('zones.importFilePlaceholder')}
                value={importFile}
                onChange={setImportFile}
                accept=".zone,.txt"
              />
            )}
          </>
        )}

        {(zoneType === 'SecondaryForwarder' || zoneType === 'SecondaryCatalog') && (
          <>
            <Textarea
              label={t('zones.primaryNsRequired')}
              placeholder={t('zones.primaryNsPlaceholder')}
              value={primaryNsAddresses}
              onChange={e => setPrimaryNsAddresses(e.target.value)}
              minRows={4}
              required
              autosize
            />

            <Select
              label={t('zones.zoneTransferProtocol')}
              data={[
                { value: 'Tcp', label: t('zones.xfrOverTcp') },
                { value: 'Tls', label: t('zones.xfrOverTls') },
                { value: 'Quic', label: t('zones.xfrOverQuic') },
              ]}
              value={zoneTransferProtocol}
              onChange={v => setZoneTransferProtocol(v || 'Tcp')}
            />

            <Select
              label={t('zones.tsigKeyOptional')}
              placeholder={t('common.optional')}
              data={tsigKeyOptions}
              value={tsigKeyName}
              onChange={v => setTsigKeyName(v || '')}
              clearable
              searchable
            />
          </>
        )}

        {zoneType === 'SecondaryRoot' && (
          <Text size="sm" c="dimmed">
            {t('zones.secondaryRootDesc')}
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleAdd} loading={loading}>
            {t('zones.addZone')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
