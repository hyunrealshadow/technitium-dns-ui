// 设置页共享类型

export interface Settings {
  dnsServerDomain: string;
  dnsServerLocalEndPoints?: string[];
  dnsServerIPv4SourceAddresses?: string[];
  dnsServerIPv6SourceAddresses?: string[];
  defaultRecordTtl: string;
  defaultNsRecordTtl: string;
  defaultSoaRecordTtl: string;
  defaultResponsiblePerson: string;
  useSoaSerialDateScheme: boolean;
  minSoaRefresh: string;
  minSoaRetry: string;
  zoneTransferAllowedNetworks?: string[];
  notifyAllowedNetworks?: string[];
  dnsAppsEnableAutomaticUpdate: boolean;
  preferIPv6: boolean;
  enableUdpSocketPool: boolean;
  socketPoolExcludedPorts?: string[];
  udpPayloadSize: string;
  dnssecValidation: boolean;
  eDnsClientSubnet: boolean;
  eDnsClientSubnetIPv4PrefixLength: string;
  eDnsClientSubnetIPv6PrefixLength: string;
  eDnsClientSubnetIpv4Override: string;
  eDnsClientSubnetIpv6Override: string;
  qpmPrefixLimitsIPv4?: { prefix: string; udpLimit: number; tcpLimit: number }[];
  qpmPrefixLimitsIPv6?: { prefix: string; udpLimit: number; tcpLimit: number }[];
  qpmLimitSampleMinutes: string;
  qpmLimitUdpTruncationPercentage: string;
  qpmLimitBypassList?: string[];
  clientTimeout: string;
  tcpSendTimeout: string;
  tcpReceiveTimeout: string;
  quicIdleTimeout: string;
  quicMaxInboundStreams: string;
  listenBacklog: string;
  maxConcurrentResolutionsPerCore: string;
  webServiceLocalAddresses?: string[];
  webServiceHttpPort: string;
  webServiceEnableTls: boolean;
  webServiceEnableHttp3: boolean;
  webServiceHttpToTlsRedirect: boolean;
  webServiceUseSelfSignedTlsCertificate: boolean;
  webServiceTlsPort: string;
  webServiceTlsCertificatePath?: string;
  webServiceTlsCertificatePassword?: string;
  webServiceRealIpHeader: string;
  enableDnsOverUdpProxy: boolean;
  enableDnsOverTcpProxy: boolean;
  enableDnsOverHttp: boolean;
  enableDnsOverTls: boolean;
  enableDnsOverHttps: boolean;
  enableDnsOverHttp3: boolean;
  enableDnsOverQuic: boolean;
  dnsOverUdpProxyPort: string;
  dnsOverTcpProxyPort: string;
  dnsOverHttpPort: string;
  dnsOverTlsPort: string;
  dnsOverHttpsPort: string;
  dnsOverQuicPort: string;
  reverseProxyNetworkACL?: string[];
  dnsTlsCertificatePath?: string;
  dnsTlsCertificatePassword?: string;
  dnsOverHttpRealIpHeader: string;
  tsigKeys?: { keyName: string; sharedSecret: string; algorithmName: string }[];
  recursion: string;
  recursionNetworkACL?: string[];
  randomizeName: boolean;
  qnameMinimization: boolean;
  resolverRetries: string;
  resolverTimeout: string;
  resolverConcurrency: string;
  resolverMaxStackCount: string;
  saveCache: boolean;
  serveStale: boolean;
  serveStaleTtl: string;
  serveStaleAnswerTtl: string;
  serveStaleResetTtl: string;
  serveStaleMaxWaitTime: string;
  cacheMaximumEntries: string;
  cacheMinimumRecordTtl: string;
  cacheMaximumRecordTtl: string;
  cacheNegativeRecordTtl: string;
  cacheFailureRecordTtl: string;
  cachePrefetchEligibility: string;
  cachePrefetchTrigger: string;
  cachePrefetchSampleIntervalInMinutes: string;
  cachePrefetchSampleEligibilityHitsPerHour: string;
  enableBlocking: boolean;
  allowTxtBlockingReport: boolean;
  temporaryDisableBlockingTill?: string;
  blockingBypassList?: string[];
  blockingType: string;
  customBlockingAddresses?: string[];
  blockingAnswerTtl: string;
  blockListUrls?: string[];
  blockListUpdateIntervalHours: string;
  blockListNextUpdatedOn?: string;
  proxy?: {
    type: string;
    address?: string;
    port?: string;
    username?: string;
    password?: string;
    bypass?: string[];
  } | null;
  forwarders?: string[];
  forwarderProtocol: string;
  concurrentForwarding: boolean;
  forwarderRetries: string;
  forwarderTimeout: string;
  forwarderConcurrency: string;
  loggingType: string;
  ignoreResolverLogs: boolean;
  logQueries: boolean;
  useLocalTime: boolean;
  logFolder: string;
  maxLogFileDays: string;
  enableInMemoryStats: boolean;
  maxStatFileDays: string;
}

export interface QpmRow {
  prefix: string;
  udpLimit: number;
  tcpLimit: number;
}

export interface QuickBlockList {
  name: string;
  urls: string[];
}

export interface QuickForwarderList {
  name: string;
  protocol: string;
  addresses: string[];
  proxyType?: string;
  proxyAddress?: string;
  proxyPort?: string;
  proxyUsername?: string;
  proxyPassword?: string;
  bypass?: string[];
}
