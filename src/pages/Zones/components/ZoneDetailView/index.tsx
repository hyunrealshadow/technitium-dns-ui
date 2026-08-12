import { useState } from 'react';
import { Badge, Button, Center, Group, Modal, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { success, error } from '../../../../components/notifications';
import { apiClient } from '../../../../api/client';
import { colorModeAtom, resolveColorMode } from '../../../../store/theme';
import type { ZoneDetailResponse, ZoneRecord, ZoneInfo } from '../../types';
import { AddRecordModal } from '../AddRecordModal';
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
} from '../ZoneModals';
import {
  DOT_BADGE_STYLE,
  filterRecords,
  disableRecordStateButtons as isStateButtonsDisabled,
  getDnssecStatus as getZoneDnssecStatus,
  getStatus as computeStatus,
  hideRecordActions as shouldHideActions,
} from './utils';
import { ZoneInfoHeader } from './components/ZoneInfoHeader';
import { RecordsTable } from './components/RecordsTable';

interface ZoneDetailViewProps {
  zone: string;
  onBack: () => void;
}

export function ZoneDetailView({ zone, onBack }: ZoneDetailViewProps) {
  const { t } = useTranslation();
  const [colorMode] = useAtom(colorModeAtom);
  const isDark = resolveColorMode(colorMode) === 'dark';
  const dotBadgeStyle = {
    ...DOT_BADGE_STYLE,
    ...(isDark ? { border: '1px solid var(--mantine-color-dark-4)' } : {}),
  };

  // State
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [hideDnssecRecords, setHideDnssecRecords] = useState(
    () => localStorage.getItem('zoneHideDnssecRecords') === 'true'
  );

  // Add/Edit Record modal
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<ZoneRecord | null>(null);

  // Delete / Disable Record confirm modals
  const [deleteRecordOpen, setDeleteRecordOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ZoneRecord | null>(null);
  const [disableRecordOpen, setDisableRecordOpen] = useState(false);
  const [recordToDisable, setRecordToDisable] = useState<ZoneRecord | null>(null);

  // Zone modals
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
        throw new Error(response.errorMessage || t('zones.detailLoadFailed'));
      }
      return response.response;
    },
    staleTime: 10_000,
  });

  const zoneInfo = data?.zone as (ZoneInfo & { displayName?: string }) | undefined;
  const records = data?.records || [];

  const isInternal = zoneInfo?.internal;
  const zoneType = zoneInfo?.type || 'Primary';
  const status = computeStatus(zoneInfo);
  const dnssecStatus = getZoneDnssecStatus(zoneInfo);

  const filteredRecords = filterRecords(records, zone, hideDnssecRecords, filterType, searchText);

  const toggleHideDnssecRecords = () => {
    const newValue = !hideDnssecRecords;
    setHideDnssecRecords(newValue);
    localStorage.setItem('zoneHideDnssecRecords', String(newValue));
    setRecordsPage(1);
  };

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

  const handleExportZone = async () => {
    try {
      const token = await apiClient.createSingleUseToken();
      window.open(
        `/api/zones/export?token=${encodeURIComponent(token)}&zone=${encodeURIComponent(zone)}`,
        '_blank'
      );
      success(t('common.success'), t('zones.zoneExported'));
    } catch {
      error(t('common.error'), t('zones.zoneExportFailed'));
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

  const doToggleRecordState = async (record: ZoneRecord, disable: boolean) => {
    try {
      await apiClient.post('/zones/records/update', {
        zone,
        domain: record.name,
        type: record.type,
        ttl: record.ttl,
        disable,
        comments: record.comments,
        ...record.rData,
      });
      success(t('common.success'), disable ? t('zones.recordDisabled') : t('zones.recordEnabled'));
      setDisableRecordOpen(false);
      setRecordToDisable(null);
      await refetch();
    } catch {
      error(t('common.error'), t('zones.recordStateUpdateFailed'));
    }
  };

  const handleToggleRecordState = (record: ZoneRecord, disable: boolean) => {
    if (disable) {
      setRecordToDisable(record);
      setDisableRecordOpen(true);
      return;
    }
    doToggleRecordState(record, false);
  };

  const handleRecordAdded = async () => {
    setAddRecordOpen(false);
    setEditRecord(null);
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
      <ZoneInfoHeader
        zoneInfo={zoneInfo}
        isInternal={isInternal}
        zoneType={zoneType}
        status={status}
        dotBadgeStyle={dotBadgeStyle}
        dnssecStatus={dnssecStatus}
        hideDnssecRecords={hideDnssecRecords}
        loading={isLoading}
        onBack={onBack}
        onRefresh={() => refetch()}
        onEnable={handleEnable}
        onDisable={handleDisable}
        onResync={handleResync}
        onExport={handleExportZone}
        onToggleHideDnssec={toggleHideDnssecRecords}
        onAddRecord={() => setAddRecordOpen(true)}
        onImport={() => setImportOpen(true)}
        onConvert={() => setConvertOpen(true)}
        onClone={() => setCloneOpen(true)}
        onOptions={() => setOptionsOpen(true)}
        onPermissions={() => setPermsOpen(true)}
        onSign={() => setSignOpen(true)}
        onUnsign={() => setUnsignOpen(true)}
        onViewDs={() => setDsOpen(true)}
        onDnssecProps={() => setDnssecPropsOpen(true)}
        onDelete={handleDeleteZone}
      />

      <RecordsTable
        zone={zone}
        records={records}
        paginatedRecords={paginatedRecords}
        filteredCount={filteredRecords.length}
        currentPage={currentPage}
        totalPages={totalPages}
        recordsPerPage={recordsPerPage}
        searchText={searchText}
        filterType={filterType}
        recordTypeOptions={recordTypeOptions}
        dotBadgeStyle={dotBadgeStyle}
        onSearchChange={value => {
          setSearchText(value);
          setRecordsPage(1);
        }}
        onFilterTypeChange={value => {
          setFilterType(value);
          setRecordsPage(1);
        }}
        onRecordsPerPageChange={value => {
          setRecordsPerPage(value);
          setRecordsPage(1);
        }}
        onPageChange={setRecordsPage}
        onEdit={record => {
          setEditRecord(record);
          setAddRecordOpen(true);
        }}
        onToggleState={handleToggleRecordState}
        onDelete={record => {
          setRecordToDelete(record);
          setDeleteRecordOpen(true);
        }}
        hideActions={record => shouldHideActions(zoneType, record)}
        disableStateButtons={isStateButtonsDisabled}
      />

      {/* Add/Edit Record Modal */}
      {addRecordOpen && (
        <AddRecordModal
          zone={zone}
          zoneType={zoneType}
          dnssecStatus={dnssecStatus}
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

      {/* Disable Record Confirm */}
      <Modal
        opened={disableRecordOpen}
        onClose={() => {
          setDisableRecordOpen(false);
          setRecordToDisable(null);
        }}
        title={t('common.confirm')}
        centered
      >
        <Text mb="lg">
          {t('zones.confirmDisableRecord', {
            type: recordToDisable?.type,
            name: recordToDisable?.name || '.',
          })}
        </Text>
        <Group justify="flex-end">
          <Button
            variant="subtle"
            onClick={() => {
              setDisableRecordOpen(false);
              setRecordToDisable(null);
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            color="red"
            onClick={() => recordToDisable && doToggleRecordState(recordToDisable, true)}
          >
            {t('zones.disable')}
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
