import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Group,
  Menu,
  Modal,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import type { ZoneDetailResponse, ZoneRecord, ZoneInfo } from '../types';
import { AddRecordModal } from './AddRecordModal';
import {
  ImportZoneModal,
  CloneZoneModal,
  ConvertZoneModal,
  ZoneOptionsModal,
  SignZoneModal,
  UnsignZoneModal,
  ViewDsModal,
  DnssecPropertiesModal,
  PermissionsModal,
} from './ZoneModals';

const RECORD_TYPE_COLORS: Record<string, string> = {
  A: 'blue',
  AAAA: 'blue',
  NS: 'green',
  CNAME: 'violet',
  MX: 'orange',
  TXT: 'teal',
  SOA: 'red',
  SRV: 'pink',
  PTR: 'cyan',
  CAA: 'grape',
  DS: 'indigo',
  SSHFP: 'indigo',
  TLSA: 'indigo',
  HTTPS: 'yellow',
  SVCB: 'yellow',
  DNAME: 'violet',
  RP: 'orange',
  NAPTR: 'pink',
  DNSKEY: 'dark',
  RRSIG: 'dark',
  NSEC: 'dark',
  NSEC3: 'dark',
  NSEC3PARAM: 'dark',
  URI: 'yellow',
  ANAME: 'violet',
  FWD: 'teal',
  APP: 'grape',
};

interface ZoneDetailViewProps {
  zone: string;
  onBack: () => void;
}

