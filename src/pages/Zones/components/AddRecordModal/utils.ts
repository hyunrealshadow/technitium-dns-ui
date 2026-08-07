import type { ZoneRecord } from '../../types';
import { RECORD_TYPES } from './constants';

// 按 zone 类型 / DNSSEC 签名状态裁剪可添加的记录类型
export function getRecordTypes(zoneType: string, dnssecStatus: string | null): string[] {
  const types = [...RECORD_TYPES];
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
    domain: origDomain || zone,
    type: state.recordType,
  };
  if (isEdit) params.newDomain = domain || zone;
  if (ttl) params.ttl = ttl;
  if (overwrite) params.overwrite = true;
  if (comments) params.comments = comments;
  if (expiryTtl) params.expiryTtl = expiryTtl;

  const orig = editRecord?.rData || {};

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
        if (state.glue) params.glue = state.glue;
      } else {
        params.nameServer = state.nameServer;
        if (state.glue) params.glue = state.glue;
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
        params.text = orig.text;
        params.newText = state.text;
        if (orig.splitText) params.splitText = orig.splitText;
        if (state.splitText) params.newSplitText = true;
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
        if (state.svcParams.length > 0)
          params.newSvcParams = state.svcParams.map(p => `${p.key}|${p.value}`).join('|');
        if (state.autoIpv4Hint) params.autoIpv4Hint = true;
        if (state.autoIpv6Hint) params.autoIpv6Hint = true;
      } else {
        params.svcPriority = state.svcPriority;
        params.svcTargetName = state.svcTargetName;
        if (state.svcParams.length > 0)
          params.svcParams = state.svcParams.map(p => `${p.key}|${p.value}`).join('|');
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
        params.newProtocol = state.forwarderProtocol;
        params.forwarder = orig.forwarder;
        params.newForwarder = state.forwarder;
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
      } else {
        params.protocol = state.forwarderProtocol;
        params.forwarder = state.forwarder;
        if (state.forwarderPriority) params.forwarderPriority = state.forwarderPriority;
        params.dnssecValidation = state.forwarderDnssecValidation;
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
  }
  return params;
}
