import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Anchor,
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
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { success, error } from '../../components/notifications';
import { apiClient } from '../../api/client';
import i18n from '../../i18n';
import { colorModeAtom, resolveColorMode } from '../../store/theme';
import type { ZonesListResponse, ZoneInfo } from './types';
import { ZoneDetailView } from './components/ZoneDetailView';
import { AddZoneModal } from './components/AddZoneModal';
import {
  ImportZoneModal,
  CloneZoneModal,
  ConvertZoneModal,
  ZoneOptionsModal,
  PermissionsModal,
} from './components/ZoneModals';

// 表格内 dot Badge 固定 body 背景，避免行 hover 高亮时 badge 融入行背景；文本光标便于选中复制
const DOT_BADGE_STYLE = { backgroundColor: 'var(--mantine-color-body)', cursor: 'text' };

const ZONE_TYPE_COLORS: Record<string, string> = {
  Primary: 'blue',
  Secondary: 'green',
  Stub: 'orange',
  Forwarder: 'violet',
  SecondaryForwarder: 'teal',
  SecondaryCatalog: 'pink',
  ForwarderCatalog: 'grape',
  Hint: 'gray',
  Cache: 'dark',
  Catalog: 'cyan',
  Internal: 'gray',
};

const ZONE_STATUS_COLORS: Record<string, string> = {
  Enabled: 'green',
  Disabled: 'gray',
  Expired: 'red',
  'Validation Failed': 'red',
  'Sync Failed': 'yellow',
  'Notify Failed': 'yellow',
};

async function fetchZones(page: number, pageSize: number): Promise<ZonesListResponse> {
  const response = await apiClient.get<ZonesListResponse>(
    `/zones/list?pageNumber=${page}&zonesPerPage=${pageSize}`
  );
  if (response.status !== 'ok' || !response.response) {
    throw new Error(response.errorMessage || i18n.t('zones.loadFailed'));
  }
  return response.response;
}

function getZoneStatus(zone: ZoneInfo): string {
  if (zone.disabled) return 'Disabled';
  if (zone.isExpired) return 'Expired';
  if (zone.validationFailed) return 'Validation Failed';
  if (zone.syncFailed) return 'Sync Failed';
  if (zone.notifyFailed) return 'Notify Failed';
  return 'Enabled';
}

function getDnssecLabel(zone: ZoneInfo): string | null {
  const s = zone.dnssecStatus;
  if (s === 'SignedWithNSEC' || s === 'SignedWithNSEC3') return 'DNSSEC';
  return null;
}

