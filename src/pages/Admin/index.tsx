import { Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { SessionsTab } from './tabs/SessionsTab';
import { UsersTab } from './tabs/UsersTab';
import { GroupsTab } from './tabs/GroupsTab';
import { PermissionsTab } from './tabs/PermissionsTab';
import { ClusterTab } from './tabs/ClusterTab';

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
