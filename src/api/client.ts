import { sessionAtom } from '../store/auth';
import { jotaiStore } from '../store/jotai';
import type { UserPermissions } from '../utils/permissions';

class ApiError extends Error {
  status = 'error' as const;
  errorMessage?: string;
  innerErrorMessage?: string;

  constructor(message: string, innerErrorMessage?: string) {
    super(message);
    this.errorMessage = message;
    this.innerErrorMessage = innerErrorMessage;
  }
}

export interface ApiResponse<T = never> {
  status: 'ok' | 'error' | 'invalid-token';
  errorMessage?: string;
  innerErrorMessage?: string;
  response?: T;
}

export interface LoginResponse {
  status: 'ok' | 'error' | '2fa-required';
  token: string;
  displayName: string;
  username: string;
  totpEnabled: boolean;
  server: string;
  // 登录成功时的服务器信息，含当前用户权限（info.permissions，键为 PermissionSection 枚举名）
  info?: {
    permissions?: UserPermissions;
  };
  errorMessage?: string;
  innerErrorMessage?: string;
}

export class ApiClient {
  private baseUrl = '/api';
  private token: string | null;

  constructor() {
    try {
      const session = localStorage.getItem('session');
      if (session) {
        const parsed = JSON.parse(session);
        this.token = parsed?.token || null;
      } else {
        this.token = null;
      }
    } catch {
      this.token = null;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      try {
        const session = localStorage.getItem('session');
        if (session) {
          const parsed = JSON.parse(session);
          parsed.token = token;
          localStorage.setItem('session', JSON.stringify(parsed));
        }
      } catch {
        /* ignore */
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    try {
      const session = localStorage.getItem('session');
      if (session) {
        const parsed = JSON.parse(session);
        this.token = parsed?.token || null;
      }
    } catch {
      /* ignore */
    }
    return this.token;
  }

  async request<T = never>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getToken();

    // 未登录/会话已丢失（localStorage 无 token）：不发请求，
    // 清除会话状态让 _authenticated 路由守卫自动跳转登录页
    if (!token) {
      this.token = null;
      jotaiStore.set(sessionAtom, null);
      return new ApiError('Not logged in');
    }

    const url = `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${token}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers,
      },
    });

    const data = (await response.json()) as ApiResponse<T>;

    // 登录失效判定：显式 invalid-token，或后端因 token 缺失返回错误（"Parameter 'token' missing."）
    const isSessionExpired =
      data.status === 'invalid-token' ||
      (data.status === 'error' &&
        typeof data.errorMessage === 'string' &&
        data.errorMessage.toLowerCase().includes('token') &&
        data.errorMessage.toLowerCase().includes('missing'));

    if (isSessionExpired) {
      // 清除会话状态：sessionAtom（atomWithStorage）会同步移除 localStorage，
      // isAuthenticatedAtom 变为 false 后，_authenticated 布局自动重定向到 /login
      this.token = null;
      jotaiStore.set(sessionAtom, null);
    }
    if (data.status === 'ok') {
      return data;
    }
    return new ApiError(data.errorMessage || 'Unknown error', data.innerErrorMessage);
  }

  async get<T = never>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = never>(endpoint: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  async login(username: string, password: string, totp?: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('user', username);
    formData.append('pass', password);
    if (totp) {
      formData.append('totp', totp);
    }

    const response = await fetch(`${this.baseUrl}/user/login`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      body: formData,
    });

    return await response.json();
  }
}

export const apiClient = new ApiClient();