export function ZonesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ from: '/_authenticated/zones' });
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');

  const page = search.page;
  const pageSize = search.pageSize;
  const selectedZone = search.zone;
  const filterType = search.filterType || 'all';

  const [showSkeleton, setShowSkeleton] = useState(false);

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['zones', page, pageSize],
    queryFn: () => fetchZones(page, pageSize),
    staleTime: 30_000,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isFetching) setShowSkeleton(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [isFetching]);

  useEffect(() => {
    if (!isFetching && showSkeleton) {
      const timer = setTimeout(() => setShowSkeleton(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isFetching, showSkeleton]);

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/zones',
      search: { page: newPage, pageSize },
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    navigate({
      to: '/zones',
      search: {
        page: 1,
        pageSize: newPageSize,
        filterType: filterType === 'all' ? undefined : filterType,
      },
    });
  };

  const handleFilterTypeChange = (newType: string) => {
    navigate({
      to: '/zones',
      search: { page: 1, pageSize, filterType: newType === 'all' ? undefined : newType },
    });
  };

  const handleSelectZone = (zone: string) => {
    navigate({
      to: '/zones',
      search: {
        zone,
        page: 1,
        pageSize,
        filterType: filterType === 'all' ? undefined : filterType,
      },
    });
  };

  const handleBackToList = () => {
    navigate({
      to: '/zones',
      search: { page, pageSize, filterType: filterType === 'all' ? undefined : filterType },
    });
  };

  const handleRefresh = async () => {
    await refetch();
  };

  // If a zone is selected, show the detail view
  if (selectedZone) {
    return <ZoneDetailView zone={selectedZone} onBack={handleBackToList} />;
  }

  // List view
  const filteredZones = (data?.zones || []).filter(zone => {
    const matchesSearch =
      zone.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (zone.nameIdn && zone.nameIdn.toLowerCase().includes(searchText.toLowerCase()));
    const matchesType = filterType === 'all' || zone.type === filterType;
    return matchesSearch && matchesType;
  });

  const zoneTypeOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'Primary', label: t('zones.types.Primary') },
    { value: 'Secondary', label: t('zones.types.Secondary') },
    { value: 'Stub', label: t('zones.types.Stub') },
    { value: 'Forwarder', label: t('zones.types.Forwarder') },
    { value: 'SecondaryForwarder', label: t('zones.types.SecondaryForwarder') },
    { value: 'SecondaryCatalog', label: t('zones.types.SecondaryCatalog') },
    { value: 'ForwarderCatalog', label: t('zones.types.ForwarderCatalog') },
  ];

  const handleRefreshWithCallback = async () => {
    await handleRefresh();
  };

  return (
    <ZoneListView
      t={t}
      data={data}
      isFetching={isFetching}
      isError={isError}
      showSkeleton={showSkeleton}
      filteredZones={filteredZones}
      searchText={searchText}
      onSearchChange={setSearchText}
      filterType={filterType}
      onFilterTypeChange={handleFilterTypeChange}
      page={page}
      pageSize={pageSize}
      zoneTypeOptions={zoneTypeOptions}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      onRefresh={handleRefreshWithCallback}
      onSelectZone={handleSelectZone}
      queryClient={queryClient}
    />
  );
}

interface ZoneListViewProps {
  t: (key: string, options?: Record<string, unknown>) => string;
  data: ZonesListResponse | undefined;
  isFetching: boolean;
  isError: boolean;
  showSkeleton: boolean;
  filteredZones: ZoneInfo[];
  searchText: string;
  onSearchChange: (v: string) => void;
  filterType: string;
  onFilterTypeChange: (v: string) => void;
  page: number;
  pageSize: number;
  zoneTypeOptions: { value: string; label: string }[];
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => Promise<void>;
  onSelectZone: (zone: string) => void;
  queryClient: ReturnType<typeof useQueryClient>;
}

