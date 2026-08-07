// DNS 客户端页共享类型

export interface ServerListItem {
  name?: string;
  addresses: string[];
}

export interface DnsMetadata {
  NameServer?: string;
  Protocol?: string;
  DatagramSize?: string;
  RoundTripTime?: string;
}

export interface DnsResponseRecord {
  Name: string;
  NameIDN?: string;
  Type: string;
  Class?: string;
  TTL?: string;
  RDLENGTH?: string;
  RDATA?: Record<string, unknown>;
  DnssecStatus?: string;
}

export interface DnsQueryResult {
  Metadata?: DnsMetadata;
  EDNS?: Record<string, unknown>;
  RCODE?: string;
  AuthoritativeAnswer?: boolean;
  Truncation?: boolean;
  RecursionAvailable?: boolean;
  AuthenticData?: boolean;
  Question?: { Name: string; NameIDN?: string; Type: string; Class: string }[];
  Answer?: DnsResponseRecord[];
  Authority?: DnsResponseRecord[];
  Additional?: DnsResponseRecord[];
}

export interface ResolveResponse {
  result: DnsQueryResult;
  rawResponses?: Record<string, unknown>[];
  warningMessage?: string;
}
