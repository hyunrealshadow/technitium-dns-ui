// Admin 页共享类型

export interface AdminSession {
  username: string;
  tokenName?: string;
  partialToken: string;
  isCurrentSession: boolean;
  type: string;
  lastSeen: string;
  lastSeenRemoteAddress: string;
  lastSeenUserAgent: string;
}

export interface AdminUser {
  username: string;
  displayName: string;
  totpEnabled: boolean;
  disabled: boolean;
  recentLogin: string;
  previousLogin: string;
}

export interface AdminGroup {
  name: string;
  description: string;
}

export interface PermissionItem {
  section: string;
  subItem: string;
  canView?: boolean;
  canModify?: boolean;
  canDelete?: boolean;
  userPermissions?: {
    username: string;
    canView: boolean;
    canModify: boolean;
    canDelete: boolean;
  }[];
  groupPermissions?: { name: string; canView: boolean; canModify: boolean; canDelete: boolean }[];
  users?: string[];
  groups?: string[];
}

export interface ClusterNode {
  name: string;
  ipAddress: string;
  url: string;
  type: string;
  state: string;
  upSince: string;
  lastSeen: string;
  lastSynced: string;
}
