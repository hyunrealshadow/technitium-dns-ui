import { Box, Divider, NavLink, Text } from '@mantine/core';
import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { sessionAtom } from '../../store/auth';
import {
  IconDashboard,
  IconServer,
  IconDatabase,
  IconShield,
  IconBan,
  IconApps,
  IconSearch,
  IconSettings,
  IconNetwork,
  IconUserShield,
  IconFileText,
  IconInfoCircle,
  type Icon,
} from '@tabler/icons-react';

interface NavChild {
  labelKey: string;
  to: string;
}

interface NavItem {
  labelKey: string;
  to: string;
  icon: Icon;
  // 对应的后端权限 section（PermissionSection 枚举名）；未指定（如关于页）则始终显示
  section?: string;
  children?: NavChild[];
}

const mainNavItems: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/dashboard', icon: IconDashboard, section: 'Dashboard' },
  { labelKey: 'nav.zones', to: '/zones', icon: IconServer, section: 'Zones' },
  { labelKey: 'nav.cache', to: '/cache', icon: IconDatabase, section: 'Cache' },
  { labelKey: 'nav.allowList', to: '/allowed', icon: IconShield, section: 'Allowed' },
  { labelKey: 'nav.blockList', to: '/blocked', icon: IconBan, section: 'Blocked' },
  { labelKey: 'nav.apps', to: '/apps', icon: IconApps, section: 'Apps' },
  { labelKey: 'nav.dnsClient', to: '/dns-client', icon: IconSearch, section: 'DnsClient' },
  {
    labelKey: 'nav.settings',
    to: '/settings/general',
    icon: IconSettings,
    section: 'Settings',
    children: [
      { labelKey: 'settings.tabGeneral', to: '/settings/general' },
      { labelKey: 'settings.tabWebService', to: '/settings/webService' },
      { labelKey: 'settings.tabOptionalProtocols', to: '/settings/optionalProtocols' },
      { labelKey: 'settings.tabTsig', to: '/settings/tsig' },
      { labelKey: 'settings.tabRecursion', to: '/settings/recursion' },
      { labelKey: 'settings.tabCache', to: '/settings/cache' },
      { labelKey: 'settings.tabBlocking', to: '/settings/blocking' },
      { labelKey: 'settings.tabProxyForwarders', to: '/settings/proxyForwarders' },
      { labelKey: 'settings.tabLogging', to: '/settings/logging' },
    ],
  },
  {
    labelKey: 'nav.dhcp',
    to: '/dhcp/leases',
    icon: IconNetwork,
    section: 'DhcpServer',
    children: [
      { labelKey: 'dhcp.leases', to: '/dhcp/leases' },
      { labelKey: 'dhcp.scopes', to: '/dhcp/scopes' },
    ],
  },
  {
    labelKey: 'nav.admin',
    to: '/admin/sessions',
    icon: IconUserShield,
    section: 'Administration',
    children: [
      { labelKey: 'admin.sessions', to: '/admin/sessions' },
      { labelKey: 'admin.users', to: '/admin/users' },
      { labelKey: 'admin.groups', to: '/admin/groups' },
      { labelKey: 'admin.permissions', to: '/admin/permissions' },
      { labelKey: 'admin.cluster', to: '/admin/cluster' },
    ],
  },
  {
    labelKey: 'nav.logs',
    to: '/logs/view',
    icon: IconFileText,
    section: 'Logs',
    children: [
      { labelKey: 'logs.viewLogs', to: '/logs/view' },
      { labelKey: 'logs.queryLogs', to: '/logs/query' },
    ],
  },
];

const aboutNavItem: NavItem = { labelKey: 'nav.about', to: '/about', icon: IconInfoCircle };

function AppNavLink({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  const currentPath = useRouterState({ select: s => s.location.pathname });

  if (!item.children) {
    return (
      <NavLink
        className="app-nav-link"
        component={Link}
        to={item.to}
        label={t(item.labelKey)}
        leftSection={<item.icon size={20} stroke={1.6} />}
        active={currentPath === item.to}
        mb={4}
      />
    );
  }

  const isActive = currentPath.startsWith(item.to.split('/').slice(0, 2).join('/'));
  return (
    <NavLink
      className="app-nav-link"
      label={t(item.labelKey)}
      leftSection={<item.icon size={20} stroke={1.6} />}
      defaultOpened={isActive}
      active={isActive}
      mb={4}
    >
      {item.children.map(child => (
        <NavLink
          className="app-nav-child"
          key={child.to}
          component={Link}
          to={child.to}
          label={t(child.labelKey)}
          active={currentPath === child.to}
          pl={28}
        />
      ))}
    </NavLink>
  );
}

export function NavLinks() {
  const { t } = useTranslation();
  const session = useAtomValue(sessionAtom);
  const permissions = session?.permissions;

  // 按当前用户权限过滤菜单：无对应 section 查看权限的菜单不显示；
  // 会话缺少权限数据（旧会话）时全部显示，保证兼容
  const visibleItems = mainNavItems.filter(item =>
    item.section ? permissions?.[item.section]?.canView !== false : true
  );

  return (
    <>
      {visibleItems.map(item => (
        <AppNavLink key={item.to} item={item} />
      ))}

      <Box mt="auto">
        <Divider my="sm" />
        <AppNavLink item={aboutNavItem} />
        <Text size="xs" c="dimmed" ta="center" mt="sm">
          {t('common.copyright', { year: new Date().getFullYear() })}
        </Text>
      </Box>
    </>
  );
}
