import type { ZoneRecord } from '../../types';
import { RECORD_TYPES } from './constants';

export function serializeSvcParams(params: { key: string; value: string }[]): string {
  return params.length ? params.map(p => `${p.key}|${p.value}`).join('|') : 'false';
}

// The API response uses DNS field names; mutation endpoints use type-specific parameter names.
export function getRecordDataParams(record: ZoneRecord): Record<string, unknown> {
  const r = record.rData;
  switch (record.type) {
    case 'NAPTR':
      return {
        naptrOrder: r.order,
        naptrPreference: r.preference,
        naptrFlags: r.flags,
        naptrServices: r.services,
        naptrRegexp: r.regexp,
        naptrReplacement: r.replacement,
      };
    case 'SSHFP':
      return {
        sshfpAlgorithm: r.algorithm,
        sshfpFingerprintType: r.fingerprintType,
        sshfpFingerprint: r.fingerprint,
      };
    case 'TLSA':
      return {
        tlsaCertificateUsage: r.certificateUsage,
        tlsaSelector: r.selector,
        tlsaMatchingType: r.matchingType,
        tlsaCertificateAssociationData: r.certificateAssociationData,
      };
    case 'URI':
      return { uriPriority: r.priority, uriWeight: r.weight, uri: r.uri };
    case 'SVCB':
    case 'HTTPS':
      return {
        ...r,
        svcParams: serializeSvcParams(
          Object.entries((r.svcParams || {}) as Record<string, unknown>).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        ),
      };
    case 'TXT':
      return {
        ...r,
        characterStringsBase64: Array.isArray(r.characterStringsBase64)
          ? r.characterStringsBase64.join(',')
          : undefined,
      };
    case 'NS':
      return { ...r, glue: (record.glueRecords || []).join(',') };
    case 'FWD':
      return { ...r, forwarderPriority: r.priority };
    case 'APP':
      return { appName: r.appName, classPath: r.classPath, recordData: r.data };
    default:
      return RECORD_TYPES.includes(record.type) ? { ...r } : { rdata: r.value };
  }
}

// 按 zone 类型 / DNSSEC 签名状态裁剪可添加的记录类型
export function getRecordTypes(zoneType: string, dnssecStatus: string | null): string[] {
  const types = RECORD_TYPES.filter(type => type !== 'SOA');
  if (zoneType === 'Forwarder') {
    return types.filter(t => !['DS', 'SSHFP', 'TLSA'].includes(t));
  }
  if (zoneType === 'Primary') {
    if (dnssecStatus) {
      return types.filter(t => !['ANAME', 'APP', 'FWD'].includes(t));
    }
    return types.filter(t => !['FWD'].includes(t));
  }
  return ['A', 'AAAA', 'NS', 'CNAME', 'MX', 'TXT', 'PTR', 'SRV', 'NAPTR', 'DNAME', 'RP'];
}

// 记录字段的编辑状态（AddRecordModal 内部使用）
export interface RecordFormState {
  recordType: string;
  customRecordType: string;
  rawData: string;
  ipAddress: string;
  ptr: boolean;
  createPtrZone: boolean;
  nameServer: string;
  glue: string;
  soaPrimaryNameServer: string;
  soaResponsiblePerson: string;
  soaSerial: string;
  soaRefresh: string;
  soaRetry: string;
  soaExpire: string;
  soaMinimum: string;
  soaUseSerialDateScheme: boolean;
  cname: string;
  dname: string;
  aname: string;
  preference: number;
  exchange: string;
  text: string;
  splitText: boolean;
  ptrName: string;
  mailbox: string;
  txtDomain: string;
  priority: number;
  weight: number;
  port: number;
  target: string;
  naptrOrder: number;
  naptrPreference: number;
  naptrFlags: string;
  naptrServices: string;
  naptrRegexp: string;
  naptrReplacement: string;
  keyTag: string;
  algorithm: string;
  digestType: string;
  digest: string;
  sshfpAlgorithm: string;
  sshfpFingerprintType: string;
  sshfpFingerprint: string;
  tlsaCertificateUsage: string;
  tlsaSelector: string;
  tlsaMatchingType: string;
  tlsaCertificateAssociationData: string;
  svcPriority: number;
  svcTargetName: string;
  svcParams: { key: string; value: string }[];
  autoIpv4Hint: boolean;
  autoIpv6Hint: boolean;
  uriPriority: number;
  uriWeight: number;
  uri: string;
  flags: number;
  tag: string;
  value: string;
  forwarder: string;
  forwarderProtocol: string;
  forwarderPriority: string;
  forwarderDnssecValidation: boolean;
  forwarderProxyType: string;
  forwarderProxyAddress: string;
  forwarderProxyPort: string;
  forwarderProxyUsername: string;
  forwarderProxyPassword: string;
  appName: string;
  appClassPath: string;
  recordData: string;
}

