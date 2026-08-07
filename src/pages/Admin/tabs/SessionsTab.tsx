import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Code,
  Group,
  Menu,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { IconDotsVertical } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import type { AdminSession } from '../types';

export function SessionsTab() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [createTokenOpen, setCreateTokenOpen] = useState(false);
  const [tokenUser, setTokenUser] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [newToken, setNewToken] = useState('');

  const loadSessions = async () => {
    const response = await apiClient.get<{ sessions: AdminSession[] }>('/admin/sessions/list');
    if (response.status === 'ok' && response.response) {
      setSessions(response.response.sessions);
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ sessions: AdminSession[] }>('/admin/sessions/list')
      .then(r => {
        if (!cancelled && r.status === 'ok' && r.response) setSessions(r.response.sessions);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const deleteSession = async (session: AdminSession) => {
    if (!window.confirm(t('admin.sessionDeleteConfirm', { token: session.partialToken }))) return;
    try {
      const response = await apiClient.post('/admin/sessions/delete', {
        partialToken: session.partialToken,
      });
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.sessionDeleted'));
        await loadSessions();
      }
    } catch {
      error(t('common.error'), t('admin.sessionDeleteFailed'));
    }
  };

  const openCreateToken = async () => {
    setNewToken('');
    setTokenName('');
    const response = await apiClient.get<{ users: { username: string }[] }>('/admin/users/list');
    if (response.status === 'ok' && response.response) {
      setUsers(response.response.users.map(u => u.username));
      setTokenUser(response.response.users[0]?.username || '');
    }
    setCreateTokenOpen(true);
  };

  const createToken = async () => {
    if (!tokenUser || !tokenName) return;
    try {
      const response = await apiClient.post<{ token: string }>('/admin/sessions/createToken', {
        user: tokenUser,
        tokenName,
      });
      if (response.status === 'ok' && response.response) {
        setNewToken(response.response.token);
        await loadSessions();
      } else {
        throw new Error(response.errorMessage || 'Failed');
      }
    } catch {
      error(t('common.error'), t('admin.tokenCreateFailed'));
    }
  };

  return (
    <Stack mt="md">
      <Group justify="flex-end">
        <Button onClick={openCreateToken}>{t('admin.createToken')}</Button>
      </Group>
      <Paper shadow="sm" p="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('common.username')}</Table.Th>
              <Table.Th>{t('admin.session')}</Table.Th>
              <Table.Th>{t('admin.lastSeen')}</Table.Th>
              <Table.Th>{t('admin.remoteAddress')}</Table.Th>
              <Table.Th>{t('admin.userAgent')}</Table.Th>
              <Table.Th style={{ width: 40 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sessions.map((session, i) => (
              <Table.Tr key={i}>
                <Table.Td>{session.username}</Table.Td>
                <Table.Td>
                  {session.tokenName && <Text size="sm">{session.tokenName}</Text>}
                  <Text size="sm">[{session.partialToken}]</Text>
                  {session.isCurrentSession && (
                    <Text size="xs" c="dimmed">
                      {t('admin.currentSession')}
                    </Text>
                  )}
                  <Badge
                    size="xs"
                    variant={session.type === 'Standard' ? 'default' : 'light'}
                    color={session.type === 'ApiToken' ? 'blue' : 'yellow'}
                  >
                    {session.type === 'Standard'
                      ? t('admin.sessionTypeStandard')
                      : session.type === 'ApiToken'
                        ? t('admin.sessionTypeApiToken')
                        : t('admin.sessionTypeUnknown')}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{new Date(session.lastSeen).toLocaleString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{session.lastSeenRemoteAddress}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" style={{ maxWidth: 200 }} truncate="end">
                    {session.lastSeenUserAgent}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Menu position="bottom-end" shadow="sm">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" size="sm">
                        <IconDotsVertical size={14} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item color="red" onClick={() => deleteSession(session)}>
                        {t('admin.deleteSession')}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Text size="sm" fw={600} mt="sm">
          {t('admin.totalSessions', { count: sessions.length })}
        </Text>
      </Paper>

      <Modal
        opened={createTokenOpen}
        onClose={() => setCreateTokenOpen(false)}
        title={t('layout.createApiToken')}
        centered
      >
        <Stack>
          {newToken ? (
            <>
              <Text size="sm">{t('admin.tokenCreatedHint')}</Text>
              <Code block>{newToken}</Code>
            </>
          ) : (
            <>
              <Select
                label={t('common.username')}
                data={users}
                value={tokenUser}
                onChange={v => setTokenUser(v || '')}
                allowDeselect={false}
                searchable
              />
              <TextInput
                label={t('admin.tokenName')}
                value={tokenName}
                onChange={e => setTokenName(e.target.value)}
              />
              <Group justify="flex-end">
                <Button variant="subtle" onClick={() => setCreateTokenOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={createToken}>{t('admin.create')}</Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </Stack>
  );
}
