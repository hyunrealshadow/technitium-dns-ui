// 应用页共享类型

export interface DnsApp {
  classPath: string;
  description: string;
  recordDataTemplate?: string;
  isAppRecordRequestHandler: boolean;
  isRequestController: boolean;
  isAuthoritativeRequestHandler: boolean;
  isRequestBlockingHandler: boolean;
  isQueryLogger: boolean;
  isQueryLogs: boolean;
  isPostProcessor: boolean;
}

export interface App {
  name: string;
  version: string;
  updateVersion?: string;
  updateUrl?: string;
  updateAvailable: boolean;
  description?: string;
  dnsApps: DnsApp[];
}

export interface StoreApp {
  name: string;
  description: string;
  version: string;
  url: string;
  size: string;
  installed: boolean;
  installedVersion?: string;
  updateAvailable?: boolean;
}
