import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import { PageHeader } from '../../../components/PageHeader';
import { SECTION_NAV_KEYS } from '../../../utils/permissions';
import type { PermissionItem } from '../types';

export function PermissionsTab() {
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
    <Stack gap="md">
      <PageHeader title={t('nav.admin')} />
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
