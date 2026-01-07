import { NavLink } from '@mantine/core';
import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconDashboard,
  IconServer,
  IconDatabase,
  IconShield,
  IconBan,
  IconApps,
  IconSearch,
  IconNetwork,
  IconUserShield,
  IconFileText,
  IconInfoCircle,
} from '@tabler/icons-react';

const navItems = [
  { labelKey: 'nav.dashboard', to: '/dashboard', icon: IconDashboard },
  { labelKey: 'nav.zones', to: '/zones', icon: IconServer },
  { labelKey: 'nav.cache', to: '/cache', icon: IconDatabase },
  { labelKey: 'nav.allowList', to: '/allowed', icon: IconShield },
  { labelKey: 'nav.blockList', to: '/blocked', icon: IconBan },
  { labelKey: 'nav.apps', to: '/apps', icon: IconApps },
  { labelKey: 'nav.dnsClient', to: '/dns-client', icon: IconSearch },
  { labelKey: 'nav.dhcp', to: '/dhcp', icon: IconNetwork },
  { labelKey: 'nav.admin', to: '/admin', icon: IconUserShield },
  { labelKey: 'nav.logs', to: '/logs', icon: IconFileText },
  { labelKey: 'nav.about', to: '/about', icon: IconInfoCircle },
];

export function NavLinks() {
  const { t } = useTranslation();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <>
      {navItems.map(item => (
        <NavLink
          key={item.to}
          component={Link}
          to={item.to}
          label={t(item.labelKey)}
          leftSection={<item.icon size={20} />}
          active={currentPath === item.to}
          style={{ marginBottom: 4 }}
        />
      ))}
    </>
  );
}
