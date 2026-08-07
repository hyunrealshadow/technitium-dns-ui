import { Button, Group, Paper, Table, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';

// 可编辑列表区块的列定义
export interface ListColumn {
  // 行数据字段名
  key: string;
  // 表头翻译键（dhcp 命名空间）
  labelKey: string;
  // 输入类型，number 时值按数字处理
  type?: 'text' | 'number';
}

// 通用的可编辑列表区块（静态路由 / vendor options / generic options / exclusions / reserved leases 共用）
export function ListEditor({
  titleKey,
  rows,
  columns,
  onAdd,
  onUpdate,
  onRemove,
}: {
  titleKey: string;
  rows: Record<string, unknown>[];
  columns: ListColumn[];
  onAdd: () => void;
  onUpdate: (index: number, field: string, value: string | number) => void;
  onRemove: (index: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <Paper shadow="sm" p="md" withBorder>
      <Group justify="space-between" mb="sm">
        <Text fw={600}>{t(titleKey)}</Text>
        <Button size="xs" variant="default" onClick={onAdd}>
          {t('common.add')}
        </Button>
      </Group>
      {rows.length > 0 && (
        <Table>
          <Table.Thead>
            <Table.Tr>
              {columns.map(col => (
                <Table.Th key={col.key}>{t(col.labelKey)}</Table.Th>
              ))}
              <Table.Th style={{ width: 60 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, i) => (
              <Table.Tr key={i}>
                {columns.map(col => (
                  <Table.Td key={col.key}>
                    <TextInput
                      size="xs"
                      type={col.type}
                      value={String(row[col.key] ?? '')}
                      onChange={e =>
                        onUpdate(
                          i,
                          col.key,
                          col.type === 'number' ? Number(e.target.value) : e.target.value
                        )
                      }
                    />
                  </Table.Td>
                ))}
                <Table.Td>
                  <Button size="xs" color="red" variant="subtle" onClick={() => onRemove(i)}>
                    {t('common.remove')}
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
}
