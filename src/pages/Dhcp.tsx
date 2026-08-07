import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Menu,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { IconDotsVertical } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { success, error } from '../components/notifications';
import { apiClient } from '../api/client';

interface DhcpLease {
  scope: string;
  hardwareAddress: string;
  address: string;
  type: string;
  clientIdentifier: string;
  hostName: string;
  leaseObtained: string;
  leaseExpires: string;
}

interface DhcpScope {
  name: string;
  enabled: boolean;
  startingAddress: string;
  endingAddress: string;
  subnetMask: string;
  networkAddress: string;
  broadcastAddress: string;
  interfaceAddress?: string;
}

interface DhcpScopeDetail extends DhcpScope {
  leaseTimeDays: number;
  leaseTimeHours: number;
  leaseTimeMinutes: number;
  offerDelayTime: number;
  pingCheckEnabled: boolean;
  pingCheckTimeout: number;
  pingCheckRetries: number;
  domainName?: string;
  domainSearchList?: string[];
  dnsUpdates: boolean;
  dnsOverwriteForDynamicLease: boolean;
  dnsTtl: number;
  serverAddress?: string;
  serverHostName?: string;
  bootFileName?: string;
  routerAddress?: string;
  useThisDnsServer: boolean;
  dnsServers?: string[];
  winsServers?: string[];
  ntpServers?: string[];
  ntpServerDomainNames?: string[];
  staticRoutes?: { destination: string; subnetMask: string; router: string }[];
  vendorInfo?: { identifier: string; information: string }[];
  capwapAcIpAddresses?: string[];
  tftpServerAddresses?: string[];
  genericOptions?: { code: number; value: string }[];
  exclusions?: { startingAddress: string; endingAddress: string }[];
  reservedLeases?: {
    hostName?: string;
    hardwareAddress: string;
    address: string;
    comments?: string;
  }[];
  allowOnlyReservedLeases: boolean;
  blockLocallyAdministeredMacAddresses: boolean;
  ignoreClientIdentifierOption: boolean;
}

