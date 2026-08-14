import {
  Badge,
  Button,
  Center,
  Group,
  Pagination,
  Paper,
  Select,
  Table,
  Text,
  TextInput,
  type CSSProperties,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { RecordTtl } from '../../../../../components/RecordTtl';
import type { ZoneRecord } from '../../../types';
import { formatRecordName, RECORD_TYPE_COLORS } from '../utils';
import { RecordDataCell } from './RecordDataCell';

// 记录表格：搜索/类型过滤/分页与行内操作
export function RecordsTable({
  zone,
  records,
  paginatedRecords,
  filteredCount,
  currentPage,
  totalPages,
  recordsPerPage,
  searchText,
  filterType,
  recordTypeOptions,
  dotBadgeStyle,
  onSearchChange,
  onFilterTypeChange,
  onRecordsPerPageChange,
  onPageChange,
  onEdit,
  onToggleState,
  onDelete,
  hideActions,
  disableStateButtons,
}: {
  zone: string;
  records: ZoneRecord[];
  paginatedRecords: ZoneRecord[];
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  recordsPerPage: number;
  searchText: string;
  filterType: string;
  recordTypeOptions: { value: string; label: string }[];
  dotBadgeStyle: CSSProperties;
  onSearchChange: (value: string) => void;
  onFilterTypeChange: (value: string) => void;
  onRecordsPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
  onEdit: (record: ZoneRecord) => void;
  onToggleState: (record: ZoneRecord, disable: boolean) => void;
  onDelete: (record: ZoneRecord) => void;
  hideActions: (record: ZoneRecord) => boolean;
  disableStateButtons: (record: ZoneRecord) => boolean;
}) {
  const { t } = useTranslation();

  const paginationSummary = (
    <Text size="sm">
      {filteredCount > 0
        ? t('zones.pagination.summary', {
            start: (currentPage - 1) * recordsPerPage + 1,
            end: Math.min(currentPage * recordsPerPage, filteredCount),
            total: filteredCount,
            page: currentPage,
            pages: totalPages,
          })
        : t('zones.zeroRecords')}
    </Text>
  );

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Group mb="md" align="end">
        <TextInput
          label={t('zones.recordName')}
          placeholder={t('zones.recordSearchPlaceholder')}
          leftSection={<IconSearch size={16} />}
          value={searchText}
          onChange={e => onSearchChange(e.target.value)}
          style={{ flex: 1 }}
        />
        <Select
          label={t('zones.recordType')}
          data={recordTypeOptions}
          value={filterType}
          onChange={v => onFilterTypeChange(v || 'all')}
          w={150}
        />
        <Select
          label={t('zones.recordsPerPage')}
          data={['10', '25', '50', '100', '250', '500']}
          value={String(recordsPerPage)}
          onChange={v => onRecordsPerPageChange(Number(v || 10))}
          w={90}
          allowDeselect={false}
        />
      </Group>

      {records.length === 0 ? (
        <Center py="xl">
          <Text c="dimmed">{t('zones.noRecords')}</Text>
        </Center>
      ) : filteredCount === 0 ? (
        <Center py="xl">
          <Text c="dimmed">{t('common.noData')}</Text>
        </Center>
      ) : (
        <>
          <Group justify="space-between" mb="sm">
            {paginationSummary}
            {totalPages > 1 && (
              <Pagination
                value={currentPage}
                onChange={onPageChange}
                total={totalPages}
                size="sm"
              />
            )}
          </Group>
          <Table.ScrollContainer minWidth={1100}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 50 }}>#</Table.Th>
                  <Table.Th style={{ width: 220 }}>{t('zones.recordName')}</Table.Th>
                  <Table.Th style={{ width: 110 }}>{t('zones.recordType')}</Table.Th>
                  <Table.Th style={{ width: 110 }}>{t('zones.recordTTL')}</Table.Th>
                  <Table.Th>{t('zones.recordData')}</Table.Th>
                  <Table.Th style={{ width: 110 }}>{t('zones.recordStatus')}</Table.Th>
                  <Table.Th style={{ width: 220 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedRecords.map((record, idx) => (
                  <Table.Tr
                    key={`${record.name}-${record.type}-${idx}`}
                    style={{ verticalAlign: 'top' }}
                  >
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {(currentPage - 1) * recordsPerPage + idx + 1}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ overflowWrap: 'anywhere' }}>
                        {formatRecordName(record, zone)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={RECORD_TYPE_COLORS[record.type] || 'gray'}
                        variant="dot"
                        size="sm"
                        tt="none"
                        style={dotBadgeStyle}
                      >
                        {record.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <RecordTtl ttl={record.ttl} ttlString={record.ttlString} />
                    </Table.Td>
                    <Table.Td>
                      <RecordDataCell record={record} />
                    </Table.Td>
                    <Table.Td>
                      {record.disabled ? (
                        <Badge color="gray" size="sm" variant="dot" tt="none" style={dotBadgeStyle}>
                          {t('common.disabled')}
                        </Badge>
                      ) : (
                        <Badge
                          color="green"
                          size="sm"
                          variant="dot"
                          tt="none"
                          style={dotBadgeStyle}
                        >
                          {t('common.enabled')}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {hideActions(record) ? (
                        <Text size="sm" c="dimmed">
                          &nbsp;
                        </Text>
                      ) : (
                        <Group gap={5} wrap="nowrap" justify="flex-end">
                          <Button
                            size="xs"
                            variant="light"
                            color="blue"
                            onClick={() => onEdit(record)}
                          >
                            {t('common.edit')}
                          </Button>
                          {record.disabled ? (
                            <Button
                              size="xs"
                              variant="light"
                              color="green"
                              onClick={() => onToggleState(record, false)}
                              disabled={disableStateButtons(record)}
                            >
                              {t('zones.enable')}
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              variant="light"
                              color="orange"
                              onClick={() => onToggleState(record, true)}
                              disabled={disableStateButtons(record)}
                            >
                              {t('zones.disable')}
                            </Button>
                          )}
                          <Button
                            size="xs"
                            variant="light"
                            color="red"
                            onClick={() => onDelete(record)}
                            disabled={disableStateButtons(record)}
                          >
                            {t('common.delete')}
                          </Button>
                        </Group>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          {totalPages > 1 && (
            <Group justify="space-between" mt="md">
              {paginationSummary}
              <Pagination
                value={currentPage}
                onChange={onPageChange}
                total={totalPages}
                size="sm"
              />
            </Group>
          )}
        </>
      )}
    </Paper>
  );
}
