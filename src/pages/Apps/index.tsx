import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Code,
  FileInput,
  Group,
  Modal,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconDownload, IconPlus, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../components/notifications';
import { apiClient } from '../../api/client';
import type { App } from './types';
import { getTypeLabels } from './constants';
import { AppStoreModal } from './components/AppStoreModal';
import { AppConfigModal } from './components/AppConfigModal';

export function AppsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<App[]>([]);
  const [storeOpen, setStoreOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [installName, setInstallName] = useState('');
  const [installFile, setInstallFile] = useState<File | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<App | null>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [configApp, setConfigApp] = useState<App | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ apps: App[] }>('/apps/list');
      if (response.status === 'ok' && response.response) {
        setApps(response.response.apps || []);
      }
    } catch {
      error(t('common.error'), t('apps.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ apps: App[] }>('/apps/list')
      .then(response => {
        if (!cancelled && response.status === 'ok' && response.response) {
          setApps(response.response.apps || []);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const installFromFile = async () => {
    if (!installName.trim()) {
      error(t('common.error'), t('apps.appNameRequired'));
      return;
    }
    if (!installFile) {
      error(t('common.error'), t('apps.selectZipFile'));
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', installName.trim());
      formData.append('fileApp', installFile);
      const response = await fetch(
        `/api/apps/install?token=${encodeURIComponent(apiClient.getToken() || '')}`,
        { method: 'POST', body: formData }
      ).then(r => r.json());
      if (response.status === 'ok') {
        success(t('common.success'), t('apps.installedWithName', { name: installName.trim() }));
        setInstallOpen(false);
        setInstallName('');
        setInstallFile(null);
        await fetchApps();
      } else {
        throw new Error(response.errorMessage || 'Failed');
      }
    } catch {
      error(t('common.error'), t('apps.installFailed'));
    }
  };

  const openUpdate = (app: App) => {
    setUpdateTarget(app);
    setUpdateFile(null);
    setUpdateOpen(true);
  };

  const updateFromFile = async () => {
    if (!updateTarget) return;
    if (!updateFile) {
      error(t('common.error'), t('apps.selectZipFile'));
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', updateTarget.name);
      formData.append('fileApp', updateFile);
      const response = await fetch(
        `/api/apps/update?token=${encodeURIComponent(apiClient.getToken() || '')}`,
        { method: 'POST', body: formData }
      ).then(r => r.json());
      if (response.status === 'ok') {
        success(t('common.success'), t('apps.updatedWithName', { name: updateTarget.name }));
        setUpdateOpen(false);
        setUpdateFile(null);
        await fetchApps();
      } else {
        throw new Error(response.errorMessage || 'Failed');
      }
    } catch {
      error(t('common.error'), t('apps.updateFailed'));
    }
  };

  const storeUpdate = async (app: App) => {
    if (!app.updateUrl) return;
    try {
      const response = await apiClient.post(
        `/apps/downloadAndUpdate?name=${encodeURIComponent(app.name)}&url=${encodeURIComponent(app.updateUrl)}`,
        {}
      );
      if (response.status === 'ok') {
        success(t('common.success'), t('apps.updatedWithName', { name: app.name }));
        await fetchApps();
      }
    } catch {
      error(t('common.error'), t('apps.updateFailed'));
    }
  };

  const uninstallApp = async (app: App) => {
    if (!window.confirm(t('apps.uninstallConfirm', { name: app.name }))) return;
    try {
      const response = await apiClient.post(
        `/apps/uninstall?name=${encodeURIComponent(app.name)}`,
        {}
      );
      if (response.status === 'ok') {
        success(t('common.success'), t('apps.uninstalledWithName', { name: app.name }));
        await fetchApps();
      }
    } catch {
      error(t('common.error'), t('apps.uninstallFailed'));
    }
  };

  if (loading) {
    return (
      <Stack>
        <Group justify="space-between">
          <Skeleton height={34} width={140} />
          <Group>
            <Skeleton height={36} width={110} />
            <Skeleton height={36} width={90} />
            <Skeleton height={36} width={90} />
          </Group>
        </Group>
        <Stack gap="sm" mt="md">
          <Paper shadow="sm" p="md" withBorder>
            <Skeleton height={22} width={180} />
            <Skeleton height={14} width={120} mt={10} />
            <Skeleton height={14} mt={16} />
            <Skeleton height={14} mt={6} />
          </Paper>
          <Paper shadow="sm" p="md" withBorder>
            <Skeleton height={22} width={160} />
            <Skeleton height={14} width={110} mt={10} />
            <Skeleton height={14} mt={16} />
          </Paper>
          <Paper shadow="sm" p="md" withBorder>
            <Skeleton height={22} width={200} />
            <Skeleton height={14} width={130} mt={10} />
            <Skeleton height={14} mt={16} />
            <Skeleton height={14} mt={6} />
            <Skeleton height={14} mt={6} />
          </Paper>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>{t('nav.apps')}</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setStoreOpen(true)}>
            {t('apps.appStore')}
          </Button>
          <Button leftSection={<IconDownload size={16} />} onClick={() => setInstallOpen(true)}>
            {t('apps.install')}
          </Button>
          <Button leftSection={<IconRefresh size={16} />} onClick={fetchApps}>
            {t('common.refresh')}
          </Button>
        </Group>
      </Group>

      {apps.length === 0 ? (
        <Paper shadow="sm" p="xl" withBorder>
          <Text c="dimmed" ta="center">
            {t('apps.noAppsInstalled')}
          </Text>
        </Paper>
      ) : (
        <Paper shadow="sm" p="md" withBorder>
          <Table>
            <Table.Tbody>
              {apps.map(app => (
                <Table.Tr key={app.name}>
                  <Table.Td style={{ verticalAlign: 'top' }}>
                    <Text fw={700} size="lg">
                      {app.name}
                    </Text>
                    <Group gap={6} mt={4}>
                      <Badge variant="light" color="blue" tt="none">
                        {t('apps.versionLabel', { version: app.version })}
                      </Badge>
                      {app.updateAvailable && app.updateVersion && (
                        <Badge color="yellow" tt="none">
                          {t('apps.updateLabel', { version: app.updateVersion })}
                        </Badge>
                      )}
                    </Group>
                    {app.description && (
                      <Text size="sm" c="dimmed" mt={8} style={{ whiteSpace: 'pre-wrap' }}>
                        {app.description}
                      </Text>
                    )}
                    {app.dnsApps.length > 0 && (
                      <Table withRowBorders={false} verticalSpacing={6} mt={8}>
                        <Table.Tbody>
                          {app.dnsApps.map((dnsApp, idx) => (
                            <Table.Tr key={idx}>
                              <Table.Td style={{ width: '45%', verticalAlign: 'top' }}>
                                <Text size="sm">{dnsApp.classPath}</Text>
                                <Group gap={4} mt={4}>
                                  {getTypeLabels(dnsApp, t).map(label => (
                                    <Badge
                                      key={label.label}
                                      size="xs"
                                      color={label.color}
                                      tt="none"
                                    >
                                      {label.label}
                                    </Badge>
                                  ))}
                                </Group>
                              </Table.Td>
                              <Table.Td style={{ verticalAlign: 'top' }}>
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                  {dnsApp.description}
                                </Text>
                                {dnsApp.isAppRecordRequestHandler && dnsApp.recordDataTemplate && (
                                  <Stack gap={2} mt={4}>
                                    <Text size="xs" fw={600}>
                                      {t('apps.recordDataTemplate')}
                                    </Text>
                                    <Code block>{dnsApp.recordDataTemplate}</Code>
                                  </Stack>
                                )}
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Table.Td>
                  <Table.Td style={{ width: 140, verticalAlign: 'top' }}>
                    <Stack gap={6}>
                      <Button size="xs" variant="default" onClick={() => setConfigApp(app)}>
                        {t('apps.config')}
                      </Button>
                      <Button size="xs" variant="default" onClick={() => openUpdate(app)}>
                        {t('apps.update')}
                      </Button>
                      {app.updateAvailable && app.updateUrl && (
                        <Button size="xs" color="yellow" onClick={() => storeUpdate(app)}>
                          {t('apps.storeUpdate')}
                        </Button>
                      )}
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => uninstallApp(app)}
                      >
                        {t('apps.uninstall')}
                      </Button>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Text fw={600} mt="sm">
            {t('apps.totalApps', { count: apps.length })}
          </Text>
        </Paper>
      )}

      <AppStoreModal
        opened={storeOpen}
        onClose={() => setStoreOpen(false)}
        onInstalled={fetchApps}
      />

      <Modal
        opened={installOpen}
        onClose={() => setInstallOpen(false)}
        title={t('apps.installApp')}
        centered
      >
        <Stack>
          <TextInput
            label={t('apps.appNameLabel')}
            placeholder={t('apps.appNamePlaceholder')}
            value={installName}
            onChange={e => setInstallName(e.target.value)}
          />
          <FileInput
            label={t('apps.appZipFile')}
            placeholder={t('apps.selectZipPlaceholder')}
            value={installFile}
            onChange={setInstallFile}
            accept=".zip"
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setInstallOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={installFromFile}>{t('apps.install')}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={updateOpen}
        onClose={() => setUpdateOpen(false)}
        title={t('apps.updateApp', { name: updateTarget?.name })}
        centered
      >
        <Stack>
          <FileInput
            label={t('apps.appZipFile')}
            placeholder={t('apps.selectZipPlaceholder')}
            value={updateFile}
            onChange={setUpdateFile}
            accept=".zip"
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setUpdateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={updateFromFile}>{t('apps.update')}</Button>
          </Group>
        </Stack>
      </Modal>

      <AppConfigModal
        app={configApp}
        opened={configApp !== null}
        onClose={() => setConfigApp(null)}
        onSaved={fetchApps}
      />
    </Stack>
  );
}