export function ZoneDetailView({ zone, onBack }: ZoneDetailViewProps) {
  const { t } = useTranslation();

  // State
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsPerPage] = useState(20);

  // Add Record modal
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<ZoneRecord | null>(null);

  // Delete Record modal
  const [deleteRecordOpen, setDeleteRecordOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ZoneRecord | null>(null);

  // Modal states
  const [importOpen, setImportOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [unsignOpen, setUnsignOpen] = useState(false);
  const [dsOpen, setDsOpen] = useState(false);
  const [dnssecPropsOpen, setDnssecPropsOpen] = useState(false);
  const [permsOpen, setPermsOpen] = useState(false);

  // Fetch zone detail
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['zone-detail', zone],
    queryFn: async () => {
      const response = await apiClient.get<ZoneDetailResponse>(
        `/zones/records/get?domain=${encodeURIComponent(zone)}&zone=${encodeURIComponent(zone)}&listZone=true`
      );
      if (response.status !== 'ok' || !response.response) {
        throw new Error(response.errorMessage || 'Failed to fetch zone detail');
      }
      return response.response;
    },
    staleTime: 10_000,
  });

  const zoneInfo = data?.zone as (ZoneInfo & { displayName?: string }) | undefined;
  const records = data?.records || [];

  const isInternal = zoneInfo?.internal;
  const zoneType = zoneInfo?.type || 'Primary';

  const getStatus = () => {
    if (!zoneInfo) return 'Enabled';
    if (zoneInfo.disabled) return 'Disabled';
    if (zoneInfo.isExpired) return 'Expired';
    if (zoneInfo.validationFailed) return 'Validation Failed';
    if (zoneInfo.syncFailed) return 'Sync Failed';
    if (zoneInfo.notifyFailed) return 'Notify Failed';
    return 'Enabled';
  };

  const status = getStatus();

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Disabled':
        return 'gray';
      case 'Expired':
      case 'Validation Failed':
        return 'red';
      case 'Sync Failed':
      case 'Notify Failed':
        return 'yellow';
      default:
        return 'green';
    }
  };

  const getDnssecStatus = () => {
    if (!zoneInfo) return null;
    const s = zoneInfo.dnssecStatus;
    if (s === 'SignedWithNSEC' || s === 'SignedWithNSEC3') return s;
    return null;
  };

  const canAddRecord = () => {
    if (isInternal) return false;
    return zoneType === 'Primary' || zoneType === 'Forwarder';
  };

  const canResync = () => {
    return ['Secondary', 'SecondaryForwarder', 'SecondaryCatalog', 'Stub'].includes(zoneType);
  };

  const canExport = () => {
    return [
      'Primary',
      'Forwarder',
      'Secondary',
      'SecondaryForwarder',
      'SecondaryCatalog',
      'Catalog',
    ].includes(zoneType);
  };

  const canImport = () => {
    return zoneType === 'Primary' || zoneType === 'Forwarder';
  };

  const canConvert = () => {
    return ['Primary', 'Secondary', 'SecondaryForwarder', 'Forwarder', 'SecondaryCatalog'].includes(
      zoneType
    );
  };

  const canClone = () => {
    return zoneType === 'Primary' || zoneType === 'Forwarder';
  };

  const canShowOptions = () => {
    return [
      'Primary',
      'Secondary',
      'SecondaryForwarder',
      'SecondaryCatalog',
      'Stub',
      'Forwarder',
      'Catalog',
    ].includes(zoneType);
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = filterType === 'all' || r.type === filterType;
    return matchesSearch && matchesType;
  });

  // Paginate records
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / recordsPerPage));
  const currentPage = Math.min(recordsPage, totalPages);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Actions
  const handleEnable = async () => {
    try {
      await apiClient.post('/zones/enable', { zone });
      success(t('common.success'), t('zones.zoneEnabled', { zone }));
      await refetch();
    } catch {
      error(t('common.error'), t('zones.enableFailed'));
    }
  };

  const handleDisable = async () => {
    try {
      await apiClient.post('/zones/disable', { zone });
      success(t('common.success'), t('zones.zoneDisabled', { zone }));
      await refetch();
    } catch {
      error(t('common.error'), t('zones.disableFailed'));
    }
  };

  const handleDeleteZone = async () => {
    try {
      await apiClient.post('/zones/delete', { zone });
      success(t('common.success'), t('zones.zoneDeleted', { zone }));
      onBack();
    } catch {
      error(t('common.error'), t('zones.deleteFailed'));
    }
  };

  const handleResync = async () => {
    try {
      await apiClient.post('/zones/resync', { zone });
      success(t('common.success'), t('zones.zoneResynced', { zone }));
    } catch {
      error(t('common.error'), t('zones.zoneResyncFailed'));
    }
  };

  const handleExportZone = () => {
    const token = apiClient.getToken();
    if (token) {
      window.open(
        `/api/zones/export?token=${encodeURIComponent(token)}&zone=${encodeURIComponent(zone)}`,
        '_blank'
      );
      success(t('common.success'), t('zones.zoneExported'));
    }
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
      await apiClient.post('/zones/records/delete', {
        zone,
        domain: recordToDelete.name,
        type: recordToDelete.type,
        ...recordToDelete.rData,
      });
      success(t('common.success'), t('zones.recordDeleted'));
      setDeleteRecordOpen(false);
      setRecordToDelete(null);
      await refetch();
    } catch {
      error(t('common.error'), t('zones.recordDeleteFailed'));
    }
  };

  const handleRecordAdded = async () => {
    setAddRecordOpen(false);
    await refetch();
  };

  // Record type options for filter
  const recordTypeOptions = [
    { value: 'all', label: t('common.all') },
    ...Array.from(new Set(records.map(r => r.type)))
      .sort()
      .map(type => ({
        value: type,
        label: type,
      })),
  ];

  if (isLoading) {
    return (
      <Stack>
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={onBack} mb="md">
          {t('zones.backToZones')}
        </Button>
        <Skeleton height={60} mb="md" />
        <Skeleton height={40} mb="sm" />
        <Skeleton height={300} />
      </Stack>
    );
  }

  if (isError || !zoneInfo) {
    return (
      <Stack>
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={onBack} mb="md">
          {t('zones.backToZones')}
        </Button>
        <Center py="xl">
          <Text>{t('zones.loadFailed')}</Text>
        </Center>
      </Stack>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
            {t('zones.backToZones')}
          </Button>
        </Group>
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={() => refetch()}
          loading={isLoading}
        >
          {t('common.refresh')}
        </Button>
      </Group>

      {/* Zone Info Header */}
      <Paper shadow="sm" p="md" withBorder>
        <Group justify="space-between" wrap="wrap">
          <Group gap="xs">
            <Title order={3}>{zoneInfo.nameIdn || zoneInfo.name}</Title>
            <Badge color={isInternal ? 'gray' : 'blue'} variant="light">
              {zoneType}
            </Badge>
            {getDnssecStatus() && (
              <Badge color={zoneInfo.hasDnssecPrivateKeys ? 'blue' : 'gray'} variant="light">
                DNSSEC
              </Badge>
            )}
            <Badge color={getStatusColor(status)} variant="light">
              {status}
            </Badge>
            {zoneInfo.catalog && (
              <Badge color="gray" variant="light">
                {zoneInfo.catalog}
              </Badge>
            )}
            {isInternal && (
              <Badge color="gray" variant="light">
                {t('zones.internal')}
              </Badge>
            )}
          </Group>
          {zoneInfo.expiry && (
            <Text size="sm" c="dimmed">
              {t('zones.expiry')}: {new Date(zoneInfo.expiry).toLocaleString()}
            </Text>
          )}
        </Group>
      </Paper>

      {/* Action Buttons */}
      <Paper shadow="sm" p="md" withBorder>
        <Group gap="sm" wrap="wrap">
          {canAddRecord() && (
            <Button
              leftSection={<IconPlus size={14} />}
              size="sm"
              onClick={() => setAddRecordOpen(true)}
            >
              {t('zones.add')}
            </Button>
          )}

          {!isInternal && (
            <>
              {zoneInfo.disabled ? (
                <Button
                  leftSection={<IconCheck size={14} />}
                  size="sm"
                  color="green"
                  onClick={handleEnable}
                >
                  {t('zones.enable')}
                </Button>
              ) : (
                <Button
                  leftSection={<IconX size={14} />}
                  size="sm"
                  color="orange"
                  onClick={handleDisable}
                >
                  {t('zones.disable')}
                </Button>
              )}
            </>
          )}

          {canResync() && (
            <Button leftSection={<IconRefresh size={14} />} size="sm" onClick={handleResync}>
              {t('zones.resync')}
            </Button>
          )}

          <Menu shadow="md">
            <Menu.Target>
              <Button size="sm" variant="default">
                {t('zones.options')}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {canImport() && (
                <Menu.Item onClick={() => setImportOpen(true)}>{t('common.import')}</Menu.Item>
              )}
              {canExport() && (
                <Menu.Item onClick={handleExportZone}>{t('common.export')}</Menu.Item>
              )}
              {canConvert() && (
                <Menu.Item onClick={() => setConvertOpen(true)}>{t('zones.convertZone')}</Menu.Item>
              )}
              {canClone() && (
                <Menu.Item onClick={() => setCloneOpen(true)}>{t('zones.cloneZone')}</Menu.Item>
              )}
              {canShowOptions() && (
                <Menu.Item onClick={() => setOptionsOpen(true)}>{t('zones.zoneOptions')}</Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>

          {!isInternal && (
            <Button size="sm" variant="default" onClick={() => setPermsOpen(true)}>
              {t('zones.permissions')}
            </Button>
          )}

          {zoneType === 'Primary' && getDnssecStatus() && (
            <Menu shadow="md">
              <Menu.Target>
                <Button size="sm" variant="default">
                  DNSSEC
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => setSignOpen(true)}>Sign Zone</Menu.Item>
                <Menu.Item onClick={() => setUnsignOpen(true)}>Unsign Zone</Menu.Item>
                <Menu.Item onClick={() => setDsOpen(true)}>View DS Info</Menu.Item>
                <Menu.Item onClick={() => setDnssecPropsOpen(true)}>Properties</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}

          {!isInternal && (
            <Button size="sm" color="red" onClick={handleDeleteZone}>
              {t('common.delete')}
            </Button>
          )}
        </Group>
      </Paper>

      {/* Records Table */}
      <Paper shadow="sm" p="md" withBorder>
        <Group mb="md">
          <TextInput
            placeholder={t('zones.searchPlaceholder')}
            leftSection={<IconSearch size={16} />}
            value={searchText}
            onChange={e => {
              setSearchText(e.target.value);
              setRecordsPage(1);
            }}
            style={{ flex: 1 }}
          />
          <Select
            data={recordTypeOptions}
            value={filterType}
            onChange={value => {
              setFilterType(value || 'all');
              setRecordsPage(1);
            }}
            w={150}
          />
        </Group>

        {records.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">{t('zones.noRecords')}</Text>
          </Center>
        ) : filteredRecords.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">{t('common.noData')}</Text>
          </Center>
        ) : (
          <>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('zones.recordName')}</Table.Th>
                  <Table.Th>{t('zones.recordType')}</Table.Th>
                  <Table.Th>{t('zones.recordTTL')}</Table.Th>
                  <Table.Th>{t('zones.recordData')}</Table.Th>
                  <Table.Th>{t('zones.recordStatus')}</Table.Th>
                  <Table.Th style={{ width: 60 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedRecords.map((record, idx) => (
                  <Table.Tr key={`${record.name}-${record.type}-${idx}`}>
                    <Table.Td>
                      <Text size="sm">{record.nameIdn || record.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={RECORD_TYPE_COLORS[record.type] || 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {record.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{record.ttlString || record.ttl}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ maxWidth: 400 }} truncate="end">
                        {formatRecordData(record)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {record.disabled ? (
                        <Badge color="gray" size="sm" variant="light">
                          {t('common.disabled')}
                        </Badge>
                      ) : (
                        <Badge color="green" size="sm" variant="light">
                          {t('common.enabled')}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          onClick={() => {
                            setEditRecord(record);
                            setAddRecordOpen(true);
                          }}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => {
                            setRecordToDelete(record);
                            setDeleteRecordOpen(true);
                          }}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {totalPages > 1 && (
              <Group justify="space-between" mt="md">
                <Text size="sm" c="dimmed">
                  {t('zones.pagination.summary', {
                    start: (currentPage - 1) * recordsPerPage + 1,
                    end: Math.min(currentPage * recordsPerPage, filteredRecords.length),
                    total: filteredRecords.length,
                    page: currentPage,
                    pages: totalPages,
                  })}
                </Text>
                <Pagination
                  value={currentPage}
                  onChange={setRecordsPage}
                  total={totalPages}
                  size="sm"
                />
              </Group>
            )}
          </>
        )}
      </Paper>

      {/* Add/Edit Record Modal */}
      {addRecordOpen && (
        <AddRecordModal
          zone={zone}
          zoneType={zoneType}
          dnssecStatus={getDnssecStatus()}
          editRecord={editRecord}
          opened={addRecordOpen}
          onClose={() => {
            setAddRecordOpen(false);
            setEditRecord(null);
          }}
          onSuccess={handleRecordAdded}
        />
      )}

      {/* Delete Record Confirm */}
      <Modal
        opened={deleteRecordOpen}
        onClose={() => {
          setDeleteRecordOpen(false);
          setRecordToDelete(null);
        }}
        title={t('common.confirm')}
        centered
      >
        <Text mb="lg">{t('zones.confirmDeleteRecord')}</Text>
        {recordToDelete && (
          <Paper p="sm" withBorder mb="lg">
            <Text size="sm">
              <strong>{recordToDelete.name}</strong> <Badge size="sm">{recordToDelete.type}</Badge>
            </Text>
          </Paper>
        )}
        <Group justify="flex-end">
          <Button
            variant="subtle"
            onClick={() => {
              setDeleteRecordOpen(false);
              setRecordToDelete(null);
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button color="red" onClick={handleDeleteRecord}>
            {t('common.delete')}
          </Button>
        </Group>
      </Modal>

      {/* Zone Modals */}
      <ImportZoneModal
        zone={zone}
        opened={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          refetch();
        }}
      />
      <CloneZoneModal
        zone={zone}
        opened={cloneOpen}
        onClose={() => setCloneOpen(false)}
        onSuccess={() => {
          setCloneOpen(false);
          refetch();
        }}
      />
      <ConvertZoneModal
        zone={zone}
        zoneType={zoneType}
        opened={convertOpen}
        onClose={() => setConvertOpen(false)}
        onSuccess={() => {
          setConvertOpen(false);
          refetch();
        }}
      />
      <ZoneOptionsModal
        zone={zone}
        opened={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        onSuccess={() => {
          setOptionsOpen(false);
          refetch();
        }}
      />
      <SignZoneModal
        zone={zone}
        opened={signOpen}
        onClose={() => setSignOpen(false)}
        onSuccess={() => {
          setSignOpen(false);
          refetch();
        }}
      />
      <UnsignZoneModal
        zone={zone}
        opened={unsignOpen}
        onClose={() => setUnsignOpen(false)}
        onSuccess={() => {
          setUnsignOpen(false);
          refetch();
        }}
      />
      <ViewDsModal zone={zone} opened={dsOpen} onClose={() => setDsOpen(false)} />
      <DnssecPropertiesModal
        zone={zone}
        opened={dnssecPropsOpen}
        onClose={() => setDnssecPropsOpen(false)}
        onSuccess={() => {
          setDnssecPropsOpen(false);
          refetch();
        }}
      />
      <PermissionsModal zone={zone} opened={permsOpen} onClose={() => setPermsOpen(false)} />
    </Stack>
  );
}

function formatRecordData(record: ZoneRecord): string {
  const data = record.rData;
  if (!data) return '';
  if (data.ipAddress) return data.ipAddress as string;
  if (data.cname) return data.cname as string;
  if (data.nameServer) return data.nameServer as string;
  if (data.text) return (data.text as string).substring(0, 100);
  if (data.exchange) return `[${data.preference}] ${data.exchange}`;
  if (data.target) return `[${data.priority}|${data.weight}|${data.port}] ${data.target}`;
  if (data.ptrName) return data.ptrName as string;
  if (data.primaryNameServer) return data.primaryNameServer as string;
  if (data.dname) return data.dname as string;
  if (data.aname) return data.aname as string;
  if (data.forwarder) return data.forwarder as string;
  if (data.classPath) return data.classPath as string;
  return JSON.stringify(data);
}
