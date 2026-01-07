// 认证状态管理
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface UserSession {
  username: string;
  token: string;
  displayName?: string;
}

export const sessionAtom = atomWithStorage<UserSession | null>('session', null);

export const isAuthenticatedAtom = atom(get => {
  const session = get(sessionAtom);
  return session !== null && !!session.token;
});