function ZoneListView({
  t,
  data,
  isFetching,
  isError,
  showSkeleton,
  filteredZones,
  searchText,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  page,
  pageSize,
  zoneTypeOptions,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onSelectZone,
  queryClient,
}: ZoneListViewProps) {
  const [colorMode] = useAtom(colorModeAtom);
  const isDark = resolveColorMode(colorMode) === 'dark';
  const dotBadgeStyle = {
    ...DOT_BADGE_STYLE,
    ...(isDark ? { border: '1px solid var(--mantine-color-dark-4)' } : {}),
  };
  const [addZoneModalOpen, setAddZoneModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);

  const [actionZone, setActionZone] = useState<ZoneInfo | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [permsModalOpen, setPermsModalOpen] = useState(false);

  const handleEnableZone = async (zoneName: string) => {
    try {
      await apiClient.post('/zones/enable', { zone: zoneName });
      success(t('common.success'), t('zones.enabled', { zone: zoneName }));
      await queryClient.invalidateQueries({ queryKey: ['zones'] });
    } catch {
      error(t('common.error'), t('zones.enableFailed'));
    }
  };

  const handleDisableZone = async (zoneName: string) => {
    try {
      await apiClient.post('/zones/disable', { zone: zoneName });
      success(t('common.success'), t('zones.disabled', { zone: zoneName }));
      await queryClient.invalidateQueries({ queryKey: ['zones'] });
    } catch {
      error(t('common.error'), t('zones.disableFailed'));
    }
  };

  const handleDeleteZone = async (zoneName: string) => {
    try {
      await apiClient.post('/zones/delete', { zone: zoneName });
      success(t('common.success'), t('zones.deleted', { zone: zoneName }));
      await queryClient.invalidateQueries({ queryKey: ['zones'] });
    } catch {
      error(t('common.error'), t('zones.deleteFailed'));
    }
    setDeleteModalOpen(false);
    setZoneToDelete(null);
  };

  const handleAddZoneSuccess = async () => {
    setAddZoneModalOpen(false);
    await queryClient.invalidateQueries({ queryKey: ['zones'] });
  };

  const handleResync = async (zoneName: string) => {
    try {
      await apiClient.post('/zones/resync', { zone: zoneName });
      success(t('common.success'), t('zones.zoneResynced', { zone: zoneName }));
    } catch {
      error(t('common.error'), t('zones.zoneResyncFailed'));
    }
  };

  const handleExportZone = (zoneName: string) => {
    const token = apiClient.getToken();
    if (token) {
      window.open(
        `/api/zones/export?token=${encodeURIComponent(token)}&zone=${encodeURIComponent(zoneName)}`,
        '_blank'
      );
      success(t('common.success'), t('zones.zoneExported'));
    }
  };

  const canResync = (type: string) =>
    ['Secondary', 'SecondaryForwarder', 'SecondaryCatalog', 'Stub'].includes(type);

  const canImport = (type: string) => type === 'Primary' || type === 'Forwarder';

  const canExport = (type: string) =>
    [
      'Primary',
      'Forwarder',
      'Secondary',
      'SecondaryForwarder',
      'SecondaryCatalog',
      'Catalog',
    ].includes(type);

  const canConvert = (type: string) =>
    ['Primary', 'Secondary', 'SecondaryForwarder', 'Forwarder', 'SecondaryCatalog'].includes(type);

  const canClone = (type: string) => type === 'Primary' || type === 'Forwarder';

  const canShowOptions = (type: string) =>
    [
      'Primary',
      'Secondary',
      'SecondaryForwarder',
      'SecondaryCatalog',
      'Stub',
      'Forwarder',
      'Catalog',
    ].includes(type);

  const handleZoneActionSuccess = async () => {
    setImportModalOpen(false);
    setCloneModalOpen(false);
    setConvertModalOpen(false);
    setOptionsModalOpen(false);
    await queryClient.invalidateQueries({ queryKey: ['zones'] });
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>{t('nav.zones')}</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setAddZoneModalOpen(true)}>
            {t('zones.addZone')}
          </Button>
          <Button leftSection={<IconRefresh size={16} />} onClick={onRefresh} loading={isFetching}>
            {t('common.refresh')}
          </Button>
        </Group>
      </Group>

      <Paper shadow="sm" p="md" withBorder>
        <Group mb="md" align="end">
          <TextInput
            label={t('zones.search')}
            placeholder={t('zones.searchPlaceholder')}
            leftSection={<IconSearch size={16} />}
            value={searchText}
            onChange={e => onSearchChange(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            label={t('zones.type')}
            data={zoneTypeOptions}
            value={filterType}
            onChange={value => onFilterTypeChange(value || 'all')}
            w={150}
          />
          <Select
            label={t('zones.perPage')}
            data={['10', '25', '50', '100', '250', '500']}
            value={String(pageSize)}
            onChange={value => onPageSizeChange(Number(value || 10))}
            w={90}
            allowDeselect={false}
          />
        </Group>

        {showSkeleton ? (
          <>
            <Skeleton height={40} mb="sm" />
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 50 }}>#</Table.Th>
                  <Table.Th>{t('zones.name')}</Table.Th>
                  <Table.Th>{t('zones.type')}</Table.Th>
                  <Table.Th>{t('zones.dnssec')}</Table.Th>
                  <Table.Th>{t('zones.statusColumn')}</Table.Th>
                  <Table.Th>{t('zones.serial')}</Table.Th>
                  <Table.Th>{t('zones.expiry')}</Table.Th>
                  <Table.Th>{t('zones.lastModified')}</Table.Th>
                  <Table.Th style={{ width: 60 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <Table.Td key={j}>
                        <Skeleton height={20} />
                      </Table.Td>
                    ))}
                    <Table.Td>
                      <Skeleton height={36} width={36} circle />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        ) : isError ? (
          <Center py="xl">
            <Text>{t('zones.loadFailed')}</Text>
          </Center>
        ) : filteredZones.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">{t('common.noData')}</Text>
          </Center>
        ) : (
          <>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 50 }}>#</Table.Th>
                  <Table.Th>{t('zones.name')}</Table.Th>
                  <Table.Th>{t('zones.type')}</Table.Th>
                  <Table.Th>{t('zones.dnssec')}</Table.Th>
                  <Table.Th>{t('zones.statusColumn')}</Table.Th>
                  <Table.Th>{t('zones.serial')}</Table.Th>
                  <Table.Th>{t('zones.expiry')}</Table.Th>
                  <Table.Th>{t('zones.lastModified')}</Table.Th>
                  <Table.Th style={{ width: 60 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredZones.map((zone, idx) => {
                  const status = getZoneStatus(zone);
                  const dnssecLabel = getDnssecLabel(zone);
                  return (
                    <Table.Tr key={zone.name}>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {(page - 1) * pageSize + idx + 1}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Anchor
                            size="sm"
                            fw={500}
                            style={{ maxWidth: 320 }}
                            truncate
                            onClick={e => {
                              e.preventDefault();
                              onSelectZone(zone.name);
                            }}
                          >
                            {zone.nameIdn || zone.name || '<root>'}
                          </Anchor>
                          {zone.nameIdn && (
                            <Tooltip label={zone.name}>
                              <Badge
                                size="xs"
                                variant="dot"
                                color="gray"
                                tt="none"
                                style={dotBadgeStyle}
                              >
                                IDN
                              </Badge>
                            </Tooltip>
                          )}
                          {zone.catalog && (
                            <Badge
                              size="xs"
                              variant="dot"
                              color="gray"
                              tt="none"
                              style={dotBadgeStyle}
                            >
                              {zone.catalog}
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={zone.internal ? 'gray' : ZONE_TYPE_COLORS[zone.type] || 'gray'}
                          variant="dot"
                          size="sm"
                          tt="none"
                          style={dotBadgeStyle}
                        >
                          {zone.internal ? t('zones.internal') : t(`zones.types.${zone.type}`)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {dnssecLabel && (
                          <Badge
                            color={zone.hasDnssecPrivateKeys ? 'blue' : 'gray'}
                            variant="dot"
                            size="sm"
                            tt="none"
                            style={dotBadgeStyle}
                          >
                            {dnssecLabel}
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={ZONE_STATUS_COLORS[status] || 'green'}
                          variant="dot"
                          size="sm"
                          tt="none"
                          style={dotBadgeStyle}
                        >
                          {t(`zones.status.${status}`)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{zone.soaSerial ?? '-'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {zone.expiry ? new Date(zone.expiry).toLocaleString() : '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {zone.lastModified ? new Date(zone.lastModified).toLocaleString() : '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Menu position="bottom-end" shadow="sm">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => onSelectZone(zone.name)}
                            >
                              {t('zones.records')}
                            </Menu.Item>
                            {!zone.internal && (
                              <>
                                <Menu.Divider />
                                {zone.disabled ? (
                                  <Menu.Item
                                    leftSection={<IconCheck size={14} />}
                                    onClick={() => handleEnableZone(zone.name)}
                                  >
                                    {t('zones.enable')}
                                  </Menu.Item>
                                ) : (
                                  <Menu.Item
                                    leftSection={<IconX size={14} />}
                                    onClick={() => handleDisableZone(zone.name)}
                                  >
                                    {t('zones.disable')}
                                  </Menu.Item>
                                )}
                              </>
                            )}
                            {canResync(zone.type) && (
                              <Menu.Item onClick={() => handleResync(zone.name)}>
                                {t('zones.resync')}
                              </Menu.Item>
                            )}
                            {canImport(zone.type) && (
                              <Menu.Item
                                onClick={() => {
                                  setActionZone(zone);
                                  setImportModalOpen(true);
                                }}
                              >
                                {t('common.import')}
                              </Menu.Item>
                            )}
                            {canExport(zone.type) && (
                              <Menu.Item onClick={() => handleExportZone(zone.name)}>
                                {t('common.export')}
                              </Menu.Item>
                            )}
                            {canConvert(zone.type) && (
                              <Menu.Item
                                onClick={() => {
                                  setActionZone(zone);
                                  setConvertModalOpen(true);
                                }}
                              >
                                {t('zones.convertZone')}
                              </Menu.Item>
                            )}
                            {canClone(zone.type) && (
                              <Menu.Item
                                onClick={() => {
                                  setActionZone(zone);
                                  setCloneModalOpen(true);
                                }}
                              >
                                {t('zones.cloneZone')}
                              </Menu.Item>
                            )}
                            {!zone.internal && (
                              <Menu.Item
                                onClick={() => {
                                  setActionZone(zone);
                                  setPermsModalOpen(true);
                                }}
                              >
                                {t('zones.permissions')}
                              </Menu.Item>
                            )}
                            {canShowOptions(zone.type) && (
                              <Menu.Item
                                onClick={() => {
                                  setActionZone(zone);
                                  setOptionsModalOpen(true);
                                }}
                              >
                                {t('zones.zoneOptions')}
                              </Menu.Item>
                            )}
                            {!zone.internal && (
                              <>
                                <Menu.Divider />
                                <Menu.Item
                                  leftSection={<IconTrash size={14} />}
                                  color="red"
                                  onClick={() => {
                                    setZoneToDelete(zone.name);
                                    setDeleteModalOpen(true);
                                  }}
                                >
                                  {t('common.delete')}
                                </Menu.Item>
                              </>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>

            {data && (
              <Group justify="space-between" mt="md">
                <Text size="sm" c="dimmed">
                  {data.totalZones > 0
                    ? t('zones.pagination.summary', {
                        start: (page - 1) * pageSize + 1,
                        end: Math.min(page * pageSize, data.totalZones),
                        total: data.totalZones,
                        page,
                        pages: data.totalPages,
                      })
                    : t('zones.pagination.empty')}
                </Text>
                <Pagination
                  value={page}
                  onChange={onPageChange}
                  total={data.totalPages}
                  size="sm"
                />
              </Group>
            )}
          </>
        )}
      </Paper>

      <AddZoneModal
        opened={addZoneModalOpen}
        onClose={() => setAddZoneModalOpen(false)}
        onSuccess={handleAddZoneSuccess}
      />

      {actionZone && (
        <>
          <ImportZoneModal
            zone={actionZone.name}
            opened={importModalOpen}
            onClose={() => setImportModalOpen(false)}
            onSuccess={handleZoneActionSuccess}
          />
          <CloneZoneModal
            zone={actionZone.name}
            opened={cloneModalOpen}
            onClose={() => setCloneModalOpen(false)}
            onSuccess={handleZoneActionSuccess}
          />
          <ConvertZoneModal
            zone={actionZone.name}
            zoneType={actionZone.type}
            opened={convertModalOpen}
            onClose={() => setConvertModalOpen(false)}
            onSuccess={handleZoneActionSuccess}
          />
          <ZoneOptionsModal
            zone={actionZone.name}
            opened={optionsModalOpen}
            onClose={() => setOptionsModalOpen(false)}
            onSuccess={handleZoneActionSuccess}
          />
          <PermissionsModal
            zone={actionZone.name}
            opened={permsModalOpen}
            onClose={() => setPermsModalOpen(false)}
          />
        </>
      )}

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('common.confirm')}
        centered
      >
        <Text mb="lg">{t('zones.deleteConfirm', { zone: zoneToDelete })}</Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setDeleteModalOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button color="red" onClick={() => zoneToDelete && handleDeleteZone(zoneToDelete)}>
            {t('common.delete')}
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
