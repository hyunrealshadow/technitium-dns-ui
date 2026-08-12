import { SessionsTab } from './tabs/SessionsTab';
import { UsersTab } from './tabs/UsersTab';
import { GroupsTab } from './tabs/GroupsTab';
import { PermissionsTab } from './tabs/PermissionsTab';
import { ClusterTab } from './tabs/ClusterTab';
import { SsoTab } from './tabs/SsoTab';

export function AdminPage({
  tab = 'sessions',
}: {
  tab?: 'sessions' | 'users' | 'groups' | 'permissions' | 'sso' | 'cluster';
}) {
  if (tab === 'users') return <UsersTab />;
  if (tab === 'groups') return <GroupsTab />;
  if (tab === 'permissions') return <PermissionsTab />;
  if (tab === 'sso') return <SsoTab />;
  if (tab === 'cluster') return <ClusterTab />;
  return <SessionsTab />;
}
