import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Menu,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { IconDotsVertical, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import { PageHeader } from '../../../components/PageHeader';
import type { AdminUser } from '../types';
import { formatDateTime } from '../../../utils/dateTime';
import { useConfirmDialog } from '../../../components/ConfirmDialog.context';

function AddUserForm({
  onCancel,
  onAdd,
}: {
  onCancel: () => void;
  onAdd: (username: string, password: string, displayName: string) => void;
}) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Group grow>
        <TextInput
          label={t('common.username')}
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <TextInput
          label={t('common.password')}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <TextInput
          label={t('common.displayName')}
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
        />
      </Group>
      <Group justify="flex-end" mt="sm">
        <Button variant="subtle" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button onClick={() => onAdd(username, password, displayName)}>{t('common.add')}</Button>
      </Group>
    </Paper>
  );
}

function UserForm({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [disabled, setDisabled] = useState(user.disabled);
  const [sessionTimeout, setSessionTimeout] = useState('7200');
  const [memberOf, setMemberOf] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [newGroup, setNewGroup] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{
        displayName: string;
        disabled: boolean;
        sessionTimeoutSeconds: number;
        memberOfGroups: string[];
        groups: string[];
      }>(`/admin/users/get?user=${encodeURIComponent(user.username)}&includeGroups=true`)
      .then(r => {
        if (!cancelled && r.status === 'ok' && r.response) {
          setDisplayName(r.response.displayName);
          setDisabled(r.response.disabled);
          setSessionTimeout(String(r.response.sessionTimeoutSeconds));
          setMemberOf(r.response.memberOfGroups || []);
          setAvailableGroups(r.response.groups || []);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user.username]);

  const save = async () => {
    try {
      const response = await apiClient.post('/admin/users/set', {
        user: user.username,
        displayName,
        disabled,
        sessionTimeoutSeconds: sessionTimeout,
        memberOfGroups: memberOf.join(','),
      });
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.userSaved'));
        onDone();
      }
    } catch {
      error(t('common.error'), t('admin.userSaveFailed'));
    }
  };

  const addMemberGroup = (name: string) => {
    if (name && !memberOf.includes(name)) {
      setMemberOf(prev => [...prev, name]);
      setNewGroup('');
    }
  };

  return (
    <Paper shadow="sm" p="md" withBorder mt="md">
      <Text fw={600} mb="sm">
        {t('admin.editUserTitle', { username: user.username })}
      </Text>
      <Group grow>
        <TextInput
          label={t('common.displayName')}
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
        />
        <TextInput
          label={t('admin.sessionTimeoutSec')}
          value={sessionTimeout}
          onChange={e => setSessionTimeout(e.target.value)}
        />
        <Checkbox
          label={t('admin.disabled')}
          checked={disabled}
          onChange={e => setDisabled(e.currentTarget.checked)}
          mt={30}
        />
      </Group>
      <Group mt="sm" align="end">
        <Select
          label={t('admin.memberOfGroups')}
          data={availableGroups.filter(g => !memberOf.includes(g))}
          value={newGroup}
          onChange={v => v && addMemberGroup(v)}
          placeholder={t('admin.addGroupPlaceholder')}
          clearable
          searchable
          w={260}
        />
        <Group gap={4}>
          {memberOf.map(group => (
            <Badge
              key={group}
              size="sm"
              variant="light"
              rightSection={
                <IconX
                  size={10}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setMemberOf(prev => prev.filter(g => g !== group))}
                />
              }
            >
              {group}
            </Badge>
          ))}
        </Group>
      </Group>
      <Group justify="flex-end" mt="sm">
        <Button variant="subtle" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button onClick={save}>{t('common.save')}</Button>
      </Group>
    </Paper>
  );
}

