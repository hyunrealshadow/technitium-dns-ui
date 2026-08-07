// 权限 section 与导航菜单的映射
// 后端登录响应（/api/user/login）的 info.permissions 以 PermissionSection 枚举名（ToString()）为键，
// 这里把它映射到前端导航菜单的 i18n 键与路由，供菜单权限过滤、登录跳转、权限页标题共用。

export interface SectionPermission {
  canView: boolean;
  canModify: boolean;
  canDelete: boolean;
}

export type UserPermissions = Record<string, SectionPermission>;

// 后端 PermissionSection 枚举名 → 导航菜单 labelKey（nav 命名空间，与 NavLinks 一致）
export const SECTION_NAV_KEYS: Record<string, string> = {
  Dashboard: 'nav.dashboard',
  Zones: 'nav.zones',
  Cache: 'nav.cache',
  Allowed: 'nav.allowList',
  Blocked: 'nav.blockList',
  Apps: 'nav.apps',
  DnsClient: 'nav.dnsClient',
  Settings: 'nav.settings',
  DhcpServer: 'nav.dhcp',
  Administration: 'nav.admin',
  Logs: 'nav.logs',
};

// 权限 section → 默认路由（登录后跳转到第一个有查看权限的页面）
export const SECTION_ROUTES: Record<string, string> = {
  Dashboard: '/dashboard',
  Zones: '/zones',
  Cache: '/cache',
  Allowed: '/allowed',
  Blocked: '/blocked',
  Apps: '/apps',
  DnsClient: '/dns-client',
  Settings: '/settings/general',
  DhcpServer: '/dhcp/leases',
  Administration: '/admin/sessions',
  Logs: '/logs/view',
};

// 获取第一个有查看权限的 section 路由；permissions 缺失或全无权限时返回 null（调用方回退到 /dashboard）
export function getFirstPermittedRoute(permissions?: UserPermissions | null): string | null {
  if (!permissions) return null;

  for (const [section, route] of Object.entries(SECTION_ROUTES)) {
    if (permissions[section]?.canView) return route;
  }

  return null;
}
