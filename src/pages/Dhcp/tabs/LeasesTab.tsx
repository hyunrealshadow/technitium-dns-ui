import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Menu,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { IconDotsVertical } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import type { DhcpLease } from '../types';

export function LeasesTab() {
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
