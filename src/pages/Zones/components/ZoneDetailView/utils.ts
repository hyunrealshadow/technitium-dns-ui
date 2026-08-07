import type { ZoneRecord, ZoneInfo } from '../../types';

// 表格内 dot Badge 固定 body 背景，避免行 hover 高亮时 badge 融入行背景；文本光标便于选中复制
export const DOT_BADGE_STYLE = { backgroundColor: 'var(--mantine-color-body)', cursor: 'text' };

export const RECORD_TYPE_COLORS: Record<string, string> = {
  A: 'blue',
  AAAA: 'blue',
  NS: 'green',
  CNAME: 'violet',
  MX: 'orange',
  TXT: 'teal',
  SOA: 'red',
  SRV: 'pink',
  PTR: 'cyan',
  CAA: 'grape',
  DS: 'indigo',
  SSHFP: 'indigo',
  TLSA: 'indigo',
  HTTPS: 'yellow',
  SVCB: 'yellow',
  DNAME: 'violet',
  RP: 'orange',
  NAPTR: 'pink',
  DNSKEY: 'dark',
  RRSIG: 'dark',
  NSEC: 'dark',
  NSEC3: 'dark',
  NSEC3PARAM: 'dark',
  URI: 'yellow',
  ANAME: 'violet',
  FWD: 'teal',
  APP: 'grape',
};

export const DNSSEC_RECORD_TYPES = ['RRSIG', 'NSEC', 'DNSKEY', 'NSEC3', 'NSEC3PARAM'];

export function getStatus(zoneInfo: ZoneInfo | undefined): string {
  if (!zoneInfo) return 'Enabled';
  if (zoneInfo.disabled) return 'Disabled';
  if (zoneInfo.isExpired) return 'Expired';
  if (zoneInfo.validationFailed) return 'Validation Failed';
  if (zoneInfo.syncFailed) return 'Sync Failed';
  if (zoneInfo.notifyFailed) return 'Notify Failed';
  return 'Enabled';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Disabled':
      return 'gray';
    case 'Expired':
    case 'Validation Failed':
      return 'red';
    case 'Sync Failed':
    case 'Notify Failed':
      return 'yellow';
    default:
      return 'green';
  }
}

export function getDnssecStatus(zoneInfo: ZoneInfo | undefined): string | null {
  if (!zoneInfo) return null;
  const s = zoneInfo.dnssecStatus;
  if (s === 'SignedWithNSEC' || s === 'SignedWithNSEC3') return s;
  return null;
}

export function canAddRecord(isInternal: boolean | undefined, zoneType: string): boolean {
  if (isInternal) return false;
  return zoneType === 'Primary' || zoneType === 'Forwarder';
}

export function canResync(zoneType: string): boolean {
  return ['Secondary', 'SecondaryForwarder', 'SecondaryCatalog', 'Stub'].includes(zoneType);
}

export function canExport(zoneType: string): boolean {
  return [
    'Primary',
    'Forwarder',
    'Secondary',
    'SecondaryForwarder',
    'SecondaryCatalog',
    'Catalog',
  ].includes(zoneType);
}

export function canImport(zoneType: string): boolean {
  return zoneType === 'Primary' || zoneType === 'Forwarder';
}

export function canConvert(zoneType: string): boolean {
  return ['Primary', 'Secondary', 'SecondaryForwarder', 'Forwarder', 'SecondaryCatalog'].includes(
    zoneType
  );
}

export function canClone(zoneType: string): boolean {
  return zoneType === 'Primary' || zoneType === 'Forwarder';
}

export function canShowOptions(zoneType: string): boolean {
  return [
    'Primary',
    'Secondary',
    'SecondaryForwarder',
    'SecondaryCatalog',
    'Stub',
    'Forwarder',
    'Catalog',
  ].includes(zoneType);
}

// 记录操作列可见性（镜像原版 getZoneRecordRowHtml 逻辑）
export function hideRecordActions(zoneType: string, record: ZoneRecord): boolean {
  if (
    ['Internal', 'Secondary', 'SecondaryForwarder', 'SecondaryCatalog', 'Stub'].includes(zoneType)
  )
    return true;

  if (zoneType === 'Catalog') {
    return record.type !== 'SOA';
  }

  return DNSSEC_RECORD_TYPES.includes(record.type) || record.type === 'ZONEMD';
}

export function disableRecordStateButtons(record: ZoneRecord): boolean {
  return record.type === 'SOA';
}

// 记录过滤（镜像原版：@ = apex，* / ? 通配，大小写不敏感）
export function filterRecords(
  records: ZoneRecord[],
  zone: string,
  hideDnssec: boolean,
  filterType: string,
  searchText: string
): ZoneRecord[] {
  return records.filter(r => {
    if (hideDnssec && DNSSEC_RECORD_TYPES.includes(r.type)) return false;

    const matchesType = filterType === 'all' || r.type === filterType;
    if (!matchesType) return false;

    const query = searchText.trim().toLowerCase();
    if (!query) return true;

    let filterDomain = query;
    if (zone === '.') {
      if (filterDomain === '@') filterDomain = '';
    } else {
      if (filterDomain === '@') filterDomain = zone;
      else filterDomain += '.' + zone;
    }

    const recordName = r.name.toLowerCase();
    if (query.includes('*') || query.includes('?')) {
      let regexStr = filterDomain.replace(/\./g, '\\.');
      regexStr = regexStr.replace(/\*/g, '.*');
      regexStr = regexStr.replace(/\?/g, '.');
      if (regexStr.startsWith('.*\\.')) regexStr = '\\*' + regexStr.substring(2);
      return new RegExp('^' + regexStr + '$').test(recordName);
    }

    return recordName === filterDomain;
  });
}

// 记录名称展示：FQDN 转 @ / 短名
export function formatRecordName(record: ZoneRecord, zone: string): string {
  const name = record.nameIdn || record.name || '';
  if (name === '') return '.';
  const lowerName = name.toLowerCase();
  const lowerZone = zone.toLowerCase();
  if (lowerName === lowerZone) return '@';
  const i = lowerName.lastIndexOf('.' + lowerZone);
  if (i > -1) return name.substring(0, i);
  return name;
}

export function formatRecordData(record: ZoneRecord): string {
  const data = record.rData;
  if (!data) return '';
  if (data.ipAddress) return data.ipAddress as string;
  if (data.cname) return data.cname as string;
  if (data.nameServer) return data.nameServer as string;
  if (data.text) return (data.text as string).substring(0, 100);
  if (data.exchange) return `[${data.preference}] ${data.exchange}`;
  if (data.target) return `[${data.priority}|${data.weight}|${data.port}] ${data.target}`;
  if (data.ptrName) return data.ptrName as string;
  if (data.primaryNameServer) return data.primaryNameServer as string;
  if (data.dname) return data.dname as string;
  if (data.aname) return data.aname as string;
  if (data.forwarder) return data.forwarder as string;
  if (data.classPath) return data.classPath as string;
  return JSON.stringify(data);
}
