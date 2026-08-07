import { ActionIcon, Button, NumberInput, Table, Text, TextInput } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { QpmRow } from '../types';

// QPM（每分钟查询数）前缀限流的可编辑表格（IPv4/IPv6 共用）
export function QpmTable({
  rows,
  label,
  description,
  onAdd,
  onUpdate,
  onRemove,
}: {
  rows: QpmRow[];
  label: string;
  description?: string;
  onAdd: () => void;
  onUpdate: (
    index: number,
    field: 'prefix' | 'udpLimit' | 'tcpLimit',
    value: string | number
  ) => void;
  onRemove: (index: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Text fw={500} size="sm" mb="xs">
        {label}
      </Text>
      {description && (
        <Text size="xs" c="dimmed" mb="xs">
          {description}
        </Text>
      )}
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('settings.prefix')}</Table.Th>
            <Table.Th>{t('settings.udpLimit')}</Table.Th>
            <Table.Th>{t('settings.tcpLimit')}</Table.Th>
            <Table.Th style={{ width: 60 }}>
              <Button size="xs" variant="default" onClick={onAdd}>
                {t('common.add')}
              </Button>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, i) => (
            <Table.Tr key={i}>
              <Table.Td>
                <TextInput
                  size="xs"
                  value={row.prefix}
                  onChange={e => onUpdate(i, 'prefix', e.target.value)}
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  size="xs"
                  value={row.udpLimit}
                  onChange={v => onUpdate(i, 'udpLimit', Number(v))}
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  size="xs"
                  value={row.tcpLimit}
                  onChange={v => onUpdate(i, 'tcpLimit', Number(v))}
                />
              </Table.Td>
              <Table.Td>
                <ActionIcon
                  size="sm"
                  color="red"
                  variant="subtle"
                  aria-label={t('common.delete')}
                  onClick={() => onRemove(i)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
}
