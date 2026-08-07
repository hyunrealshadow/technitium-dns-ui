import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Button,
  Checkbox,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import type { DhcpScopeDetail } from '../types';
import { ListEditor, type ListColumn } from '../components/ListEditor';

export function ScopeForm({ scopeName, onDone }: { scopeName: string | null; onDone: () => void }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [startingAddress, setStartingAddress] = useState('');
  const [endingAddress, setEndingAddress] = useState('');
  const [subnetMask, setSubnetMask] = useState('');
  const [leaseTimeDays, setLeaseTimeDays] = useState(1);
  const [leaseTimeHours, setLeaseTimeHours] = useState(0);
  const [leaseTimeMinutes, setLeaseTimeMinutes] = useState(0);
  const [offerDelayTime, setOfferDelayTime] = useState(0);
  const [pingCheckEnabled, setPingCheckEnabled] = useState(false);
  const [pingCheckTimeout, setPingCheckTimeout] = useState(1000);
  const [pingCheckRetries, setPingCheckRetries] = useState(2);
  const [domainName, setDomainName] = useState('');
  const [domainSearchList, setDomainSearchList] = useState('');
  const [dnsUpdates, setDnsUpdates] = useState(true);
  const [dnsOverwriteForDynamicLease, setDnsOverwriteForDynamicLease] = useState(false);
  const [dnsTtl, setDnsTtl] = useState(900);
  const [serverAddress, setServerAddress] = useState('');
  const [serverHostName, setServerHostName] = useState('');
  const [bootFileName, setBootFileName] = useState('');
  const [routerAddress, setRouterAddress] = useState('');
  const [useThisDnsServer, setUseThisDnsServer] = useState(false);
  const [dnsServers, setDnsServers] = useState('');
  const [winsServers, setWinsServers] = useState('');
  const [ntpServers, setNtpServers] = useState('');
  const [ntpServerDomainNames, setNtpServerDomainNames] = useState('');
  const [staticRoutes, setStaticRoutes] = useState<
    { destination: string; subnetMask: string; router: string }[]
  >([]);
  const [vendorInfo, setVendorInfo] = useState<{ identifier: string; information: string }[]>([]);
  const [capwapAcIpAddresses, setCapwapAcIpAddresses] = useState('');
  const [tftpServerAddresses, setTftpServerAddresses] = useState('');
  const [genericOptions, setGenericOptions] = useState<{ code: number; value: string }[]>([]);
  const [exclusions, setExclusions] = useState<
    { startingAddress: string; endingAddress: string }[]
  >([]);
  const [reservedLeases, setReservedLeases] = useState<
    { hostName: string; hardwareAddress: string; address: string; comments: string }[]
  >([]);
  const [allowOnlyReservedLeases, setAllowOnlyReservedLeases] = useState(false);
  const [blockLocallyAdministeredMacAddresses, setBlockLocallyAdministeredMacAddresses] =
    useState(false);
  const [ignoreClientIdentifierOption, setIgnoreClientIdentifierOption] = useState(true);

  useEffect(() => {
    if (!scopeName) {
      setUseThisDnsServer(true);
      return;
    }
    async function load() {
      try {
        const response = await apiClient.get<DhcpScopeDetail>(
          `/dhcp/scopes/get?name=${encodeURIComponent(scopeName || '')}`
        );
        if (response.status === 'ok' && response.response) {
          const s = response.response;
          setName(s.name);
          setStartingAddress(s.startingAddress);
          setEndingAddress(s.endingAddress);
          setSubnetMask(s.subnetMask);
          setLeaseTimeDays(s.leaseTimeDays);
          setLeaseTimeHours(s.leaseTimeHours);
          setLeaseTimeMinutes(s.leaseTimeMinutes);
          setOfferDelayTime(s.offerDelayTime);
          setPingCheckEnabled(s.pingCheckEnabled);
          setPingCheckTimeout(s.pingCheckTimeout);
          setPingCheckRetries(s.pingCheckRetries);
          setDomainName(s.domainName || '');
          setDomainSearchList((s.domainSearchList || []).join('\n'));
          setDnsUpdates(s.dnsUpdates);
          setDnsOverwriteForDynamicLease(s.dnsOverwriteForDynamicLease);
          setDnsTtl(s.dnsTtl);
          setServerAddress(s.serverAddress || '');
          setServerHostName(s.serverHostName || '');
          setBootFileName(s.bootFileName || '');
          setRouterAddress(s.routerAddress || '');
          setUseThisDnsServer(s.useThisDnsServer);
          setDnsServers((s.dnsServers || []).join('\n'));
          setWinsServers((s.winsServers || []).join('\n'));
          setNtpServers((s.ntpServers || []).join('\n'));
          setNtpServerDomainNames((s.ntpServerDomainNames || []).join('\n'));
          setStaticRoutes(s.staticRoutes || []);
          setVendorInfo(s.vendorInfo || []);
          setCapwapAcIpAddresses((s.capwapAcIpAddresses || []).join('\n'));
          setTftpServerAddresses((s.tftpServerAddresses || []).join('\n'));
          setGenericOptions(s.genericOptions || []);
          setExclusions(s.exclusions || []);
          setReservedLeases(
            (s.reservedLeases || []).map(r => ({
              hostName: r.hostName || '',
              hardwareAddress: r.hardwareAddress,
              address: r.address,
              comments: r.comments || '',
            }))
          );
          setAllowOnlyReservedLeases(s.allowOnlyReservedLeases);
          setBlockLocallyAdministeredMacAddresses(s.blockLocallyAdministeredMacAddresses);
          setIgnoreClientIdentifierOption(s.ignoreClientIdentifierOption);
        }
      } catch {
        error(t('common.error'), t('dhcp.scopeLoadFailed'));
      }
    }
    load();
  }, [scopeName, t]);

  const cleanTextList = (text: string) =>
    text
      .replace(/\n/g, ',')
      .split(',')
      .filter(x => x.trim() !== '')
      .join(',');

  const handleSave = async () => {
    setSaving(true);
    try {
      const params: Record<string, unknown> = {
        name: scopeName || name,
        startingAddress,
        endingAddress,
        subnetMask,
        leaseTimeDays,
        leaseTimeHours,
        leaseTimeMinutes,
        offerDelayTime,
        pingCheckEnabled,
        pingCheckTimeout,
        pingCheckRetries,
        domainName,
        domainSearchList: cleanTextList(domainSearchList),
        dnsUpdates,
        dnsOverwriteForDynamicLease,
        dnsTtl,
        serverAddress,
        serverHostName,
        bootFileName,
        routerAddress,
        useThisDnsServer,
        winsServers: cleanTextList(winsServers),
        ntpServers: cleanTextList(ntpServers),
        ntpServerDomainNames: cleanTextList(ntpServerDomainNames),
        capwapAcIpAddresses: cleanTextList(capwapAcIpAddresses),
        tftpServerAddresses: cleanTextList(tftpServerAddresses),
        allowOnlyReservedLeases,
        blockLocallyAdministeredMacAddresses,
        ignoreClientIdentifierOption,
      };
      if (!useThisDnsServer) params.dnsServers = cleanTextList(dnsServers);
      if (scopeName && scopeName !== name) params.newName = name;

      if (staticRoutes.length > 0)
        params.staticRoutes = staticRoutes
          .map(r => `${r.destination}|${r.subnetMask}|${r.router}`)
          .join('|');
      if (vendorInfo.length > 0)
        params.vendorInfo = vendorInfo.map(v => `${v.identifier}|${v.information}`).join('|');
      if (genericOptions.length > 0)
        params.genericOptions = genericOptions.map(g => `${g.code}|${g.value}`).join('|');
      if (exclusions.length > 0)
        params.exclusions = exclusions
          .map(e => `${e.startingAddress}|${e.endingAddress}`)
          .join('|');
      if (reservedLeases.length > 0)
        params.reservedLeases = reservedLeases
          .map(r => `${r.hostName}|${r.hardwareAddress}|${r.address}|${r.comments}`)
          .join('|');

      const response = await apiClient.post('/dhcp/scopes/set', params);
      if (response.status === 'ok') {
        success(t('common.success'), t('dhcp.scopeSaved'));
        onDone();
      } else {
        throw new Error(response.errorMessage || t('dhcp.saveScopeFailed'));
      }
    } catch {
      error(t('common.error'), t('dhcp.scopeSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const addStaticRouteRow = () =>
    setStaticRoutes(prev => [...prev, { destination: '', subnetMask: '', router: '' }]);
  const addVendorInfoRow = () =>
    setVendorInfo(prev => [...prev, { identifier: '', information: '' }]);
  const addGenericOptionRow = () => setGenericOptions(prev => [...prev, { code: 0, value: '' }]);
  const addExclusionRow = () =>
    setExclusions(prev => [...prev, { startingAddress: '', endingAddress: '' }]);
  const addReservedLeaseRow = () =>
    setReservedLeases(prev => [
      ...prev,
      { hostName: '', hardwareAddress: '', address: '', comments: '' },
    ]);

  const updateList =
    (setter: Dispatch<SetStateAction<Record<string, unknown>[]>>) =>
    (index: number, field: string, value: string | number) =>
      setter(prev =>
        prev.map((r, j) =>
          j === index ? ({ ...r, [field]: value } as Record<string, unknown>) : r
        )
      );

  const staticRouteColumns: ListColumn[] = [
    { key: 'destination', labelKey: 'dhcp.destination' },
    { key: 'subnetMask', labelKey: 'dhcp.subnetMask' },
    { key: 'router', labelKey: 'dhcp.router' },
  ];
  const vendorInfoColumns: ListColumn[] = [
    { key: 'identifier', labelKey: 'dhcp.identifier' },
    { key: 'information', labelKey: 'dhcp.information' },
  ];
  const genericOptionColumns: ListColumn[] = [
    { key: 'code', labelKey: 'dhcp.optionCode', type: 'number' },
    { key: 'value', labelKey: 'dhcp.hexValue' },
  ];
  const exclusionColumns: ListColumn[] = [
    { key: 'startingAddress', labelKey: 'dhcp.startingAddress' },
    { key: 'endingAddress', labelKey: 'dhcp.endingAddress' },
  ];
  const reservedLeaseColumns: ListColumn[] = [
    { key: 'hostName', labelKey: 'dhcp.hostName' },
    { key: 'hardwareAddress', labelKey: 'dhcp.hardwareAddress' },
    { key: 'address', labelKey: 'dhcp.address' },
    { key: 'comments', labelKey: 'dhcp.comments' },
  ];

  return (
    <Stack mt="md">
      <Title order={4}>{scopeName ? t('dhcp.editScope') : t('dhcp.addScope')}</Title>

      <Paper shadow="sm" p="md" withBorder>
        <Group grow>
          <TextInput
            label={t('common.name')}
            placeholder={t('dhcp.scopeNamePlaceholder')}
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <TextInput
            label={t('dhcp.startingAddress')}
            placeholder={t('dhcp.startingAddress')}
            value={startingAddress}
            onChange={e => setStartingAddress(e.target.value)}
          />
          <TextInput
            label={t('dhcp.endingAddress')}
            placeholder={t('dhcp.endingAddress')}
            value={endingAddress}
            onChange={e => setEndingAddress(e.target.value)}
          />
        </Group>
        <Group grow mt="sm">
          <TextInput
            label={t('dhcp.subnetMask')}
            placeholder={t('dhcp.subnetMask')}
            value={subnetMask}
            onChange={e => setSubnetMask(e.target.value)}
          />
          <TextInput
            label={t('dhcp.leaseTimeDays')}
            type="number"
            value={leaseTimeDays}
            onChange={e => setLeaseTimeDays(Number(e.target.value))}
          />
          <TextInput
            label={t('dhcp.leaseTimeHours')}
            type="number"
            value={leaseTimeHours}
            onChange={e => setLeaseTimeHours(Number(e.target.value))}
          />
          <TextInput
            label={t('dhcp.leaseTimeMinutes')}
            type="number"
            value={leaseTimeMinutes}
            onChange={e => setLeaseTimeMinutes(Number(e.target.value))}
          />
        </Group>
        <Group grow mt="sm">
          <TextInput
            label={t('dhcp.offerDelayTime')}
            type="number"
            value={offerDelayTime}
            onChange={e => setOfferDelayTime(Number(e.target.value))}
          />
          <Checkbox
            label={t('dhcp.enablePingCheck')}
            checked={pingCheckEnabled}
            onChange={e => setPingCheckEnabled(e.currentTarget.checked)}
            mt={30}
          />
          <TextInput
            label={t('dhcp.pingCheckTimeout')}
            type="number"
            value={pingCheckTimeout}
            onChange={e => setPingCheckTimeout(Number(e.target.value))}
          />
          <TextInput
            label={t('dhcp.pingCheckRetries')}
            type="number"
            value={pingCheckRetries}
            onChange={e => setPingCheckRetries(Number(e.target.value))}
          />
        </Group>
      </Paper>

      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('dhcp.dnsOptions')}
        </Text>
        <Group grow>
          <TextInput
            label={t('dhcp.domainName')}
            placeholder={t('dhcp.domainName')}
            value={domainName}
            onChange={e => setDomainName(e.target.value)}
          />
          <Textarea
            label={t('dhcp.domainSearchList')}
            placeholder={t('common.onePerLine')}
            value={domainSearchList}
            onChange={e => setDomainSearchList(e.target.value)}
            minRows={2}
          />
          <TextInput
            label={t('dhcp.dnsTtl')}
            type="number"
            value={dnsTtl}
            onChange={e => setDnsTtl(Number(e.target.value))}
          />
        </Group>
        <Group mt="sm">
          <Checkbox
            label={t('dhcp.dnsUpdates')}
            checked={dnsUpdates}
            onChange={e => {
              setDnsUpdates(e.currentTarget.checked);
              if (!e.currentTarget.checked) setDnsOverwriteForDynamicLease(false);
            }}
          />
          <Checkbox
            label={t('dhcp.overwriteForDynamicLease')}
            checked={dnsOverwriteForDynamicLease}
            onChange={e => setDnsOverwriteForDynamicLease(e.currentTarget.checked)}
            disabled={!dnsUpdates}
          />
          <Checkbox
            label={t('dhcp.useThisDnsServer')}
            checked={useThisDnsServer}
            onChange={e => setUseThisDnsServer(e.currentTarget.checked)}
          />
        </Group>
        <Textarea
          mt="sm"
          label={t('dhcp.dnsServers')}
          placeholder={t('common.onePerLine')}
          value={dnsServers}
          onChange={e => setDnsServers(e.target.value)}
          minRows={2}
          disabled={useThisDnsServer}
        />
        <Group grow mt="sm">
          <Textarea
            label={t('dhcp.winsServers')}
            placeholder={t('common.onePerLine')}
            value={winsServers}
            onChange={e => setWinsServers(e.target.value)}
            minRows={2}
          />
          <Textarea
            label={t('dhcp.ntpServers')}
            placeholder={t('common.onePerLine')}
            value={ntpServers}
            onChange={e => setNtpServers(e.target.value)}
            minRows={2}
          />
          <Textarea
            label={t('dhcp.ntpServerDomainNames')}
            placeholder={t('common.onePerLine')}
            value={ntpServerDomainNames}
            onChange={e => setNtpServerDomainNames(e.target.value)}
            minRows={2}
          />
        </Group>
        <Group grow mt="sm">
          <TextInput
            label={t('dhcp.serverAddress')}
            value={serverAddress}
            onChange={e => setServerAddress(e.target.value)}
          />
          <TextInput
            label={t('dhcp.serverHostName')}
            value={serverHostName}
            onChange={e => setServerHostName(e.target.value)}
          />
          <TextInput
            label={t('dhcp.bootFileName')}
            value={bootFileName}
            onChange={e => setBootFileName(e.target.value)}
          />
        </Group>
        <Group grow mt="sm">
          <TextInput
            label={t('dhcp.routerAddress')}
            value={routerAddress}
            onChange={e => setRouterAddress(e.target.value)}
          />
          <Textarea
            label={t('dhcp.capwapApIpAddresses')}
            placeholder={t('common.onePerLine')}
            value={capwapAcIpAddresses}
            onChange={e => setCapwapAcIpAddresses(e.target.value)}
            minRows={2}
          />
          <Textarea
            label={t('dhcp.tftpServerAddresses')}
            placeholder={t('common.onePerLine')}
            value={tftpServerAddresses}
            onChange={e => setTftpServerAddresses(e.target.value)}
            minRows={2}
          />
        </Group>
      </Paper>

      <ListEditor
        titleKey="dhcp.staticRoutes"
        rows={staticRoutes}
        columns={staticRouteColumns}
        onAdd={addStaticRouteRow}
        onUpdate={updateList(
          setStaticRoutes as Dispatch<SetStateAction<Record<string, unknown>[]>>
        )}
        onRemove={i => setStaticRoutes(prev => prev.filter((_, j) => j !== i))}
      />
      <ListEditor
        titleKey="dhcp.vendorInfo"
        rows={vendorInfo}
        columns={vendorInfoColumns}
        onAdd={addVendorInfoRow}
        onUpdate={updateList(setVendorInfo as Dispatch<SetStateAction<Record<string, unknown>[]>>)}
        onRemove={i => setVendorInfo(prev => prev.filter((_, j) => j !== i))}
      />
      <ListEditor
        titleKey="dhcp.genericOptions"
        rows={genericOptions}
        columns={genericOptionColumns}
        onAdd={addGenericOptionRow}
        onUpdate={updateList(
          setGenericOptions as Dispatch<SetStateAction<Record<string, unknown>[]>>
        )}
        onRemove={i => setGenericOptions(prev => prev.filter((_, j) => j !== i))}
      />
      <ListEditor
        titleKey="dhcp.exclusions"
        rows={exclusions}
        columns={exclusionColumns}
        onAdd={addExclusionRow}
        onUpdate={updateList(setExclusions as Dispatch<SetStateAction<Record<string, unknown>[]>>)}
        onRemove={i => setExclusions(prev => prev.filter((_, j) => j !== i))}
      />
      <ListEditor
        titleKey="dhcp.reservedLeases"
        rows={reservedLeases}
        columns={reservedLeaseColumns}
        onAdd={addReservedLeaseRow}
        onUpdate={updateList(
          setReservedLeases as Dispatch<SetStateAction<Record<string, unknown>[]>>
        )}
        onRemove={i => setReservedLeases(prev => prev.filter((_, j) => j !== i))}
      />
      <Paper shadow="sm" p="md" withBorder>
        <Group>
          <Checkbox
            label={t('dhcp.allowOnlyReservedLeases')}
            checked={allowOnlyReservedLeases}
            onChange={e => setAllowOnlyReservedLeases(e.currentTarget.checked)}
          />
          <Checkbox
            label={t('dhcp.blockLocallyAdministeredMac')}
            checked={blockLocallyAdministeredMacAddresses}
            onChange={e => setBlockLocallyAdministeredMacAddresses(e.currentTarget.checked)}
          />
          <Checkbox
            label={t('dhcp.ignoreClientIdentifier')}
            checked={ignoreClientIdentifierOption}
            onChange={e => setIgnoreClientIdentifierOption(e.currentTarget.checked)}
          />
        </Group>
      </Paper>

      <Group justify="flex-end">
        <Button variant="subtle" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} loading={saving}>
          {t('common.save')}
        </Button>
      </Group>
    </Stack>
  );
}