// 从 rData 初始化表单状态（数字字段保留原始值）
export function initialStateFrom(editRecord: ZoneRecord | null): RecordFormState {
  const r0 = editRecord?.rData || {};
  const str0 = (v: unknown) => (v == null ? '' : String(v));
  return {
    recordType:
      editRecord && !RECORD_TYPES.includes(editRecord.type) ? 'Unknown' : editRecord?.type || 'A',
    customRecordType: editRecord?.type || '',
    rawData: str0(r0.value),
    ipAddress: str0(r0.ipAddress),
    ptr: !!r0.ptr,
    createPtrZone: !!r0.createPtrZone,
    nameServer: str0(r0.nameServer),
    glue: (editRecord?.glueRecords || []).join(','),
    soaPrimaryNameServer: str0(r0.primaryNameServer),
    soaResponsiblePerson: str0(r0.responsiblePerson),
    soaSerial: str0(r0.serial),
    soaRefresh: str0(r0.refresh),
    soaRetry: str0(r0.retry),
    soaExpire: str0(r0.expire),
    soaMinimum: str0(r0.minimum),
    soaUseSerialDateScheme: !!r0.useSerialDateScheme,
    cname: str0(r0.cname),
    dname: str0(r0.dname),
    aname: str0(r0.aname),
    preference: r0.preference == null ? 1 : Number(r0.preference),
    exchange: str0(r0.exchange),
    text: str0(r0.text),
    splitText: !!r0.splitText,
    ptrName: str0(r0.ptrName),
    mailbox: str0(r0.mailbox),
    txtDomain: str0(r0.txtDomain),
    priority: r0.priority == null ? 0 : Number(r0.priority),
    weight: r0.weight == null ? 0 : Number(r0.weight),
    port: r0.port == null ? 80 : Number(r0.port),
    target: str0(r0.target),
    naptrOrder: r0.order == null ? 0 : Number(r0.order),
    naptrPreference: r0.preference == null ? 0 : Number(r0.preference),
    naptrFlags: str0(r0.flags),
    naptrServices: str0(r0.services),
    naptrRegexp: str0(r0.regexp),
    naptrReplacement: str0(r0.replacement),
    keyTag: str0(r0.keyTag),
    algorithm: str0(r0.algorithm),
    digestType: str0(r0.digestType),
    digest: str0(r0.digest),
    sshfpAlgorithm: str0(r0.algorithm),
    sshfpFingerprintType: str0(r0.fingerprintType),
    sshfpFingerprint: str0(r0.fingerprint),
    tlsaCertificateUsage: str0(r0.certificateUsage),
    tlsaSelector: str0(r0.selector),
    tlsaMatchingType: str0(r0.matchingType),
    tlsaCertificateAssociationData: str0(r0.certificateAssociationData),
    svcPriority: r0.svcPriority == null ? 0 : Number(r0.svcPriority),
    svcTargetName: str0(r0.svcTargetName),
    svcParams: Object.entries((r0.svcParams || {}) as Record<string, unknown>).map(
      ([key, value]) => ({ key, value: String(value) })
    ),
    autoIpv4Hint: !!r0.autoIpv4Hint,
    autoIpv6Hint: !!r0.autoIpv6Hint,
    uriPriority: r0.priority == null ? 0 : Number(r0.priority),
    uriWeight: r0.weight == null ? 0 : Number(r0.weight),
    uri: str0(r0.uri),
    flags: r0.flags == null ? 0 : Number(r0.flags),
    tag: str0(r0.tag) || 'issue',
    value: str0(r0.value),
    forwarder: str0(r0.forwarder),
    forwarderProtocol: str0(r0.protocol) || 'Udp',
    forwarderPriority: str0(r0.priority),
    forwarderDnssecValidation: !!r0.dnssecValidation,
    forwarderProxyType: str0(r0.proxyType) || 'DefaultProxy',
    forwarderProxyAddress: str0(r0.proxyAddress),
    forwarderProxyPort: str0(r0.proxyPort),
    forwarderProxyUsername: str0(r0.proxyUsername),
    forwarderProxyPassword: str0(r0.proxyPassword),
    appName: str0(r0.appName),
    appClassPath: str0(r0.classPath),
    recordData: str0(r0.data),
  };
}

