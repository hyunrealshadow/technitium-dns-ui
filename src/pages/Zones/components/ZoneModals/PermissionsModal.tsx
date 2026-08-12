import { useEffect, useState } from 'react';
import { Button, Checkbox, Group, Modal, Select, Stack, Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../../components/notifications';
import { apiClient } from '../../../../api/client';
export function PermissionsModal({
  zone,
  opened,
  onClose,
}: {
  zone: string;
  opened: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [userPerms, setUserPerms] = useState<
    Array<{ username: string; canView: boolean; canModify: boolean; canDelete: boolean }>
  >([]);
  const [groupPerms, setGroupPerms] = useState<
    Array<{ name: string; canView: boolean; canModify: boolean; canDelete: boolean }>
  >([]);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setLoading(true);
    const load = async () => {
      try {
        const response = await fetch(
          `/api/zones/permissions/get?zone=${encodeURIComponent(zone)}&includeUsersAndGroups=true`,
          { headers: { Authorization: `Bearer ${apiClient.getToken() || ''}` } }
        );
        const data = await response.json();
        if (data.status === 'ok' && data.response) {
          setUserPerms(data.response.userPermissions || []);
          setGroupPerms(data.response.groupPermissions || []);
          setAvailableUsers(data.response.users || []);
          setAvailableGroups(data.response.groups || []);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    };
    load();
  }, [opened, zone]);

  const toggleUserPerm = (username: string, field: 'canView' | 'canModify' | 'canDelete') => {
    setUserPerms(prev =>
      prev.map(p => (p.username === username ? { ...p, [field]: !p[field] } : p))
    );
  };

  const toggleGroupPerm = (name: string, field: 'canView' | 'canModify' | 'canDelete') => {
    setGroupPerms(prev => prev.map(p => (p.name === name ? { ...p, [field]: !p[field] } : p)));
  };

  const addUserPerm = (username: string) => {
    if (username && !userPerms.find(p => p.username === username)) {
      setUserPerms(prev => [
        ...prev,
        { username, canView: true, canModify: false, canDelete: false },
      ]);
    }
  };

  const addGroupPerm = (name: string) => {
    if (name && !groupPerms.find(p => p.name === name)) {
      setGroupPerms(prev => [...prev, { name, canView: true, canModify: false, canDelete: false }]);
    }
  };

  const removeUserPerm = (username: string) => {
    setUserPerms(prev => prev.filter(p => p.username !== username));
  };

  const removeGroupPerm = (name: string) => {
    setGroupPerms(prev => prev.filter(p => p.name !== name));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userPermissions = userPerms
        .map(p => `${p.username}|${p.canView}|${p.canModify}|${p.canDelete}`)
        .join('|');
      const groupPermissions = groupPerms
        .map(p => `${p.name}|${p.canView}|${p.canModify}|${p.canDelete}`)
        .join('|');
      await apiClient.post('/zones/permissions/set', { zone, userPermissions, groupPermissions });
      success(t('common.success'), t('zones.permissionsUpdated'));
      onClose();
    } catch {
      error(t('common.error'), t('zones.permissionsUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const [newUser, setNewUser] = useState('');
  const [newGroup, setNewGroup] = useState('');

  if (loading) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title={t('zones.permissionsTitle', { zone })}
        size="lg"
      >
        <Text>{t('common.loading')}</Text>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('zones.permissionsTitle', { zone })}
      size="lg"
    >
      <Stack>
        <Text fw={600}>{t('zones.userPermissions')}</Text>
        <Group>
          <Select
            data={availableUsers.filter(u => !userPerms.find(p => p.username === u))}
            value={newUser}
            onChange={v => {
              if (v) {
                addUserPerm(v);
                setNewUser('');
              }
            }}
            placeholder={t('zones.addUserPlaceholder')}
            clearable
            searchable
          />
        </Group>
        {userPerms.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.user')}</Table.Th>
                <Table.Th>{t('common.view')}</Table.Th>
                <Table.Th>{t('common.modify')}</Table.Th>
                <Table.Th>{t('common.delete')}</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {userPerms.map(p => (
                <Table.Tr key={p.username}>
                  <Table.Td>{p.username}</Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canView}
                      onChange={() => toggleUserPerm(p.username, 'canView')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canModify}
                      onChange={() => toggleUserPerm(p.username, 'canModify')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canDelete}
                      onChange={() => toggleUserPerm(p.username, 'canDelete')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => removeUserPerm(p.username)}
                    >
                      {t('common.remove')}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" size="sm">
            {t('zones.noUserPermissions')}
          </Text>
        )}

        <Text fw={600} mt="md">
          {t('zones.groupPermissions')}
        </Text>
        <Group>
          <Select
            data={availableGroups.filter(g => !groupPerms.find(p => p.name === g))}
            value={newGroup}
            onChange={v => {
              if (v) {
                addGroupPerm(v);
                setNewGroup('');
              }
            }}
            placeholder={t('zones.addGroupPlaceholder')}
            clearable
            searchable
          />
        </Group>
        {groupPerms.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.group')}</Table.Th>
                <Table.Th>{t('common.view')}</Table.Th>
                <Table.Th>{t('common.modify')}</Table.Th>
                <Table.Th>{t('common.delete')}</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {groupPerms.map(p => (
                <Table.Tr key={p.name}>
                  <Table.Td>{p.name}</Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canView}
                      onChange={() => toggleGroupPerm(p.name, 'canView')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canModify}
                      onChange={() => toggleGroupPerm(p.name, 'canModify')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Checkbox
                      checked={p.canDelete}
                      onChange={() => toggleGroupPerm(p.name, 'canDelete')}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => removeGroupPerm(p.name)}
                    >
                      {t('common.remove')}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" size="sm">
            {t('zones.noGroupPermissions')}
          </Text>
        )}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
