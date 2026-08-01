export type ZoneType =
  | 'Primary'
  | 'Secondary'
  | 'Stub'
  | 'Forwarder'
  | 'SecondaryForwarder'
  | 'SecondaryCatalog'
  | 'ForwarderCatalog'
  | 'Hint'
  | 'Cache'
  | 'Catalog'
  | 'Internal';

export interface ZoneInfo {
  name: string;
  nameIdn?: string;
  type: ZoneType;
  lastModified: string;
  disabled: boolean;
  soaSerial: number;
  internal?: boolean;
  catalog?: string;
  dnssecStatus?: string;
  hasDnssecPrivateKeys?: boolean;
  validationFailed?: boolean;
  expiry?: string;
  isExpired?: boolean;
  syncFailed?: boolean;
  notifyFailed?: boolean;
  notifyFailedFor?: string[];
}

export interface ZonesListResponse {
  zones: ZoneInfo[];
  pageNumber: number;
  totalPages: number;
  totalZones: number;
}

export interface CreateZoneRequest {
  zone: string;
  type: ZoneType;
  primaryNameServerAddresses?: string;
  zoneTransferProtocol?: string;
  tsigKeyName?: string;
  forwarder?: string;
  forwarderProtocol?: string;
  forwarderDnssecValidation?: string;
  forwarderProxy?: string;
  importZoneFile?: boolean;
  useSoaSerialDateScheme?: boolean;
}

export interface ZoneRecord {
  name: string;
  nameIdn?: string;
  type: string;
  ttl: number;
  ttlString: string;
  disabled: boolean;
  comments?: string;
  rData: Record<string, unknown>;
}

export interface ZoneDetailResponse {
  zone: ZoneInfo & { displayName?: string };
  records: ZoneRecord[];
}

export interface AddRecordParams {
  zone: string;
  domain: string;
  type: string;
  ttl?: string;
  overwrite?: boolean;
  comments?: string;
  [key: string]: unknown;
}

export interface UpdateRecordParams {
  zone: string;
  domain: string;
  type: string;
  ttl?: string;
  disable?: boolean;
  comments?: string;
  newDomain?: string;
  [key: string]: unknown;
}
