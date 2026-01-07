// Types for Zones

export type ZoneType =
  | 'Primary'
  | 'Secondary'
  | 'Stub'
  | 'Forwarder'
  | 'SecondaryForwarder'
  | 'SecondaryCatalog'
  | 'ForwarderCatalog'
  | 'Hint'
  | 'Cache';

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
  catalog?: string;
  importZoneFile?: boolean;
  useSoaSerialDateScheme?: boolean;
}
