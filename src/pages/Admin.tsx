import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Code,
  Group,
  Menu,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconDotsVertical, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { success, error } from '../components/notifications';
import { apiClient } from '../api/client';
import { SECTION_NAV_KEYS } from '../utils/permissions';

interface AdminSession {
  username: string;
  tokenName?: string;
  partialToken: string;
  isCurrentSession: boolean;
  type: string;
  lastSeen: string;
  lastSeenRemoteAddress: string;
  lastSeenUserAgent: string;
}

interface AdminUser {
  username: string;
  displayName: string;
  totpEnabled: boolean;
  disabled: boolean;
  recentLogin: string;
  previousLogin: string;
}

interface AdminGroup {
  name: string;
  description: string;
}

interface PermissionItem {
  section: string;
  subItem: string;
  canView?: boolean;
  canModify?: boolean;
  canDelete?: boolean;
  userPermissions?: {
    username: string;
    canView: boolean;
    canModify: boolean;
    canDelete: boolean;
  }[];
  groupPermissions?: { name: string; canView: boolean; canModify: boolean; canDelete: boolean }[];
  users?: string[];
  groups?: string[];
}

function SessionsTab() {
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

function UsersTab() {
  const { t } = useTranslation();
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
    if (!window.confirm(t('admin.userDeleteConfirm', { username }))) return;
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
      <UserForm
        user={editingUser}
        onDone={() => {
          setEditingUser(null);
          loadUsers();
        }}
      />
    );
  }

  return (
    <Stack mt="md">
      <Group justify="flex-end">
        <Button onClick={() => setShowAddForm(true)}>{t('admin.addUser')}</Button>
      </Group>
      {showAddForm && <AddUserForm onCancel={() => setShowAddForm(false)} onAdd={addUser} />}
      <Paper shadow="sm" p="md" withBorder>
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
                <Table.Td>{new Date(user.recentLogin).toLocaleString()}</Table.Td>
                <Table.Td>{new Date(user.previousLogin).toLocaleString()}</Table.Td>
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
        <Text size="sm" fw={600} mt="sm">
          {t('admin.totalUsers', { count: users.length })}
        </Text>
      </Paper>
    </Stack>
  );
}

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

