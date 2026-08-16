import { useEffect, useState } from 'react';
import { Badge, Button, Group, Modal, Stack, Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import type { StoreApp } from '../types';
import { useConfirmDialog } from '../../../components/ConfirmDialog.context';

type StoreAction = 'install' | 'update' | 'uninstall';

// 应用商店 Modal：打开时加载商店列表，支持安装/更新/卸载
export function AppStoreModal({
  opened,
  onClose,
  onInstalled,
}: {
  opened: boolean;
  onClose: () => void;
  // 安装/更新/卸载成功后的刷新回调（父页面刷新已安装列表）
  onInstalled: () => void;
}) {
  const { t } = useTranslation();
  const confirmDialog = useConfirmDialog();
  const [storeApps, setStoreApps] = useState<StoreApp[]>([]);
  const [pendingAction, setPendingAction] = useState<{
    appName: string;
    action: StoreAction;
  } | null>(null);

  const loadStore = async () => {
    try {
      const response = await apiClient.get<{ storeApps: StoreApp[] }>('/apps/listStoreApps');
      if (response.status === 'ok' && response.response) {
        setStoreApps(response.response.storeApps || []);
      }
    } catch {
      error(t('common.error'), t('apps.storeLoadFailed'));
    }
  };

  useEffect(() => {
    if (opened) loadStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const installFromStore = async (app: StoreApp) => {
    setPendingAction({ appName: app.name, action: 'install' });
    try {
      const response = await apiClient.post(
        `/apps/downloadAndInstall?name=${encodeURIComponent(app.name)}&url=${encodeURIComponent(app.url)}`,
        {}
      );
      if (response.status === 'ok') {
        success(t('common.success'), t('apps.installedWithName', { name: app.name }));
        await onInstalled();
        await loadStore();
      }
    } catch {
      error(t('common.error'), t('apps.installFailed'));
    } finally {
      setPendingAction(null);
    }
  };

  const updateFromStore = async (app: StoreApp) => {
    setPendingAction({ appName: app.name, action: 'update' });
    try {
      const response = await apiClient.post(
        `/apps/downloadAndUpdate?name=${encodeURIComponent(app.name)}&url=${encodeURIComponent(app.url)}`,
        {}
      );
      if (response.status === 'ok') {
        success(t('common.success'), t('apps.updatedWithName', { name: app.name }));
        await onInstalled();
        await loadStore();
      }
    } catch {
      error(t('common.error'), t('apps.updateFailed'));
    } finally {
      setPendingAction(null);
    }
  };

  const uninstallFromStore = async (app: StoreApp) => {
    if (!(await confirmDialog(t('apps.uninstallConfirm', { name: app.name }), { color: 'red' })))
      return;
    setPendingAction({ appName: app.name, action: 'uninstall' });
    try {
      const response = await apiClient.post(
        `/apps/uninstall?name=${encodeURIComponent(app.name)}`,
        {}
      );
      if (response.status === 'ok') {
        success(t('common.success'), t('apps.uninstalledWithName', { name: app.name }));
        await onInstalled();
        await loadStore();
      }
    } catch {
      error(t('common.error'), t('apps.uninstallFailed'));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('apps.appStore')} size="lg">
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('common.name')}</Table.Th>
            <Table.Th style={{ width: 150 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {storeApps.map(app => {
            const displayVersion = app.installed ? app.installedVersion : app.version;
            const showUpdate = app.installed && app.updateAvailable;
            return (
              <Table.Tr key={app.name}>
                <Table.Td style={{ verticalAlign: 'top' }}>
                  <Text fw={600}>{app.name}</Text>
                  <Group gap={6} mt={4}>
                    <Badge variant="light" color="blue" tt="none">
                      {t('apps.versionLabel', { version: displayVersion })}
                    </Badge>
                    {showUpdate && (
                      <Badge color="yellow" tt="none">
                        {t('apps.updateLabel', { version: app.version })}
                      </Badge>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed" mt={6} style={{ whiteSpace: 'pre-wrap' }}>
                    {app.description}
                  </Text>
                  <Text size="xs" c="dimmed" mt={6}>
                    {t('apps.appZipFileLabel')}: {app.url}
                    <br />
                    {t('apps.size')}: {app.size}
                  </Text>
                </Table.Td>
                <Table.Td style={{ verticalAlign: 'top' }}>
                  <Stack gap={6}>
                    {!app.installed && (
                      <Button
                        size="xs"
                        loading={
                          pendingAction?.appName === app.name && pendingAction.action === 'install'
                        }
                        disabled={
                          pendingAction !== null &&
                          (pendingAction.appName !== app.name || pendingAction.action !== 'install')
                        }
                        onClick={() => installFromStore(app)}
                      >
                        {t('apps.install')}
                      </Button>
                    )}
                    {showUpdate && (
                      <Button
                        size="xs"
                        variant="light"
                        loading={
                          pendingAction?.appName === app.name && pendingAction.action === 'update'
                        }
                        disabled={
                          pendingAction !== null &&
                          (pendingAction.appName !== app.name || pendingAction.action !== 'update')
                        }
                        onClick={() => updateFromStore(app)}
                      >
                        {t('apps.update')}
                      </Button>
                    )}
                    {app.installed && (
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        loading={
                          pendingAction?.appName === app.name &&
                          pendingAction.action === 'uninstall'
                        }
                        disabled={
                          pendingAction !== null &&
                          (pendingAction.appName !== app.name ||
                            pendingAction.action !== 'uninstall')
                        }
                        onClick={() => uninstallFromStore(app)}
                      >
                        {t('apps.uninstall')}
                      </Button>
                    )}
                  </Stack>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Modal>
  );
}
