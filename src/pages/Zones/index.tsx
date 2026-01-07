import { useEffect, useState } from 'react';
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
  Tabs,
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
import { notifications } from '@mantine/notifications';
import { apiClient } from '../../api/client';
import type { ZonesListResponse, ZoneType } from './types';

const ZONE_TYPE_COLORS: Record<ZoneType, string> = {
  Primary: 'blue',
  Secondary: 'green',
  Stub: 'orange',
  Forwarder: 'violet',
  SecondaryForwarder: 'teal',
  SecondaryCatalog: 'pink',
  ForwarderCatalog: 'grape',
  Hint: 'gray',
  Cache: 'dark',
};

async function fetchZones(page: number, pageSize: number): Promise<ZonesListResponse> {
  const response = await apiClient.get<ZonesListResponse>(
    `/zones/list?pageNumber=${page}&zonesPerPage=${pageSize}`
  );
  if (response.status !== 'ok' || !response.response) {
    throw new Error(response.errorMessage || 'Failed to fetch zones');
  }
  return response.response;
}

export function ZonesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ from: '/_authenticated/zones' });
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Get page and pageSize from URL
  const page = search.page;
  const pageSize = search.pageSize;

  // Add zone modal
  const [addZoneModalOpen, setAddZoneModalOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState<ZoneType>('Primary');

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);

  // Use react-query for data fetching
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['zones', page, pageSize],
    queryFn: () => fetchZones(page, pageSize),
    staleTime: 30_000,
  });

  // Loading state - only show skeleton after a delay
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    // Only show skeleton if fetching takes longer than threshold
    const timer = setTimeout(() => {
      if (isFetching) {
        setShowSkeleton(true);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isFetching]);

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/zones',
      search: { page: newPage, pageSize },
    });
  };

  useEffect(() => {
    if (!isFetching && showSkeleton) {
      // Hide skeleton with transition delay after fetching completes
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFetching, showSkeleton]);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleEnableZone = async (zoneName: string) => {
    try {
      const response = await apiClient.post('/zones/enable', { zone: zoneName });
      if (response.status === 'ok') {
        notifications.show({
          title: t('common.success'),
          message: t('zones.enabled', { zone: zoneName }),
          color: 'green',
        });
        await queryClient.invalidateQueries({ queryKey: ['zones'] });
      } else {
        throw new Error(response.errorMessage);
      }
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('zones.enableFailed'),
        color: 'red',
      });
    }
  };

  const handleDisableZone = async (zoneName: string) => {
    try {
      const response = await apiClient.post('/zones/disable', { zone: zoneName });
      if (response.status === 'ok') {
        notifications.show({
          title: t('common.success'),
          message: t('zones.disabled', { zone: zoneName }),
          color: 'green',
        });
        await queryClient.invalidateQueries({ queryKey: ['zones'] });
      } else {
        throw new Error(response.errorMessage);
      }
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('zones.disableFailed'),
        color: 'red',
      });
    }
  };

  const handleDeleteZone = async (zoneName: string) => {
    try {
      const response = await apiClient.post('/zones/delete', { zone: zoneName });
      if (response.status === 'ok') {
        notifications.show({
          title: t('common.success'),
          message: t('zones.deleted', { zone: zoneName }),
          color: 'green',
        });
        await queryClient.invalidateQueries({ queryKey: ['zones'] });
      } else {
        throw new Error(response.errorMessage);
      }
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('zones.deleteFailed'),
        color: 'red',
      });
    }
  };

  const confirmDeleteZone = (zoneName: string) => {
    setZoneToDelete(zoneName);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (zoneToDelete) {
      await handleDeleteZone(zoneToDelete);
      setDeleteModalOpen(false);
      setZoneToDelete(null);
    }
  };

  const handleCreateZone = async () => {
    if (!newZoneName.trim()) {
      notifications.show({
        title: t('common.error'),
        message: t('zones.nameRequired'),
        color: 'red',
      });
      return;
    }

    try {
      const response = await apiClient.post('/zones/create', {
        zone: newZoneName,
        type: newZoneType,
      });

      if (response.status === 'ok') {
        notifications.show({
          title: t('common.success'),
          message: t('zones.created', { zone: newZoneName }),
          color: 'green',
        });
        setAddZoneModalOpen(false);
        setNewZoneName('');
        await queryClient.invalidateQueries({ queryKey: ['zones'] });
      } else {
        throw new Error(response.errorMessage);
      }
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('zones.createFailed'),
        color: 'red',
      });
    }
  };

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

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>{t('nav.zones')}</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setAddZoneModalOpen(true)}>
            {t('zones.addZone')}
          </Button>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={isFetching}
          >
            {t('common.refresh')}
          </Button>
        </Group>
      </Group>

      <Paper shadow="sm" p="md" withBorder>
        <Group mb="md">
          <TextInput
            placeholder={t('zones.searchPlaceholder')}
            leftSection={<IconSearch size={16} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            data={zoneTypeOptions}
            value={filterType}
            onChange={value => setFilterType(value || 'all')}
            w={150}
          />
        </Group>

        {showSkeleton ? (
          <>
            <Skeleton height={40} mb="sm" />
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('zones.name')}</Table.Th>
                  <Table.Th>{t('zones.type')}</Table.Th>
                  <Table.Th>{t('zones.serial')}</Table.Th>
                  <Table.Th>{t('zones.status')}</Table.Th>
                  <Table.Th style={{ width: 60 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Skeleton height={20} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={24} width={80} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={20} width={60} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={24} width={60} />
                    </Table.Td>
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
            <Stack align="center">
              <Text>{t('zones.loadFailed')}</Text>
            </Stack>
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
                  <Table.Th>{t('zones.name')}</Table.Th>
                  <Table.Th>{t('zones.type')}</Table.Th>
                  <Table.Th>{t('zones.serial')}</Table.Th>
                  <Table.Th>{t('zones.status')}</Table.Th>
                  <Table.Th style={{ width: 60 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredZones.map(zone => (
                  <Table.Tr key={zone.name}>
                    <Table.Td>
                      <Group gap="xs">
                        <Text size="sm" fw={500}>
                          {zone.nameIdn || zone.name}
                        </Text>
                        {zone.nameIdn && (
                          <Tooltip label={zone.name}>
                            <Badge size="xs" variant="light">
                              IDN
                            </Badge>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={ZONE_TYPE_COLORS[zone.type]} variant="light">
                        {t(`zones.types.${zone.type}`)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{zone.soaSerial}</Text>
                    </Table.Td>
                    <Table.Td>
                      {zone.disabled ? (
                        <Badge color="red" variant="light">
                          {t('common.disabled')}
                        </Badge>
                      ) : (
                        <Badge color="green" variant="light">
                          {t('common.enabled')}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Menu position="bottom-end" shadow="sm">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
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
                          <Menu.Divider />
                          <Menu.Item leftSection={<IconEdit size={14} />}>
                            {t('zones.records')}
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={() => confirmDeleteZone(zone.name)}
                          >
                            {t('common.delete')}
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
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
                  onChange={handlePageChange}
                  total={data.totalPages}
                  size="sm"
                />
              </Group>
            )}
          </>
        )}
      </Paper>

      {/* Add Zone Modal */}
      <Modal
        opened={addZoneModalOpen}
        onClose={() => setAddZoneModalOpen(false)}
        title={t('zones.addZone')}
        size="md"
      >
        <Stack>
          <Tabs value={newZoneType} onChange={value => setNewZoneType(value as ZoneType)}>
            <Tabs.List>
              <Tabs.Tab value="Primary">{t('zones.types.Primary')}</Tabs.Tab>
              <Tabs.Tab value="Secondary">{t('zones.types.Secondary')}</Tabs.Tab>
              <Tabs.Tab value="Stub">{t('zones.types.Stub')}</Tabs.Tab>
              <Tabs.Tab value="Forwarder">{t('zones.types.Forwarder')}</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="Primary" pt="md">
              <Stack>
                <TextInput
                  label={t('zones.name')}
                  placeholder="example.com"
                  value={newZoneName}
                  onChange={e => setNewZoneName(e.target.value)}
                  required
                />
                <Text size="sm" c="dimmed">
                  {t('zones.addPrimaryHint')}
                </Text>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="Secondary" pt="md">
              <Stack>
                <TextInput
                  label={t('zones.name')}
                  placeholder="example.com"
                  value={newZoneName}
                  onChange={e => setNewZoneName(e.target.value)}
                  required
                />
                <TextInput label={t('zones.primaryNsAddresses')} placeholder="1.2.3.4" />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="Stub" pt="md">
              <Stack>
                <TextInput
                  label={t('zones.name')}
                  placeholder="example.com"
                  value={newZoneName}
                  onChange={e => setNewZoneName(e.target.value)}
                  required
                />
                <TextInput label={t('zones.primaryNsAddresses')} placeholder="1.2.3.4" />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="Forwarder" pt="md">
              <Stack>
                <TextInput
                  label={t('zones.name')}
                  placeholder="example.com"
                  value={newZoneName}
                  onChange={e => setNewZoneName(e.target.value)}
                  required
                />
                <TextInput label={t('zones.forwarder')} placeholder="8.8.8.8" />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setAddZoneModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateZone}>{t('zones.addZone')}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
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
          <Button color="red" onClick={handleConfirmDelete}>
            {t('common.delete')}
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