function GroupsTab() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null);

  const loadGroups = async () => {
    const response = await apiClient.get<{ groups: AdminGroup[] }>('/admin/groups/list');
    if (response.status === 'ok' && response.response) {
      setGroups(response.response.groups);
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ groups: AdminGroup[] }>('/admin/groups/list')
      .then(r => {
        if (!cancelled && r.status === 'ok' && r.response) setGroups(r.response.groups);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const addGroup = async (name: string, description: string) => {
    try {
      const response = await apiClient.post('/admin/groups/create', { group: name, description });
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.groupCreated'));
        setShowAddForm(false);
        await loadGroups();
      }
    } catch {
      error(t('common.error'), t('admin.groupCreateFailed'));
    }
  };

  const deleteGroup = async (name: string) => {
    if (!window.confirm(t('admin.groupDeleteConfirm', { name }))) return;
    try {
      const response = await apiClient.post('/admin/groups/delete', { group: name });
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.groupDeleted'));
        await loadGroups();
      }
    } catch {
      error(t('common.error'), t('admin.groupDeleteFailed'));
    }
  };

  if (editingGroup) {
    return (
      <GroupForm
        group={editingGroup}
        onDone={() => {
          setEditingGroup(null);
          loadGroups();
        }}
      />
    );
  }

  return (
    <Stack mt="md">
      <Group justify="flex-end">
        <Button onClick={() => setShowAddForm(true)}>{t('admin.addGroup')}</Button>
      </Group>
      {showAddForm && <AddGroupForm onCancel={() => setShowAddForm(false)} onAdd={addGroup} />}
      <Paper shadow="sm" p="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('common.name')}</Table.Th>
              <Table.Th>{t('common.description')}</Table.Th>
              <Table.Th style={{ width: 40 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {groups.map((group, i) => (
              <Table.Tr key={i}>
                <Table.Td>{group.name}</Table.Td>
                <Table.Td>{group.description}</Table.Td>
                <Table.Td>
                  <Menu position="bottom-end" shadow="sm">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" size="sm">
                        <IconDotsVertical size={14} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={() => setEditingGroup(group)}>
                        {t('admin.editGroup')}
                      </Menu.Item>
                      <Menu.Item color="red" onClick={() => deleteGroup(group.name)}>
                        {t('admin.deleteGroup')}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Text size="sm" fw={600} mt="sm">
          {t('admin.totalGroups', { count: groups.length })}
        </Text>
      </Paper>
    </Stack>
  );
}

function AddGroupForm({
  onCancel,
  onAdd,
}: {
  onCancel: () => void;
  onAdd: (name: string, description: string) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Group grow>
        <TextInput label={t('common.name')} value={name} onChange={e => setName(e.target.value)} />
        <TextInput
          label={t('common.description')}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </Group>
      <Group justify="flex-end" mt="sm">
        <Button variant="subtle" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button onClick={() => onAdd(name, description)}>{t('common.add')}</Button>
      </Group>
    </Paper>
  );
}

function GroupForm({ group, onDone }: { group: AdminGroup; onDone: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [members, setMembers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ name: string; description: string; members: string[]; users: string[] }>(
        `/admin/groups/get?group=${encodeURIComponent(group.name)}&includeUsers=true`
      )
      .then(r => {
        if (!cancelled && r.status === 'ok' && r.response) {
          setName(r.response.name);
          setDescription(r.response.description);
          setMembers(r.response.members || []);
          setAvailableUsers(r.response.users || []);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [group.name]);

  const save = async () => {
    try {
      const params: Record<string, unknown> = {
        group: group.name,
        description,
        members: members.join(','),
      };
      if (name !== group.name) params.newGroup = name;
      const response = await apiClient.post('/admin/groups/set', params);
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.groupSaved'));
        onDone();
      }
    } catch {
      error(t('common.error'), t('admin.groupSaveFailed'));
    }
  };

  const addMember = (username: string) => {
    if (username && !members.includes(username)) {
      setMembers(prev => [...prev, username]);
      setNewMember('');
    }
  };

  return (
    <Paper shadow="sm" p="md" withBorder mt="md">
      <Text fw={600} mb="sm">
        {t('admin.editGroupTitle', { name: group.name })}
      </Text>
      <Group grow>
        <TextInput label={t('common.name')} value={name} onChange={e => setName(e.target.value)} />
        <TextInput
          label={t('common.description')}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </Group>
      <Group mt="sm" align="end">
        <Select
          label={t('admin.members')}
          data={availableUsers.filter(u => !members.includes(u))}
          value={newMember}
          onChange={v => v && addMember(v)}
          placeholder={t('admin.addUserPlaceholder')}
          clearable
          searchable
          w={260}
        />
        <Group gap={4}>
          {members.map(member => (
            <Badge
              key={member}
              size="sm"
              variant="light"
              rightSection={
                <IconX
                  size={10}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setMembers(prev => prev.filter(m => m !== member))}
                />
              }
            >
              {member}
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

function PermissionsTab() {
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [editing, setEditing] = useState<PermissionItem | null>(null);

  const loadPermissions = async () => {
    const response = await apiClient.get<{ permissions: PermissionItem[] }>(
      '/admin/permissions/list'
    );
    if (response.status === 'ok' && response.response) {
      setPermissions(response.response.permissions);
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ permissions: PermissionItem[] }>('/admin/permissions/list')
      .then(r => {
        if (!cancelled && r.status === 'ok' && r.response) setPermissions(r.response.permissions);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const openEdit = async (item: PermissionItem) => {
    const response = await apiClient.get<PermissionItem>(
      `/admin/permissions/get?section=${encodeURIComponent(item.section)}&includeUsersAndGroups=true`
    );
    if (response.status === 'ok' && response.response) {
      setEditing(response.response);
    }
  };

  const savePermissions = async (item: PermissionItem) => {
    try {
      const userPermissions = (item.userPermissions || [])
        .map(p => `${p.username}|${p.canView}|${p.canModify}|${p.canDelete}`)
        .join('|');
      const groupPermissions = (item.groupPermissions || [])
        .map(p => `${p.name}|${p.canView}|${p.canModify}|${p.canDelete}`)
        .join('|');
      const response = await apiClient.post('/admin/permissions/set', {
        section: item.section,
        userPermissions,
        groupPermissions,
      });
      if (response.status === 'ok') {
        success(t('common.success'), t('admin.permissionsSaved'));
        setEditing(null);
        await loadPermissions();
      }
    } catch {
      error(t('common.error'), t('admin.permissionsSaveFailed'));
    }
  };

  // 嵌套权限矩阵表：行=用户/组，列=查看/修改/删除（样式与其他页面表格保持一致：striped + highlightOnHover）
  const renderPermissionTable = (
    rows: { name: string; canView: boolean; canModify: boolean; canDelete: boolean }[],
    emptyMessage: string
  ) => (
    <Table striped highlightOnHover verticalSpacing={4} fz="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th></Table.Th>
          <Table.Th ta="center">{t('common.view')}</Table.Th>
          <Table.Th ta="center">{t('common.modify')}</Table.Th>
          <Table.Th ta="center">{t('common.delete')}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={4} ta="center" c="dimmed">
              {emptyMessage}
            </Table.Td>
          </Table.Tr>
        ) : (
          rows.map(p => (
            <Table.Tr key={p.name}>
              <Table.Td style={{ maxWidth: 160 }}>
                <Text size="xs" truncate>
                  {p.name}
                </Text>
              </Table.Td>
              <Table.Td ta="center">
                <Checkbox size="xs" checked={p.canView} readOnly />
              </Table.Td>
              <Table.Td ta="center">
                <Checkbox size="xs" checked={p.canModify} readOnly />
              </Table.Td>
              <Table.Td ta="center">
                <Checkbox size="xs" checked={p.canDelete} readOnly />
              </Table.Td>
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  );

  // section 显示名称：与导航菜单一致（SECTION_NAV_KEYS 映射），未知 section 回退为原始枚举名
  const sectionLabel = (section: string) =>
    SECTION_NAV_KEYS[section] ? t(SECTION_NAV_KEYS[section]) : section;

  return (
    <Stack mt="md" gap="md">
      {permissions.map((item, i) => {
        const userRows = (item.userPermissions || []).map(p => ({
          name: p.username,
          canView: p.canView,
          canModify: p.canModify,
          canDelete: p.canDelete,
        }));
        const groupRows = (item.groupPermissions || []).map(p => ({
          name: p.name,
          canView: p.canView,
          canModify: p.canModify,
          canDelete: p.canDelete,
        }));
        return (
          <Paper key={i} shadow="sm" p="md" withBorder>
            <Group justify="space-between" mb="sm">
              <Text fw={600}>
                {sectionLabel(item.section)}
                {item.subItem && (
                  <Text span size="xs" c="dimmed">
                    {' / '}
                    {item.subItem}
                  </Text>
                )}
              </Text>
              <Button size="xs" variant="default" onClick={() => openEdit(item)}>
                {t('common.edit')}
              </Button>
            </Group>
            {/* 用户/组权限两栏并排（与原版布局一致），窄屏自动回退为上下堆叠 */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Box>
                <Text size="xs" fw={500} c="dimmed" mb={4}>
                  {t('admin.userPermissions')}
                </Text>
                {renderPermissionTable(userRows, t('admin.noUserPermissions'))}
              </Box>
              <Box>
                <Text size="xs" fw={500} c="dimmed" mb={4}>
                  {t('admin.groupPermissions')}
                </Text>
                {renderPermissionTable(groupRows, t('admin.noGroupPermissions'))}
              </Box>
            </SimpleGrid>
          </Paper>
        );
      })}

      <Modal
        opened={editing !== null}
        onClose={() => setEditing(null)}
        title={t('admin.permissionsTitle', {
          section: editing?.section ? sectionLabel(editing.section) : '',
          sub: editing?.subItem ? ` / ${editing.subItem}` : '',
        })}
        size="lg"
      >
        {editing && (
          <Stack>
            <Text fw={600}>{t('admin.userPermissions')}</Text>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('common.username')}</Table.Th>
                  <Table.Th>{t('common.view')}</Table.Th>
                  <Table.Th>{t('common.modify')}</Table.Th>
                  <Table.Th>{t('common.delete')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(editing.userPermissions || []).map((p, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{p.username}</Table.Td>
                    <Table.Td>
                      <Checkbox
                        checked={p.canView}
                        onChange={e =>
                          setEditing({
                            ...editing,
                            userPermissions: (editing.userPermissions || []).map((x, j) =>
                              j === i ? { ...x, canView: e.currentTarget.checked } : x
                            ),
                          })
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <Checkbox
                        checked={p.canModify}
                        onChange={e =>
                          setEditing({
                            ...editing,
                            userPermissions: (editing.userPermissions || []).map((x, j) =>
                              j === i ? { ...x, canModify: e.currentTarget.checked } : x
                            ),
                          })
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <Checkbox
                        checked={p.canDelete}
                        onChange={e =>
                          setEditing({
                            ...editing,
                            userPermissions: (editing.userPermissions || []).map((x, j) =>
                              j === i ? { ...x, canDelete: e.currentTarget.checked } : x
                            ),
                          })
                        }
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Text fw={600}>{t('admin.groupPermissions')}</Text>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('common.name')}</Table.Th>
                  <Table.Th>{t('common.view')}</Table.Th>
                  <Table.Th>{t('common.modify')}</Table.Th>
                  <Table.Th>{t('common.delete')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(editing.groupPermissions || []).map((p, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{p.name}</Table.Td>
                    <Table.Td>
                      <Checkbox
                        checked={p.canView}
                        onChange={e =>
                          setEditing({
                            ...editing,
                            groupPermissions: (editing.groupPermissions || []).map((x, j) =>
                              j === i ? { ...x, canView: e.currentTarget.checked } : x
                            ),
                          })
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <Checkbox
                        checked={p.canModify}
                        onChange={e =>
                          setEditing({
                            ...editing,
                            groupPermissions: (editing.groupPermissions || []).map((x, j) =>
                              j === i ? { ...x, canModify: e.currentTarget.checked } : x
                            ),
                          })
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <Checkbox
                        checked={p.canDelete}
                        onChange={e =>
                          setEditing({
                            ...editing,
                            groupPermissions: (editing.groupPermissions || []).map((x, j) =>
                              j === i ? { ...x, canDelete: e.currentTarget.checked } : x
                            ),
                          })
                        }
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => setEditing(null)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={() => savePermissions(editing)}>{t('common.save')}</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}

interface ClusterNode {
  name: string;
  ipAddress: string;
  url: string;
  type: string;
  state: string;
  upSince: string;
  lastSeen: string;
  lastSynced: string;
}

function ClusterTab() {
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
    <Stack mt="md">
      <Group justify="flex-end">
        {!clusterInitialized ? (
          <Button onClick={() => setShowInitModal(true)}>{t('admin.initialize')}</Button>
        ) : (
          <>
            <Button onClick={resyncCluster}>{t('admin.resync')}</Button>
            <Button color="yellow" onClick={leaveCluster}>
              {t('admin.leaveCluster')}
            </Button>
            <Button color="red" onClick={deleteCluster}>
              {t('admin.deleteCluster')}
            </Button>
          </>
        )}
      </Group>
      <Paper shadow="sm" p="md" withBorder>
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
                <Table.Td>{new Date(node.upSince).toLocaleString()}</Table.Td>
                <Table.Td>{new Date(node.lastSeen).toLocaleString()}</Table.Td>
                <Table.Td>{new Date(node.lastSynced).toLocaleString()}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
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

export function AdminPage({
  tab = 'sessions',
}: {
  tab?: 'sessions' | 'users' | 'groups' | 'permissions' | 'cluster';
}) {
  const { t } = useTranslation();
  return (
    <Stack>
      <Title order={2}>{t('nav.admin')}</Title>
      {tab === 'users' && <UsersTab />}
      {tab === 'groups' && <GroupsTab />}
      {tab === 'permissions' && <PermissionsTab />}
      {tab === 'cluster' && <ClusterTab />}
      {tab === 'sessions' && <SessionsTab />}
    </Stack>
  );
}
