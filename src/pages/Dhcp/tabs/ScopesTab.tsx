import { useEffect, useState } from 'react';
import { Button, Group, Paper, Stack, Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useConfirmDialog } from '../../../components/ConfirmDialog.context';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import { PageHeader } from '../../../components/PageHeader';
import type { DhcpScope } from '../types';
import { ScopeForm } from '../components/ScopeForm';

export function ScopesTab() {
  const { t } = useTranslation();
  const confirmDialog = useConfirmDialog();
  const [scopes, setScopes] = useState<DhcpScope[]>([]);
  const [editingScope, setEditingScope] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadScopes = async () => {
    try {
      const response = await apiClient.get<{ scopes: DhcpScope[] }>('/dhcp/scopes/list');
      if (response.status === 'ok' && response.response) {
        setScopes(response.response.scopes);
      }
    } catch {
      error(t('common.error'), t('dhcp.scopesLoadFailed'));
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ scopes: DhcpScope[] }>('/dhcp/scopes/list')
      .then(response => {
        if (!cancelled && response.status === 'ok' && response.response) {
          setScopes(response.response.scopes);
        }
      })
      .catch(() => {
        if (!cancelled) error(t('common.error'), t('dhcp.scopesLoadFailed'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const setScopeEnabled = async (scopeName: string, enabled: boolean) => {
    if (
      !(await confirmDialog(
        t('dhcp.scopeEnableDisableConfirm', {
          action: enabled ? t('dhcp.enable') : t('dhcp.disable'),
          name: scopeName,
        })
      ))
    )
      return;
    try {
      const response = await apiClient.post(
        enabled ? '/dhcp/scopes/enable' : '/dhcp/scopes/disable',
        { name: scopeName }
      );
      if (response.status === 'ok') {
        success(t('common.success'), enabled ? t('dhcp.scopeEnabled') : t('dhcp.scopeDisabled'));
        await loadScopes();
      }
    } catch {
      error(
        t('common.error'),
        enabled ? t('dhcp.scopeEnableFailed') : t('dhcp.scopeDisableFailed')
      );
    }
  };

  const deleteScope = async (scopeName: string) => {
    if (!(await confirmDialog(t('dhcp.scopeDeleteConfirm', { name: scopeName }), { color: 'red' })))
      return;
    try {
      const response = await apiClient.post('/dhcp/scopes/delete', { name: scopeName });
      if (response.status === 'ok') {
        success(t('common.success'), t('dhcp.scopeDeleted'));
        await loadScopes();
      }
    } catch {
      error(t('common.error'), t('dhcp.scopeDeleteFailed'));
    }
  };

  if (showAddForm || editingScope !== null) {
    return (
      <Stack>
        <PageHeader title={t('nav.dhcp')} />
        <ScopeForm
          scopeName={editingScope}
          onDone={() => {
            setShowAddForm(false);
            setEditingScope(null);
            loadScopes();
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack>
      <PageHeader
        title={t('nav.dhcp')}
        actions={
          <Button size="xs" onClick={() => setShowAddForm(true)}>
            {t('dhcp.addScope')}
          </Button>
        }
      />
      <Paper shadow="sm" p="md" withBorder>
        <Table.ScrollContainer minWidth={760}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.name')}</Table.Th>
                <Table.Th>{t('dhcp.scopeRange')}</Table.Th>
                <Table.Th>{t('dhcp.networkBroadcast')}</Table.Th>
                <Table.Th>{t('dhcp.interface')}</Table.Th>
                <Table.Th style={{ width: 200 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {scopes.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} align="center">
                    <Text c="dimmed" size="sm">
                      {t('dhcp.noScopeFound')}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                scopes.map(scope => (
                  <Table.Tr key={scope.name}>
                    <Table.Td>{scope.name}</Table.Td>
                    <Table.Td>
                      {scope.startingAddress} - {scope.endingAddress}
                      <br />
                      {scope.subnetMask}
                    </Table.Td>
                    <Table.Td>
                      {scope.networkAddress}
                      <br />
                      {scope.broadcastAddress}
                    </Table.Td>
                    <Table.Td>{scope.interfaceAddress || ''}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Button
                          size="xs"
                          variant="default"
                          onClick={() => setEditingScope(scope.name)}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          size="xs"
                          color={scope.enabled ? 'yellow' : 'gray'}
                          onClick={() => setScopeEnabled(scope.name, !scope.enabled)}
                        >
                          {scope.enabled ? t('dhcp.disable') : t('dhcp.enable')}
                        </Button>
                        <Button size="xs" color="red" onClick={() => deleteScope(scope.name)}>
                          {t('common.delete')}
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {scopes.length > 0 && (
          <Text size="sm" fw={600} mt="sm">
            {t('dhcp.totalScopes', { count: scopes.length })}
          </Text>
        )}
      </Paper>
    </Stack>
  );
}
