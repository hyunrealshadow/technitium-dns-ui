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
  if (tab === 'users') return <UsersTab />;
  if (tab === 'groups') return <GroupsTab />;
  if (tab === 'permissions') return <PermissionsTab />;
  if (tab === 'cluster') return <ClusterTab />;
  return <SessionsTab />;
}
