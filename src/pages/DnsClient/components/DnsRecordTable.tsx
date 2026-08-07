import { Badge, Table, Text, type CSSProperties } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { DnsResponseRecord } from '../types';
import { RECORD_TYPE_COLORS } from '../constants';
import { formatOptData, formatRData } from '../utils';

// 应答 / 权威 / 附加记录共用表格
export function DnsRecordTable({
  records,
  dotBadgeStyle,
  edns,
}: {
  records: DnsResponseRecord[];
  dotBadgeStyle: CSSProperties;
  edns?: Record<string, unknown>;
}) {
  const { t } = useTranslation();
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: 110 }}>{t('zones.recordType')}</Table.Th>
          <Table.Th>{t('zones.recordName')}</Table.Th>
          <Table.Th style={{ width: 180 }}>{t('zones.recordTTL')}</Table.Th>
          <Table.Th>{t('zones.recordData')}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {records.map((record, i) => (
          <Table.Tr key={`${record.Name}-${record.Type}-${i}`}>
            <Table.Td>
              <Badge
                color={RECORD_TYPE_COLORS[record.Type] || 'gray'}
                variant="dot"
                size="sm"
                tt="none"
                style={dotBadgeStyle}
              >
                {record.Type}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Text size="sm" style={{ maxWidth: 280 }} truncate="end">
                {record.NameIDN || record.Name}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{record.TTL}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm" style={{ maxWidth: 400 }} truncate="end">
                {record.Type === 'OPT'
                  ? formatOptData(edns, record.RDATA)
                  : formatRData(record.RDATA)}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
