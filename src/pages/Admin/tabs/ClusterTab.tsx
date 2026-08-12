import { useEffect, useState } from 'react';
import { Button, Group, Modal, Paper, Stack, Table, Tabs, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import { PageHeader } from '../../../components/PageHeader';
import type { ClusterNode } from '../types';
import { formatDateTime } from '../../../utils/dateTime';

export function ClusterTab() {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [clusterInitialized, setClusterInitialized] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [initMode, setInitMode] = useState<'new' | 'join'>('new');
  const [clusterDomain, setClusterDomain] = useState('');
  const [primaryNodeIpAddresses, setPrimaryNodeIpAddresses] = useState('');
  const [primaryNodeUrl, setPrimaryNodeUrl] = useState('');

  const loadCluster = async () => {
    const response = await apiClient.get<{
      nodes: ClusterNode[];
      clusterInitialized?: boolean;
    }>('/admin/cluster/state?includeServerIpAddresses=true');
    if (response.status === 'ok' && response.response) {
      setNodes(response.response.nodes || []);
      setClusterInitialized(response.response.clusterInitialized || false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ nodes: ClusterNode[]; clusterInitialized?: boolean }>(
        '/admin/cluster/state?includeServerIpAddresses=true'
      )
      .then(r => {
        if (!cancelled && r.status === 'ok' && r.response) {
          setNodes(r.response.nodes || []);
          setClusterInitialized(r.response.clusterInitialized || false);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const initCluster = async () => {
    try {
      const endpoint =
        initMode === 'new'
          ? `/admin/cluster/init?clusterDomain=${encodeURIComponent(clusterDomain)}&primaryNodeIpAddresses=${encodeURIComponent(primaryNodeIpAddresses)}`
          : '/admin/cluster/initJoin';
      const params = initMode === 'new' ? {} : { primaryNodeUrl, primaryNodeIpAddresses };
      const response = await apiClient.post(endpoint, params);
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.clusterInitialized'));
        setShowInitModal(false);
        await loadCluster();
      }
    } catch {
      error(t('common.error'), t('admin.clusterInitFailed'));
    }
  };

  const resyncCluster = async () => {
    try {
      const response = await apiClient.post('/admin/cluster/secondary/resync', {});
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.clusterResynced'));
      }
    } catch {
      error(t('common.error'), t('admin.clusterResyncFailed'));
    }
  };

  const leaveCluster = async () => {
    if (!window.confirm(t('admin.leaveClusterConfirm'))) return;
    try {
      const response = await apiClient.post('/admin/cluster/secondary/leave', {
        forceLeave: false,
      });
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.leftCluster'));
        await loadCluster();
      }
    } catch {
      error(t('common.error'), t('admin.leaveClusterFailed'));
    }
  };

  const deleteCluster = async () => {
    if (!window.confirm(t('admin.deleteClusterConfirm'))) return;
    try {
      const response = await apiClient.post('/admin/cluster/primary/delete', {
        forceDelete: false,
      });
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.clusterDeleted'));
        await loadCluster();
      }
    } catch {
      error(t('common.error'), t('admin.clusterDeleteFailed'));
    }
  };

  return (
    <Stack>
      <PageHeader
        title={t('nav.admin')}
        actions={
          !clusterInitialized ? (
            <Button size="xs" onClick={() => setShowInitModal(true)}>
              {t('admin.initialize')}
            </Button>
          ) : (
            <>
              <Button size="xs" onClick={resyncCluster}>
                {t('admin.resync')}
              </Button>
              <Button size="xs" color="yellow" onClick={leaveCluster}>
                {t('admin.leaveCluster')}
              </Button>
              <Button size="xs" color="red" onClick={deleteCluster}>
                {t('admin.deleteCluster')}
              </Button>
            </>
          )
        }
      />
      <Paper shadow="sm" p="md" withBorder>
        <Table.ScrollContainer minWidth={760}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('admin.nodeName')}</Table.Th>
                <Table.Th>{t('admin.ipAddress')}</Table.Th>
                <Table.Th>{t('admin.url')}</Table.Th>
                <Table.Th>{t('admin.type')}</Table.Th>
                <Table.Th>{t('admin.state')}</Table.Th>
                <Table.Th>{t('admin.upSince')}</Table.Th>
                <Table.Th>{t('admin.lastSeen')}</Table.Th>
                <Table.Th>{t('admin.lastSynced')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {nodes.map((node, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{node.name}</Table.Td>
                  <Table.Td>{node.ipAddress}</Table.Td>
                  <Table.Td>{node.url}</Table.Td>
                  <Table.Td>{node.type}</Table.Td>
                  <Table.Td>{node.state}</Table.Td>
                  <Table.Td>{formatDateTime(node.upSince)}</Table.Td>
                  <Table.Td>{formatDateTime(node.lastSeen)}</Table.Td>
                  <Table.Td>{formatDateTime(node.lastSynced)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {nodes.length === 0 && (
          <Text c="dimmed" size="sm" mt="sm">
            {t('admin.noClusterNodes')}
          </Text>
        )}
      </Paper>

      <Modal
        opened={showInitModal}
        onClose={() => setShowInitModal(false)}
        title={t('admin.initializeCluster')}
        centered
      >
        <Stack>
          <Tabs value={initMode} onChange={v => setInitMode((v || 'new') as 'new' | 'join')}>
            <Tabs.List>
              <Tabs.Tab value="new">{t('admin.newCluster')}</Tabs.Tab>
              <Tabs.Tab value="join">{t('admin.joinCluster')}</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="new" pt="md">
              <Stack>
                <TextInput
                  label={t('admin.clusterDomain')}
                  value={clusterDomain}
                  onChange={e => setClusterDomain(e.target.value)}
                />
                <TextInput
                  label={t('admin.primaryNodeIpAddresses')}
                  placeholder={t('common.onePerLine')}
                  value={primaryNodeIpAddresses}
                  onChange={e => setPrimaryNodeIpAddresses(e.target.value)}
                />
              </Stack>
            </Tabs.Panel>
            <Tabs.Panel value="join" pt="md">
              <Stack>
                <TextInput
                  label={t('admin.primaryNodeUrl')}
                  value={primaryNodeUrl}
                  onChange={e => setPrimaryNodeUrl(e.target.value)}
                />
                <TextInput
                  label={t('admin.primaryNodeIpAddresses')}
                  placeholder={t('common.onePerLine')}
                  value={primaryNodeIpAddresses}
                  onChange={e => setPrimaryNodeIpAddresses(e.target.value)}
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setShowInitModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={initCluster}>{t('admin.initialize')}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
