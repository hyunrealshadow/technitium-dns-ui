import {useState} from 'react';
import {ActionIcon, Badge, Group, Menu, Paper, ScrollArea, Table, Text, Title,} from '@mantine/core';
import {IconBan, IconCheck, IconDotsVertical, IconEye, IconSearch} from '@tabler/icons-react';
import {useTranslation} from 'react-i18next';
import type {TopClientStats, TopStats} from '../types';
import {formatNumber} from '../utils.ts';

interface TopTableProps {
  title: string;
  data: TopStats[] | TopClientStats[];
  tableType: 'clients' | 'domains' | 'blockedDomains';
  onBlockDomain?: (domain: string) => void;
  onAllowDomain?: (domain: string) => void;
  onShowQueryLogs?: (domain: string | null, clientIp: string | null) => void;
  onQueryDns?: (domain: string, type?: string) => void;
}

export function TopTable({
  title,
  data,
  tableType,
  onBlockDomain,
  onAllowDomain,
  onShowQueryLogs,
  onQueryDns,
}: TopTableProps) {
  const { t } = useTranslation();
  const [openedRow, setOpenedRow] = useState<number | null>(null);

  const handleAction = (action: () => void, index: number) => {
    setOpenedRow(index);
    action();
  };

  const getActions = (item: TopStats | TopClientStats, index: number) => {
    const actions: { label: string; icon: React.ReactNode; onClick: () => void; color?: string }[] =
      [];

    // Show Query Logs - 所有表格都有
    if (onShowQueryLogs) {
      if ('domain' in item && item.domain) {
        actions.push({
          label: t('topTable.showQueryLogs'),
          icon: <IconEye size={14} />,
          onClick: () => handleAction(() => onShowQueryLogs(null, item.name), index),
        });
      } else {
        actions.push({
          label: t('topTable.showQueryLogs'),
          icon: <IconEye size={14} />,
          onClick: () => handleAction(() => onShowQueryLogs(item.name, null), index),
        });
      }
    }

    // Query DNS Server - Domains 和 Blocked Domains 表格有
    if (onQueryDns && (tableType === 'domains' || tableType === 'blockedDomains')) {
      actions.push({
        label: t('topTable.queryDns'),
        icon: <IconSearch size={14} />,
        onClick: () => handleAction(() => onQueryDns(item.name), index),
      });
    }

    // Block Domain - Domains 表格有
    if (onBlockDomain && tableType === 'domains') {
      const domainName = 'nameIdn' in item && item.nameIdn ? item.nameIdn : item.name;
      if (domainName !== '.') {
        actions.push({
          label: t('topTable.blockDomain'),
          icon: <IconBan size={14} />,
          onClick: () => handleAction(() => onBlockDomain(item.name), index),
          color: 'red',
        });
      }
    }

    // Allow Domain - Blocked Domains 表格有
    if (onAllowDomain && tableType === 'blockedDomains') {
      const domainName = 'nameIdn' in item && item.nameIdn ? item.nameIdn : item.name;
      if (domainName !== '.') {
        actions.push({
          label: t('topTable.allowDomain'),
          icon: <IconCheck size={14} />,
          onClick: () => handleAction(() => onAllowDomain(item.name), index),
          color: 'green',
        });
      }
    }

    return actions;
  };

  return (
    <Paper shadow="sm" p="md" withBorder h="100%">
      <Title order={5} mb="md">
        {title}
      </Title>
      <ScrollArea h={300}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('topTable.name')}</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>{t('topTable.queries')}</Table.Th>
              <Table.Th style={{ width: 40 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((item, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      {item.nameIdn || item.name}
                    </Text>
                    {'domain' in item && item.domain && (
                      <Text size="xs" c="dimmed">
                        ({item.domain})
                      </Text>
                    )}
                    {'rateLimited' in item && item.rateLimited && (
                      <Badge size="xs" color="orange">
                        {t('topTable.rateLimited')}
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="sm" fw={500}>
                    {formatNumber(item.hits)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Menu
                    shadow="md"
                    width={180}
                    opened={openedRow === index}
                    onChange={opened => setOpenedRow(opened ? index : null)}
                  >
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => setOpenedRow(openedRow === index ? null : index)}
                      >
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {getActions(item, index).map((action, i) => (
                        <Menu.Item
                          key={i}
                          leftSection={action.icon}
                          color={action.color}
                          onClick={() => {
                            action.onClick();
                            setOpenedRow(null);
                          }}
                        >
                          {action.label}
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
}
