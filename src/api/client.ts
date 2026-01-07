import { router } from '../router.ts';

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
  errorMessage?: string;
  innerErrorMessage?: string;
}

export class ApiClient {
  private baseUrl = '/api';
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T = never>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const url = `${this.baseUrl}${endpoint}${
      endpoint.includes('?') ? '&' : '?'
    }token=${token || ''}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers,
      },
    });

    const data = (await response.json()) as ApiResponse<T>;
    if (data.status === 'invalid-token') {
      localStorage.removeItem('session');
      await router.navigate({
        to: '/login',
      });
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
    formData.append('username', username);
    formData.append('password', password);
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
