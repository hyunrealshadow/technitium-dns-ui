// DHCP 页共享类型

export interface DhcpLease {
  scope: string;
  hardwareAddress: string;
  address: string;
  type: string;
  clientIdentifier: string;
  hostName: string;
  leaseObtained: string;
  leaseExpires: string;
}

export interface DhcpScope {
  name: string;
  enabled: boolean;
  startingAddress: string;
  endingAddress: string;
  subnetMask: string;
  networkAddress: string;
  broadcastAddress: string;
  interfaceAddress?: string;
}

export interface DhcpScopeDetail extends DhcpScope {
  leaseTimeDays: number;
  leaseTimeHours: number;
  leaseTimeMinutes: number;
  offerDelayTime: number;
  pingCheckEnabled: boolean;
  pingCheckTimeout: number;
  pingCheckRetries: number;
  domainName?: string;
  domainSearchList?: string[];
  dnsUpdates: boolean;
  dnsOverwriteForDynamicLease: boolean;
  dnsTtl: number;
  serverAddress?: string;
  serverHostName?: string;
  bootFileName?: string;
  routerAddress?: string;
  useThisDnsServer: boolean;
  dnsServers?: string[];
  winsServers?: string[];
  ntpServers?: string[];
  ntpServerDomainNames?: string[];
  staticRoutes?: { destination: string; subnetMask: string; router: string }[];
  vendorInfo?: { identifier: string; information: string }[];
  capwapAcIpAddresses?: string[];
  tftpServerAddresses?: string[];
  genericOptions?: { code: number; value: string }[];
  exclusions?: { startingAddress: string; endingAddress: string }[];
  reservedLeases?: {
    hostName?: string;
    hardwareAddress: string;
    address: string;
    comments?: string;
  }[];
  allowOnlyReservedLeases: boolean;
  blockLocallyAdministeredMacAddresses: boolean;
  ignoreClientIdentifierOption: boolean;
}