// 编辑模式下按“原值 + new* 新值”构造提交参数（与后端 UpdateRecordParams 约定一致）
export function buildParams(
  state: RecordFormState,
  editRecord: ZoneRecord | null,
  zone: string,
  domain: string,
  ttl: string,
  overwrite: boolean,
  comments: string,
  expiryTtl: string
): Record<string, unknown> {
  const isEdit = !!editRecord;
  const origDomain = editRecord?.name || '';
  const params: Record<string, unknown> = {
    zone,
    domain: isEdit ? origDomain : domain.trim() || zone,
    type: state.recordType === 'Unknown' ? state.customRecordType : state.recordType,
  };
  if (isEdit) {
    params.newDomain = domain.trim() || zone;
    params.disable = editRecord.disabled;
  }
  if (ttl) params.ttl = ttl;
  if (overwrite) params.overwrite = true;
  params.comments = comments;
  if (expiryTtl || isEdit) params.expiryTtl = expiryTtl || '0';

  const orig = editRecord ? getRecordDataParams(editRecord) : {};

  switch (state.recordType) {
    case 'A':
    case 'AAAA':
      if (isEdit) {
        params.ipAddress = orig.ipAddress;
        params.newIpAddress = state.ipAddress;
        if (state.ptr) {
          params.ptr = true;
          if (state.createPtrZone) params.createPtrZone = true;
        }
      } else {
        params.ipAddress = state.ipAddress;
        if (state.ptr) {
          params.ptr = true;
          if (state.createPtrZone) params.createPtrZone = true;
        }
      }
      break;
    case 'NS':
      if (isEdit) {
        params.nameServer = orig.nameServer;
        params.newNameServer = state.nameServer;
        params.glue = state.glue;
      } else {
        params.nameServer = state.nameServer;
        params.glue = state.glue;
      }
      break;
    case 'SOA':
      params.primaryNameServer = state.soaPrimaryNameServer;
      params.responsiblePerson = state.soaResponsiblePerson;
      params.serial = state.soaSerial;
      params.refresh = state.soaRefresh;
      params.retry = state.soaRetry;
      params.expire = state.soaExpire;
      params.minimum = state.soaMinimum;
      params.useSerialDateScheme = state.soaUseSerialDateScheme;
      break;
    case 'CNAME':
      params.cname = state.cname;
      break;
    case 'MX':
      if (isEdit) {
        params.preference = orig.preference;
        params.newPreference = state.preference;
        params.exchange = orig.exchange;
        params.newExchange = state.exchange;
      } else {
        params.preference = state.preference;
        params.exchange = state.exchange;
      }
      break;
    case 'TXT':
      if (isEdit) {
        if (orig.characterStringsBase64 !== undefined) {
          params.characterStringsBase64 = orig.characterStringsBase64;
        } else {
          params.text = orig.text;
          if (orig.splitText) params.splitText = orig.splitText;
        }
        if (
          state.text !== editRecord.rData.text ||
          state.splitText !== editRecord.rData.splitText
        ) {
          params.newText = state.text;
          params.newSplitText = state.splitText;
        }
      } else {
        params.text = state.text;
        if (state.splitText) params.splitText = true;
      }
      break;
    case 'PTR':
      if (isEdit) {
        params.ptrName = orig.ptrName;
        params.newPtrName = state.ptrName;
      } else {
        params.ptrName = state.ptrName;
      }
      break;
    case 'RP':
      if (isEdit) {
        params.mailbox = orig.mailbox;
        params.newMailbox = state.mailbox;
        params.txtDomain = orig.txtDomain;
        params.newTxtDomain = state.txtDomain;
      } else {
        params.mailbox = state.mailbox;
        params.txtDomain = state.txtDomain;
      }
      break;
    case 'SRV':
      if (isEdit) {
        params.priority = orig.priority;
        params.newPriority = state.priority;
        params.weight = orig.weight;
        params.newWeight = state.weight;
        params.port = orig.port;
        params.newPort = state.port;
        params.target = orig.target;
        params.newTarget = state.target;
      } else {
        params.priority = state.priority;
        params.weight = state.weight;
        params.port = state.port;
        params.target = state.target;
      }
      break;
    case 'NAPTR':
      if (isEdit) {
        params.naptrOrder = orig.naptrOrder;
        params.naptrNewOrder = state.naptrOrder;
        params.naptrPreference = orig.naptrPreference;
        params.naptrNewPreference = state.naptrPreference;
        params.naptrFlags = orig.naptrFlags;
        params.naptrNewFlags = state.naptrFlags;
        params.naptrServices = orig.naptrServices;
        params.naptrNewServices = state.naptrServices;
        params.naptrRegexp = orig.naptrRegexp;
        params.naptrNewRegexp = state.naptrRegexp;
        params.naptrReplacement = orig.naptrReplacement;
        params.naptrNewReplacement = state.naptrReplacement;
      } else {
        params.naptrOrder = state.naptrOrder;
        params.naptrPreference = state.naptrPreference;
        params.naptrFlags = state.naptrFlags;
        params.naptrServices = state.naptrServices;
        params.naptrRegexp = state.naptrRegexp;
        params.naptrReplacement = state.naptrReplacement;
      }
      break;
    case 'DNAME':
      params.dname = state.dname;
      break;
    case 'DS':
      if (isEdit) {
        params.keyTag = orig.keyTag;
        params.newKeyTag = state.keyTag;
        params.algorithm = orig.algorithm;
        params.newAlgorithm = state.algorithm;
        params.digestType = orig.digestType;
        params.newDigestType = state.digestType;
        params.digest = orig.digest;
        params.newDigest = state.digest;
      } else {
        params.keyTag = state.keyTag;
        params.algorithm = state.algorithm;
        params.digestType = state.digestType;
        params.digest = state.digest;
      }
      break;
    case 'SSHFP':
      if (isEdit) {
        params.sshfpAlgorithm = orig.sshfpAlgorithm;
        params.newSshfpAlgorithm = state.sshfpAlgorithm;
        params.sshfpFingerprintType = orig.sshfpFingerprintType;
        params.newSshfpFingerprintType = state.sshfpFingerprintType;
        params.sshfpFingerprint = orig.sshfpFingerprint;
        params.newSshfpFingerprint = state.sshfpFingerprint;
      } else {
        params.sshfpAlgorithm = state.sshfpAlgorithm;
        params.sshfpFingerprintType = state.sshfpFingerprintType;
        params.sshfpFingerprint = state.sshfpFingerprint;
      }
      break;
    case 'TLSA':
      if (isEdit) {
        params.tlsaCertificateUsage = orig.tlsaCertificateUsage;
        params.newTlsaCertificateUsage = state.tlsaCertificateUsage;
        params.tlsaSelector = orig.tlsaSelector;
        params.newTlsaSelector = state.tlsaSelector;
        params.tlsaMatchingType = orig.tlsaMatchingType;
        params.newTlsaMatchingType = state.tlsaMatchingType;
        params.tlsaCertificateAssociationData = orig.tlsaCertificateAssociationData;
        params.newTlsaCertificateAssociationData = state.tlsaCertificateAssociationData;
      } else {
        params.tlsaCertificateUsage = state.tlsaCertificateUsage;
        params.tlsaSelector = state.tlsaSelector;
        params.tlsaMatchingType = state.tlsaMatchingType;
        params.tlsaCertificateAssociationData = state.tlsaCertificateAssociationData;
      }
      break;
    case 'SVCB':
    case 'HTTPS':
      if (isEdit) {
        params.svcPriority = orig.svcPriority;
        params.newSvcPriority = state.svcPriority;
        params.svcTargetName = orig.svcTargetName;
        params.newSvcTargetName = state.svcTargetName;
        params.svcParams = orig.svcParams;
        params.newSvcParams = serializeSvcParams(state.svcParams);
        if (state.autoIpv4Hint) params.autoIpv4Hint = true;
        if (state.autoIpv6Hint) params.autoIpv6Hint = true;
      } else {
        params.svcPriority = state.svcPriority;
        params.svcTargetName = state.svcTargetName;
        params.svcParams = serializeSvcParams(state.svcParams);
        if (state.autoIpv4Hint) params.autoIpv4Hint = true;
        if (state.autoIpv6Hint) params.autoIpv6Hint = true;
      }
      break;
    case 'URI':
      if (isEdit) {
        params.uriPriority = orig.uriPriority;
        params.newUriPriority = state.uriPriority;
        params.uriWeight = orig.uriWeight;
        params.newUriWeight = state.uriWeight;
        params.uri = orig.uri;
        params.newUri = state.uri;
      } else {
        params.uriPriority = state.uriPriority;
        params.uriWeight = state.uriWeight;
        params.uri = state.uri;
      }
      break;
    case 'CAA':
      if (isEdit) {
        params.flags = orig.flags;
        params.tag = orig.tag;
        params.newFlags = state.flags;
        params.newTag = state.tag;
        params.value = orig.value;
        params.newValue = state.value;
      } else {
        params.flags = state.flags;
        params.tag = state.tag;
        params.value = state.value;
      }
      break;
    case 'ANAME':
      if (isEdit) {
        params.aname = orig.aname;
        params.newAName = state.aname;
      } else {
        params.aname = state.aname;
      }
      break;
    case 'FWD':
      if (isEdit) {
        params.protocol = orig.protocol;
        params.newProtocol = state.forwarder === 'this-server' ? 'Udp' : state.forwarderProtocol;
        params.forwarder = orig.forwarder;
        params.newForwarder = state.forwarder;
      } else {
        params.protocol = state.forwarder === 'this-server' ? 'Udp' : state.forwarderProtocol;
        params.forwarder = state.forwarder;
      }
      if (state.forwarderPriority) params.forwarderPriority = state.forwarderPriority;
      params.dnssecValidation = state.forwarderDnssecValidation;
      if (state.forwarder !== 'this-server') {
        params.proxyType = state.forwarderProxyType;
        if (state.forwarderProxyType === 'Http' || state.forwarderProxyType === 'Socks5') {
          params.proxyAddress = state.forwarderProxyAddress;
          params.proxyPort = state.forwarderProxyPort;
          params.proxyUsername = state.forwarderProxyUsername || '';
          params.proxyPassword = state.forwarderProxyPassword || '';
        }
      }
      break;
    case 'APP':
      if (isEdit) {
        params.appName = orig.appName;
        params.classPath = orig.classPath;
        params.recordData = state.recordData;
      } else {
        params.appName = state.appName;
        params.classPath = state.appClassPath;
        params.recordData = state.recordData;
      }
      break;
    case 'Unknown':
      params.rdata = isEdit ? orig.rdata : state.rawData;
      if (isEdit) params.newRData = state.rawData;
      break;
  }
  return params;
}