function LeasesTab() {
  const { t } = useTranslation();
  const [leases, setLeases] = useState<DhcpLease[]>([]);
  const [removeTarget, setRemoveTarget] = useState<DhcpLease | null>(null);

  const loadLeases = async () => {
    try {
      const response = await apiClient.get<{ leases: DhcpLease[] }>('/dhcp/leases/list');
      if (response.status === 'ok' && response.response) {
        setLeases(response.response.leases);
      }
    } catch {
      error(t('common.error'), t('dhcp.leasesLoadFailed'));
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ leases: DhcpLease[] }>('/dhcp/leases/list')
      .then(response => {
        if (!cancelled && response.status === 'ok' && response.response) {
          setLeases(response.response.leases);
        }
      })
      .catch(() => {
        if (!cancelled) error(t('common.error'), t('dhcp.leasesLoadFailed'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const convertToReserved = async (lease: DhcpLease) => {
    if (!window.confirm(t('dhcp.convertToReservedConfirm'))) return;
    try {
      const response = await apiClient.post('/dhcp/leases/convertToReserved', {
        name: lease.scope,
        clientIdentifier: lease.clientIdentifier,
      });
      if (response.status === 'ok') {
        success(t('common.success'), t('dhcp.convertedToReserved'));
        await loadLeases();
      }
    } catch {
      error(t('common.error'), t('dhcp.leaseConvertFailed'));
    }
  };

  const convertToDynamic = async (lease: DhcpLease) => {
    if (!window.confirm(t('dhcp.convertToDynamicConfirm'))) return;
    try {
      const response = await apiClient.post('/dhcp/leases/convertToDynamic', {
        name: lease.scope,
        clientIdentifier: lease.clientIdentifier,
      });
      if (response.status === 'ok') {
        success(t('common.success'), t('dhcp.convertedToDynamic'));
        await loadLeases();
      }
    } catch {
      error(t('common.error'), t('dhcp.leaseConvertFailed'));
    }
  };

  const removeLease = async () => {
    if (!removeTarget) return;
    try {
      const response = await apiClient.post('/dhcp/leases/remove', {
        name: removeTarget.scope,
        clientIdentifier: removeTarget.clientIdentifier,
      });
      if (response.status === 'ok') {
        success(t('common.success'), t('dhcp.leaseRemoved'));
        setRemoveTarget(null);
        await loadLeases();
      }
    } catch {
      error(t('common.error'), t('dhcp.leaseRemoveFailed'));
    }
  };

  return (
    <Stack mt="md">
      <Paper shadow="sm" p="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('dhcp.scope')}</Table.Th>
              <Table.Th>{t('dhcp.macAddress')}</Table.Th>
              <Table.Th>{t('dhcp.ipAddress')}</Table.Th>
              <Table.Th></Table.Th>
              <Table.Th>{t('dhcp.hostName')}</Table.Th>
              <Table.Th>{t('dhcp.leaseObtained')}</Table.Th>
              <Table.Th>{t('dhcp.leaseExpires')}</Table.Th>
              <Table.Th style={{ width: 40 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {leases.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8} align="center">
                  <Text c="dimmed" size="sm">
                    {t('dhcp.noLeaseFound')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              leases.map((lease, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{lease.scope}</Table.Td>
                  <Table.Td>{lease.hardwareAddress}</Table.Td>
                  <Table.Td>{lease.address}</Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      variant={lease.type === 'Reserved' ? 'default' : 'light'}
                      style={{ cursor: 'text' }}
                    >
                      {lease.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{lease.hostName}</Table.Td>
                  <Table.Td>{new Date(lease.leaseObtained).toLocaleString()}</Table.Td>
                  <Table.Td>{new Date(lease.leaseExpires).toLocaleString()}</Table.Td>
                  <Table.Td>
                    <Menu position="bottom-end" shadow="sm">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconDotsVertical size={14} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        {lease.type === 'Dynamic' ? (
                          <Menu.Item onClick={() => convertToReserved(lease)}>
                            {t('dhcp.convertToReserved')}
                          </Menu.Item>
                        ) : (
                          <Menu.Item onClick={() => convertToDynamic(lease)}>
                            {t('dhcp.convertToDynamic')}
                          </Menu.Item>
                        )}
                        <Menu.Item color="red" onClick={() => setRemoveTarget(lease)}>
                          {t('dhcp.removeLease')}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        {leases.length > 0 && (
          <Text size="sm" fw={600} mt="sm">
            {t('dhcp.totalLeases', { count: leases.length })}
          </Text>
        )}
      </Paper>

      <Modal
        opened={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title={t('dhcp.removeLease')}
        centered
      >
        <Text mb="lg">
          {t('dhcp.removeLeaseConfirm', {
            address: removeTarget?.address,
            hardwareAddress: removeTarget?.hardwareAddress,
          })}
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setRemoveTarget(null)}>
            {t('common.cancel')}
          </Button>
          <Button color="red" onClick={removeLease}>
            {t('common.remove')}
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}

function ScopeForm({ scopeName, onDone }: { scopeName: string | null; onDone: () => void }) {
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

      <Paper shadow="sm" p="md" withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={600}>{t('dhcp.staticRoutes')}</Text>
          <Button size="xs" variant="default" onClick={addStaticRouteRow}>
            {t('common.add')}
          </Button>
        </Group>
        {staticRoutes.length > 0 && (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('dhcp.destination')}</Table.Th>
                <Table.Th>{t('dhcp.subnetMask')}</Table.Th>
                <Table.Th>{t('dhcp.router')}</Table.Th>
                <Table.Th style={{ width: 60 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {staticRoutes.map((row, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.destination}
                      onChange={e =>
                        setStaticRoutes(prev =>
                          prev.map((r, j) => (j === i ? { ...r, destination: e.target.value } : r))
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.subnetMask}
                      onChange={e =>
                        setStaticRoutes(prev =>
                          prev.map((r, j) => (j === i ? { ...r, subnetMask: e.target.value } : r))
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.router}
                      onChange={e =>
                        setStaticRoutes(prev =>
                          prev.map((r, j) => (j === i ? { ...r, router: e.target.value } : r))
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => setStaticRoutes(prev => prev.filter((_, j) => j !== i))}
                    >
                      {t('common.remove')}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Paper shadow="sm" p="md" withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={600}>{t('dhcp.vendorInfo')}</Text>
          <Button size="xs" variant="default" onClick={addVendorInfoRow}>
            {t('common.add')}
          </Button>
        </Group>
        {vendorInfo.length > 0 && (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('dhcp.identifier')}</Table.Th>
                <Table.Th>{t('dhcp.information')}</Table.Th>
                <Table.Th style={{ width: 60 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {vendorInfo.map((row, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.identifier}
                      onChange={e =>
                        setVendorInfo(prev =>
                          prev.map((r, j) => (j === i ? { ...r, identifier: e.target.value } : r))
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.information}
                      onChange={e =>
                        setVendorInfo(prev =>
                          prev.map((r, j) => (j === i ? { ...r, information: e.target.value } : r))
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => setVendorInfo(prev => prev.filter((_, j) => j !== i))}
                    >
                      {t('common.remove')}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Paper shadow="sm" p="md" withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={600}>{t('dhcp.genericOptions')}</Text>
          <Button size="xs" variant="default" onClick={addGenericOptionRow}>
            {t('common.add')}
          </Button>
        </Group>
        {genericOptions.length > 0 && (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('dhcp.optionCode')}</Table.Th>
                <Table.Th>{t('dhcp.hexValue')}</Table.Th>
                <Table.Th style={{ width: 60 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {genericOptions.map((row, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      type="number"
                      value={row.code}
                      onChange={e =>
                        setGenericOptions(prev =>
                          prev.map((r, j) => (j === i ? { ...r, code: Number(e.target.value) } : r))
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.value}
                      onChange={e =>
                        setGenericOptions(prev =>
                          prev.map((r, j) => (j === i ? { ...r, value: e.target.value } : r))
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => setGenericOptions(prev => prev.filter((_, j) => j !== i))}
                    >
                      {t('common.remove')}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Paper shadow="sm" p="md" withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={600}>{t('dhcp.exclusions')}</Text>
          <Button size="xs" variant="default" onClick={addExclusionRow}>
            {t('common.add')}
          </Button>
        </Group>
        {exclusions.length > 0 && (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('dhcp.startingAddress')}</Table.Th>
                <Table.Th>{t('dhcp.endingAddress')}</Table.Th>
                <Table.Th style={{ width: 60 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {exclusions.map((row, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.startingAddress}
                      onChange={e =>
                        setExclusions(prev =>
                          prev.map((r, j) =>
                            j === i ? { ...r, startingAddress: e.target.value } : r
                          )
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.endingAddress}
                      onChange={e =>
                        setExclusions(prev =>
                          prev.map((r, j) =>
                            j === i ? { ...r, endingAddress: e.target.value } : r
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
                      onClick={() => setExclusions(prev => prev.filter((_, j) => j !== i))}
                    >
                      {t('common.remove')}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Paper shadow="sm" p="md" withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={600}>{t('dhcp.reservedLeases')}</Text>
          <Button size="xs" variant="default" onClick={addReservedLeaseRow}>
            {t('common.add')}
          </Button>
        </Group>
        {reservedLeases.length > 0 && (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('dhcp.hostName')}</Table.Th>
                <Table.Th>{t('dhcp.hardwareAddress')}</Table.Th>
                <Table.Th>{t('dhcp.address')}</Table.Th>
                <Table.Th>{t('dhcp.comments')}</Table.Th>
                <Table.Th style={{ width: 60 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {reservedLeases.map((row, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.hostName}
                      onChange={e =>
                        setReservedLeases(prev =>
                          prev.map((r, j) => (j === i ? { ...r, hostName: e.target.value } : r))
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.hardwareAddress}
                      onChange={e =>
                        setReservedLeases(prev =>
                          prev.map((r, j) =>
                            j === i ? { ...r, hardwareAddress: e.target.value } : r
                          )
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.address}
                      onChange={e =>
                        setReservedLeases(prev =>
                          prev.map((r, j) => (j === i ? { ...r, address: e.target.value } : r))
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.comments}
                      onChange={e =>
                        setReservedLeases(prev =>
                          prev.map((r, j) => (j === i ? { ...r, comments: e.target.value } : r))
                        )
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => setReservedLeases(prev => prev.filter((_, j) => j !== i))}
                    >
                      {t('common.remove')}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
        <Group mt="sm">
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

function ScopesTab() {
  const { t } = useTranslation();
  const [scopes, setScopes] = useState<DhcpScope[]>([]);
  const [editingScope, setEditingScope] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadScopes = async () => {
    try {
      const response = await apiClient.get<{ scopes: DhcpScope[] }>('/dhcp/scopes/list');
      if (response.status === 'ok' && response.response) {
        setScopes(response.response.scopes);
      }
    } catch {
      error(t('common.error'), t('dhcp.scopesLoadFailed'));
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ scopes: DhcpScope[] }>('/dhcp/scopes/list')
      .then(response => {
        if (!cancelled && response.status === 'ok' && response.response) {
          setScopes(response.response.scopes);
        }
      })
      .catch(() => {
        if (!cancelled) error(t('common.error'), t('dhcp.scopesLoadFailed'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const setScopeEnabled = async (scopeName: string, enabled: boolean) => {
    if (
      !window.confirm(
        t('dhcp.scopeEnableDisableConfirm', {
          action: enabled ? t('dhcp.enable') : t('dhcp.disable'),
          name: scopeName,
        })
      )
    )
      return;
    try {
      const response = await apiClient.post(
        enabled ? '/dhcp/scopes/enable' : '/dhcp/scopes/disable',
        { name: scopeName }
      );
      if (response.status === 'ok') {
        success(t('common.success'), enabled ? t('dhcp.scopeEnabled') : t('dhcp.scopeDisabled'));
        await loadScopes();
      }
    } catch {
      error(
        t('common.error'),
        enabled ? t('dhcp.scopeEnableFailed') : t('dhcp.scopeDisableFailed')
      );
    }
  };

  const deleteScope = async (scopeName: string) => {
    if (!window.confirm(t('dhcp.scopeDeleteConfirm', { name: scopeName }))) return;
    try {
      const response = await apiClient.post('/dhcp/scopes/delete', { name: scopeName });
      if (response.status === 'ok') {
        success(t('common.success'), t('dhcp.scopeDeleted'));
        await loadScopes();
      }
    } catch {
      error(t('common.error'), t('dhcp.scopeDeleteFailed'));
    }
  };

  if (showAddForm || editingScope !== null) {
    return (
      <ScopeForm
        scopeName={editingScope}
        onDone={() => {
          setShowAddForm(false);
          setEditingScope(null);
          loadScopes();
        }}
      />
    );
  }

  return (
    <Stack mt="md">
      <Group justify="flex-end">
        <Button onClick={() => setShowAddForm(true)}>{t('dhcp.addScope')}</Button>
      </Group>
      <Paper shadow="sm" p="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('common.name')}</Table.Th>
              <Table.Th>{t('dhcp.scopeRange')}</Table.Th>
              <Table.Th>{t('dhcp.networkBroadcast')}</Table.Th>
              <Table.Th>{t('dhcp.interface')}</Table.Th>
              <Table.Th style={{ width: 200 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {scopes.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} align="center">
                  <Text c="dimmed" size="sm">
                    {t('dhcp.noScopeFound')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              scopes.map(scope => (
                <Table.Tr key={scope.name}>
                  <Table.Td>{scope.name}</Table.Td>
                  <Table.Td>
                    {scope.startingAddress} - {scope.endingAddress}
                    <br />
                    {scope.subnetMask}
                  </Table.Td>
                  <Table.Td>
                    {scope.networkAddress}
                    <br />
                    {scope.broadcastAddress}
                  </Table.Td>
                  <Table.Td>{scope.interfaceAddress || ''}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => setEditingScope(scope.name)}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        size="xs"
                        color={scope.enabled ? 'yellow' : 'gray'}
                        onClick={() => setScopeEnabled(scope.name, !scope.enabled)}
                      >
                        {scope.enabled ? t('dhcp.disable') : t('dhcp.enable')}
                      </Button>
                      <Button size="xs" color="red" onClick={() => deleteScope(scope.name)}>
                        {t('common.delete')}
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        {scopes.length > 0 && (
          <Text size="sm" fw={600} mt="sm">
            {t('dhcp.totalScopes', { count: scopes.length })}
          </Text>
        )}
      </Paper>
    </Stack>
  );
}

export function DhcpPage({ tab = 'leases' }: { tab?: 'leases' | 'scopes' }) {
  const { t } = useTranslation();
  return (
    <Stack>
      <Title order={2}>{t('nav.dhcp')}</Title>
      {tab === 'scopes' ? <ScopesTab /> : <LeasesTab />}
    </Stack>
  );
}