export function UsersTab() {
  const { t } = useTranslation();
  const confirmDialog = useConfirmDialog();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadUsers = async () => {
    const response = await apiClient.get<{ users: AdminUser[] }>('/admin/users/list');
    if (response.status === 'ok' && response.response) {
      setUsers(response.response.users);
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ users: AdminUser[] }>('/admin/users/list')
      .then(r => {
        if (!cancelled && r.status === 'ok' && r.response) setUsers(r.response.users);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const setDisabled = async (username: string, disabled: boolean) => {
    try {
      const response = await apiClient.post('/admin/users/set', { user: username, disabled });
      if (response.status === 'ok') {
        success(t('common.success'), disabled ? t('admin.userDisabled') : t('admin.userEnabled'));
        await loadUsers();
      }
    } catch {
      error(t('common.error'), t('admin.userUpdateFailed'));
    }
  };

  const deleteUser = async (username: string) => {
    if (!(await confirmDialog(t('admin.userDeleteConfirm', { username }), { color: 'red' })))
      return;
    try {
      const response = await apiClient.post('/admin/users/delete', { user: username });
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.userDeleted'));
        await loadUsers();
      }
    } catch {
      error(t('common.error'), t('admin.userDeleteFailed'));
    }
  };

  const addUser = async (username: string, password: string, displayName: string) => {
    try {
      const response = await apiClient.post('/admin/users/create', {
        user: username,
        password,
        displayName,
      });
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.userCreated'));
        setShowAddForm(false);
        await loadUsers();
      }
    } catch {
      error(t('common.error'), t('admin.userCreateFailed'));
    }
  };

  if (editingUser) {
    return (
      <Stack>
        <PageHeader title={t('nav.admin')} />
        <UserForm
          user={editingUser}
          onDone={() => {
            setEditingUser(null);
            loadUsers();
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack>
      <PageHeader
        title={t('nav.admin')}
        actions={
          <Button size="xs" onClick={() => setShowAddForm(true)}>
            {t('admin.addUser')}
          </Button>
        }
      />
      {showAddForm && <AddUserForm onCancel={() => setShowAddForm(false)} onAdd={addUser} />}
      <Paper shadow="sm" p="md" withBorder>
        <Table.ScrollContainer minWidth={820}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.username')}</Table.Th>
                <Table.Th>{t('common.displayName')}</Table.Th>
                <Table.Th>{t('admin.twoFaStatus')}</Table.Th>
                <Table.Th>{t('admin.status')}</Table.Th>
                <Table.Th>{t('admin.recentLogin')}</Table.Th>
                <Table.Th>{t('admin.previousLogin')}</Table.Th>
                <Table.Th style={{ width: 40 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((user, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{user.username}</Table.Td>
                  <Table.Td>{user.displayName}</Table.Td>
                  <Table.Td>
                    {user.totpEnabled ? (
                      <Badge size="sm" color="green" variant="light">
                        {t('common.enabled')}
                      </Badge>
                    ) : (
                      <Badge size="sm" color="gray" variant="light">
                        {t('common.disabled')}
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {user.disabled ? (
                      <Badge size="sm" color="gray" variant="light">
                        {t('common.disabled')}
                      </Badge>
                    ) : (
                      <Badge size="sm" color="green" variant="light">
                        {t('common.enabled')}
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>{formatDateTime(user.recentLogin)}</Table.Td>
                  <Table.Td>{formatDateTime(user.previousLogin)}</Table.Td>
                  <Table.Td>
                    <Menu position="bottom-end" shadow="sm">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconDotsVertical size={14} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => setEditingUser(user)}>
                          {t('admin.editUser')}
                        </Menu.Item>
                        {user.disabled ? (
                          <Menu.Item onClick={() => setDisabled(user.username, false)}>
                            {t('admin.enableUser')}
                          </Menu.Item>
                        ) : (
                          <Menu.Item onClick={() => setDisabled(user.username, true)}>
                            {t('admin.disableUser')}
                          </Menu.Item>
                        )}
                        <Menu.Item
                          color="red"
                          onClick={() => deleteUser(user.username)}
                          disabled={user.username === 'admin'}
                        >
                          {t('admin.deleteUser')}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="sm" fw={600} mt="sm">
          {t('admin.totalUsers', { count: users.length })}
        </Text>
      </Paper>
    </Stack>
  );
}
