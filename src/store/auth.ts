// 认证状态管理
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { UserPermissions } from '../utils/permissions';

export interface UserSession {
  username: string;
  token: string;
  displayName?: string;
  // 当前用户各权限 section 的查看/修改/删除权限（登录响应 info.permissions），
  // 用于导航菜单过滤；旧会话无此字段时菜单全部显示（安全回退）
  permissions?: UserPermissions;
}

export const sessionAtom = atomWithStorage<UserSession | null>('session', null);

export const isAuthenticatedAtom = atom(get => {
  const session = get(sessionAtom);
  return session !== null && !!session.token;
});
