import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
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
import type { AdminGroup } from '../types';

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

export function GroupsTab() {
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
