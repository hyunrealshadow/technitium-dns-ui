import { useState } from 'react';
import {
  Button,
  Checkbox,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Text,
  Textarea,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import type { ZoneRecord } from '../types';

const RECORD_TYPES = [
  'A',
  'AAAA',
  'NS',
  'CNAME',
  'SOA',
  'MX',
  'TXT',
  'PTR',
  'RP',
  'SRV',
  'NAPTR',
  'DNAME',
  'DS',
  'SSHFP',
  'TLSA',
  'SVCB',
  'HTTPS',
  'URI',
  'CAA',
  'ANAME',
  'FWD',
  'APP',
];

const DNSSEC_ALGORITHMS = [
  'RSAMD5',
  'RSASHA1',
  'RSASHA256',
  'RSASHA512',
  'ECDSAP256SHA256',
  'ECDSAP384SHA384',
  'ED25519',
  'ED448',
];

const DIGEST_TYPES = ['SHA1', 'SHA256', 'SHA384'];

const SSHFP_ALGORITHMS = ['RSA', 'DSA', 'ECDSA', 'Ed25519', 'Ed448'];
const SSHFP_FINGERPRINT_TYPES = ['SHA1', 'SHA256'];

const TLSA_CERTIFICATE_USAGES = ['PKIX-TA', 'PKIX-EE', 'DANE-TA', 'DANE-EE'];
const TLSA_SELECTORS = ['Cert', 'SPKI'];
const TLSA_MATCHING_TYPES = ['Full', 'SHA2-256', 'SHA2-512'];

interface AddRecordModalProps {
  zone: string;
  zoneType: string;
  dnssecStatus: string | null;
  editRecord: ZoneRecord | null;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRecordModal({
  zone,
  zoneType,
  dnssecStatus,
  editRecord,
  opened,
  onClose,
  onSuccess,
}: AddRecordModalProps) {
  const { t } = useTranslation();
  const isEdit = !!editRecord;

  const allowedTypes = getRecordTypes(zoneType, dnssecStatus);

  const r0 = editRecord?.rData || {};
  const str0 = (v: unknown) => (v == null ? '' : String(v));

  const [recordType, setRecordType] = useState(editRecord?.type || 'A');
  const [domain, setDomain] = useState(editRecord?.name || '');
  const [ttl, setTtl] = useState(str0(r0.ttl));
  const [overwrite, setOverwrite] = useState(false);
  const [comments, setComments] = useState(editRecord?.comments || '');
  const [expiryTtl, setExpiryTtl] = useState('');

  // A/AAAA
  const [ipAddress, setIpAddress] = useState(str0(r0.ipAddress));
  const [ptr, setPtr] = useState(!!r0.ptr);
  const [createPtrZone, setCreatePtrZone] = useState(!!r0.createPtrZone);

  // NS
  const [nameServer, setNameServer] = useState(str0(r0.nameServer));
  const [glue, setGlue] = useState(str0(r0.glue));

  // SOA
  const [soaPrimaryNameServer, setSoaPrimaryNameServer] = useState(str0(r0.primaryNameServer));
  const [soaResponsiblePerson, setSoaResponsiblePerson] = useState(str0(r0.responsiblePerson));
  const [soaSerial, setSoaSerial] = useState(str0(r0.serial));
  const [soaRefresh, setSoaRefresh] = useState(str0(r0.refresh));
  const [soaRetry, setSoaRetry] = useState(str0(r0.retry));
  const [soaExpire, setSoaExpire] = useState(str0(r0.expire));
  const [soaMinimum, setSoaMinimum] = useState(str0(r0.minimum));
  const [soaUseSerialDateScheme, setSoaUseSerialDateScheme] = useState(false);

  // CNAME/DNAME/ANAME
  const [cname, setCname] = useState(str0(r0.cname));
  const [dname, setDname] = useState(str0(r0.dname));
  const [aname, setAname] = useState(str0(r0.aname));

  // MX
  const [preference, setPreference] = useState(r0.preference == null ? 1 : Number(r0.preference));
  const [exchange, setExchange] = useState(str0(r0.exchange));

  // TXT
  const [text, setText] = useState(str0(r0.text));
  const [splitText, setSplitText] = useState(!!r0.splitText);

  // PTR
  const [ptrName, setPtrName] = useState(str0(r0.ptrName));

  // RP
  const [mailbox, setMailbox] = useState(str0(r0.mailbox));
  const [txtDomain, setTxtDomain] = useState(str0(r0.txtDomain));

  // SRV
  const [priority, setPriority] = useState(r0.priority == null ? 0 : Number(r0.priority));
  const [weight, setWeight] = useState(r0.weight == null ? 0 : Number(r0.weight));
  const [port, setPort] = useState(r0.port == null ? 80 : Number(r0.port));
  const [target, setTarget] = useState(str0(r0.target));

  // NAPTR
  const [naptrOrder, setNaptrOrder] = useState(r0.naptrOrder == null ? 0 : Number(r0.naptrOrder));
  const [naptrPreference, setNaptrPreference] = useState(
    r0.naptrPreference == null ? 0 : Number(r0.naptrPreference)
  );
  const [naptrFlags, setNaptrFlags] = useState(str0(r0.naptrFlags));
  const [naptrServices, setNaptrServices] = useState(str0(r0.naptrServices));
  const [naptrRegexp, setNaptrRegexp] = useState(str0(r0.naptrRegexp));
  const [naptrReplacement, setNaptrReplacement] = useState(str0(r0.naptrReplacement));

  // DS
  const [keyTag, setKeyTag] = useState(str0(r0.keyTag));
  const [algorithm, setAlgorithm] = useState(str0(r0.algorithm));
  const [digestType, setDigestType] = useState(str0(r0.digestType));
  const [digest, setDigest] = useState(str0(r0.digest));

  // SSHFP
  const [sshfpAlgorithm, setSshfpAlgorithm] = useState(str0(r0.sshfpAlgorithm));
  const [sshfpFingerprintType, setSshfpFingerprintType] = useState(str0(r0.sshfpFingerprintType));
  const [sshfpFingerprint, setSshfpFingerprint] = useState(str0(r0.sshfpFingerprint));

  // TLSA
  const [tlsaCertificateUsage, setTlsaCertificateUsage] = useState(str0(r0.tlsaCertificateUsage));
  const [tlsaSelector, setTlsaSelector] = useState(str0(r0.tlsaSelector));
  const [tlsaMatchingType, setTlsaMatchingType] = useState(str0(r0.tlsaMatchingType));
  const [tlsaCertificateAssociationData, setTlsaCertificateAssociationData] = useState(
    str0(r0.tlsaCertificateAssociationData)
  );

  // SVCB/HTTPS
  const [svcPriority, setSvcPriority] = useState(
    r0.svcPriority == null ? 0 : Number(r0.svcPriority)
  );
  const [svcTargetName, setSvcTargetName] = useState(str0(r0.svcTargetName));
  const [svcParams, setSvcParams] = useState<{ key: string; value: string }[]>([]);
  const [autoIpv4Hint, setAutoIpv4Hint] = useState(false);
  const [autoIpv6Hint, setAutoIpv6Hint] = useState(false);

  // URI
  const [uriPriority, setUriPriority] = useState(
    r0.uriPriority == null ? 0 : Number(r0.uriPriority)
  );
  const [uriWeight, setUriWeight] = useState(r0.uriWeight == null ? 0 : Number(r0.uriWeight));
  const [uri, setUri] = useState(str0(r0.uri));

  // CAA
  const [flags, setFlags] = useState(r0.flags == null ? 0 : Number(r0.flags));
  const [tag, setTag] = useState(str0(r0.tag) || 'issue');
  const [value, setValue] = useState(str0(r0.value));

  // FWD
  const [forwarder, setForwarder] = useState(str0(r0.forwarder));
  const [forwarderProtocol, setForwarderProtocol] = useState(str0(r0.protocol) || 'Udp');
  const [forwarderPriority, setForwarderPriority] = useState('');
  const [forwarderDnssecValidation, setForwarderDnssecValidation] = useState(false);
  const [forwarderProxyType, setForwarderProxyType] = useState('DefaultProxy');
  const [forwarderProxyAddress, setForwarderProxyAddress] = useState('');
  const [forwarderProxyPort, setForwarderProxyPort] = useState('');
  const [forwarderProxyUsername, setForwarderProxyUsername] = useState('');
  const [forwarderProxyPassword, setForwarderProxyPassword] = useState('');

  // APP
  const [appName, setAppName] = useState(str0(r0.appName));
  const [appClassPath, setAppClassPath] = useState(str0(r0.classPath));
  const [recordData, setRecordData] = useState(str0(r0.recordData));

  const buildParams = () => {
    const origDomain = editRecord?.name || '';
    const newDomain = domain || zone;
    const params: Record<string, unknown> = {
      zone,
      domain: origDomain || zone,
      type: recordType,
    };
    if (isEdit) params.newDomain = newDomain;
    if (ttl) params.ttl = ttl;
    if (overwrite) params.overwrite = true;
    if (comments) params.comments = comments;
    if (expiryTtl) params.expiryTtl = expiryTtl;

    const orig = editRecord?.rData || {};

    switch (recordType) {
      case 'A':
      case 'AAAA':
        if (isEdit) {
          params.ipAddress = orig.ipAddress;
          params.newIpAddress = ipAddress;
          if (ptr) {
            params.ptr = true;
            if (createPtrZone) params.createPtrZone = true;
          }
        } else {
          params.ipAddress = ipAddress;
          if (ptr) {
            params.ptr = true;
            if (createPtrZone) params.createPtrZone = true;
          }
        }
        break;
      case 'NS':
        if (isEdit) {
          params.nameServer = orig.nameServer;
          params.newNameServer = nameServer;
          if (glue) params.glue = glue;
        } else {
          params.nameServer = nameServer;
          if (glue) params.glue = glue;
        }
        break;
      case 'SOA':
        params.primaryNameServer = soaPrimaryNameServer;
        params.responsiblePerson = soaResponsiblePerson;
        params.serial = soaSerial;
        params.refresh = soaRefresh;
        params.retry = soaRetry;
        params.expire = soaExpire;
        params.minimum = soaMinimum;
        params.useSerialDateScheme = soaUseSerialDateScheme;
        break;
      case 'CNAME':
        params.cname = cname;
        break;
      case 'MX':
        if (isEdit) {
          params.preference = orig.preference;
          params.newPreference = preference;
          params.exchange = orig.exchange;
          params.newExchange = exchange;
        } else {
          params.preference = preference;
          params.exchange = exchange;
        }
        break;
      case 'TXT':
        if (isEdit) {
          params.text = orig.text;
          params.newText = text;
          if (orig.splitText) params.splitText = orig.splitText;
          if (splitText) params.newSplitText = true;
        } else {
          params.text = text;
          if (splitText) params.splitText = true;
        }
        break;
      case 'PTR':
        if (isEdit) {
          params.ptrName = orig.ptrName;
          params.newPtrName = ptrName;
        } else {
          params.ptrName = ptrName;
        }
        break;
      case 'RP':
        if (isEdit) {
          params.mailbox = orig.mailbox;
          params.newMailbox = mailbox;
          params.txtDomain = orig.txtDomain;
          params.newTxtDomain = txtDomain;
        } else {
          params.mailbox = mailbox;
          params.txtDomain = txtDomain;
        }
        break;
      case 'SRV':
        if (isEdit) {
          params.priority = orig.priority;
          params.newPriority = priority;
          params.weight = orig.weight;
          params.newWeight = weight;
          params.port = orig.port;
          params.newPort = port;
          params.target = orig.target;
          params.newTarget = target;
        } else {
          params.priority = priority;
          params.weight = weight;
          params.port = port;
          params.target = target;
        }
        break;
      case 'NAPTR':
        if (isEdit) {
          params.naptrOrder = orig.naptrOrder;
          params.naptrNewOrder = naptrOrder;
          params.naptrPreference = orig.naptrPreference;
          params.naptrNewPreference = naptrPreference;
          params.naptrFlags = orig.naptrFlags;
          params.naptrNewFlags = naptrFlags;
          params.naptrServices = orig.naptrServices;
          params.naptrNewServices = naptrServices;
          params.naptrRegexp = orig.naptrRegexp;
          params.naptrNewRegexp = naptrRegexp;
          params.naptrReplacement = orig.naptrReplacement;
          params.naptrNewReplacement = naptrReplacement;
        } else {
          params.naptrOrder = naptrOrder;
          params.naptrPreference = naptrPreference;
          params.naptrFlags = naptrFlags;
          params.naptrServices = naptrServices;
          params.naptrRegexp = naptrRegexp;
          params.naptrReplacement = naptrReplacement;
        }
        break;
      case 'DNAME':
        params.dname = dname;
        break;
      case 'DS':
        if (isEdit) {
          params.keyTag = orig.keyTag;
          params.newKeyTag = keyTag;
          params.algorithm = orig.algorithm;
          params.newAlgorithm = algorithm;
          params.digestType = orig.digestType;
          params.newDigestType = digestType;
          params.digest = orig.digest;
          params.newDigest = digest;
        } else {
          params.keyTag = keyTag;
          params.algorithm = algorithm;
          params.digestType = digestType;
          params.digest = digest;
        }
        break;
      case 'SSHFP':
        if (isEdit) {
          params.sshfpAlgorithm = orig.sshfpAlgorithm;
          params.newSshfpAlgorithm = sshfpAlgorithm;
          params.sshfpFingerprintType = orig.sshfpFingerprintType;
          params.newSshfpFingerprintType = sshfpFingerprintType;
          params.sshfpFingerprint = orig.sshfpFingerprint;
          params.newSshfpFingerprint = sshfpFingerprint;
        } else {
          params.sshfpAlgorithm = sshfpAlgorithm;
          params.sshfpFingerprintType = sshfpFingerprintType;
          params.sshfpFingerprint = sshfpFingerprint;
        }
        break;
      case 'TLSA':
        if (isEdit) {
          params.tlsaCertificateUsage = orig.tlsaCertificateUsage;
          params.newTlsaCertificateUsage = tlsaCertificateUsage;
          params.tlsaSelector = orig.tlsaSelector;
          params.newTlsaSelector = tlsaSelector;
          params.tlsaMatchingType = orig.tlsaMatchingType;
          params.newTlsaMatchingType = tlsaMatchingType;
          params.tlsaCertificateAssociationData = orig.tlsaCertificateAssociationData;
          params.newTlsaCertificateAssociationData = tlsaCertificateAssociationData;
        } else {
          params.tlsaCertificateUsage = tlsaCertificateUsage;
          params.tlsaSelector = tlsaSelector;
          params.tlsaMatchingType = tlsaMatchingType;
          params.tlsaCertificateAssociationData = tlsaCertificateAssociationData;
        }
        break;
      case 'SVCB':
      case 'HTTPS':
        if (isEdit) {
          params.svcPriority = orig.svcPriority;
          params.newSvcPriority = svcPriority;
          params.svcTargetName = orig.svcTargetName;
          params.newSvcTargetName = svcTargetName;
          if (svcParams.length > 0)
            params.newSvcParams = svcParams.map(p => `${p.key}|${p.value}`).join('|');
          if (autoIpv4Hint) params.autoIpv4Hint = true;
          if (autoIpv6Hint) params.autoIpv6Hint = true;
        } else {
          params.svcPriority = svcPriority;
          params.svcTargetName = svcTargetName;
          if (svcParams.length > 0)
            params.svcParams = svcParams.map(p => `${p.key}|${p.value}`).join('|');
          if (autoIpv4Hint) params.autoIpv4Hint = true;
          if (autoIpv6Hint) params.autoIpv6Hint = true;
        }
        break;
      case 'URI':
        if (isEdit) {
          params.uriPriority = orig.uriPriority;
          params.newUriPriority = uriPriority;
          params.uriWeight = orig.uriWeight;
          params.newUriWeight = uriWeight;
          params.uri = orig.uri;
          params.newUri = uri;
        } else {
          params.uriPriority = uriPriority;
          params.uriWeight = uriWeight;
          params.uri = uri;
        }
        break;
      case 'CAA':
        if (isEdit) {
          params.flags = orig.flags;
          params.tag = orig.tag;
          params.newFlags = flags;
          params.newTag = tag;
          params.value = orig.value;
          params.newValue = value;
        } else {
          params.flags = flags;
          params.tag = tag;
          params.value = value;
        }
        break;
      case 'ANAME':
        if (isEdit) {
          params.aname = orig.aname;
          params.newAName = aname;
        } else {
          params.aname = aname;
        }
        break;
      case 'FWD':
        if (isEdit) {
          params.protocol = orig.protocol;
          params.newProtocol = forwarderProtocol;
          params.forwarder = orig.forwarder;
          params.newForwarder = forwarder;
          if (forwarderPriority) params.forwarderPriority = forwarderPriority;
          params.dnssecValidation = forwarderDnssecValidation;
          if (forwarder !== 'this-server') {
            params.proxyType = forwarderProxyType;
            if (forwarderProxyType === 'Http' || forwarderProxyType === 'Socks5') {
              params.proxyAddress = forwarderProxyAddress;
              params.proxyPort = forwarderProxyPort;
              params.proxyUsername = forwarderProxyUsername || '';
              params.proxyPassword = forwarderProxyPassword || '';
            }
          }
        } else {
          params.protocol = forwarderProtocol;
          params.forwarder = forwarder;
          if (forwarderPriority) params.forwarderPriority = forwarderPriority;
          params.dnssecValidation = forwarderDnssecValidation;
          params.proxyType = forwarderProxyType;
          if (forwarderProxyType === 'Http' || forwarderProxyType === 'Socks5') {
            params.proxyAddress = forwarderProxyAddress;
            params.proxyPort = forwarderProxyPort;
            params.proxyUsername = forwarderProxyUsername || '';
            params.proxyPassword = forwarderProxyPassword || '';
          }
        }
        break;
      case 'APP':
        if (isEdit) {
          params.appName = orig.appName;
          params.classPath = orig.classPath;
          params.recordData = recordData;
        } else {
          params.appName = appName;
          params.classPath = appClassPath;
          params.recordData = recordData;
        }
        break;
    }
    return params;
  };

  const handleSubmit = async () => {
    try {
      const endpoint = isEdit ? '/zones/records/update' : '/zones/records/add';
      await apiClient.post(endpoint, buildParams());
      success(t('common.success'), isEdit ? t('zones.recordUpdated') : t('zones.recordAdded'));
      onSuccess();
    } catch {
      error(t('common.error'), isEdit ? t('zones.recordUpdateFailed') : t('zones.recordAddFailed'));
    }
  };

  const addSvcbParamRow = () => setSvcParams(prev => [...prev, { key: '', value: '' }]);

  const renderTypeFields = () => {
    switch (recordType) {
      case 'A':
      case 'AAAA':
        return (
          <Stack gap="sm">
            <TextInput
              label={recordType === 'A' ? t('zones.ipv4Address') : t('zones.ipv6Address')}
              placeholder={recordType === 'A' ? '1.2.3.4' : '2001:db8::'}
              value={ipAddress}
              onChange={e => setIpAddress(e.target.value)}
              required
            />
            <Checkbox
              label={t('zones.addReversePtrRecord')}
              checked={ptr}
              onChange={e => setPtr(e.currentTarget.checked)}
            />
            {ptr && (
              <Checkbox
                label={t('zones.createPtrZoneIfNotExists')}
                checked={createPtrZone}
                onChange={e => setCreatePtrZone(e.currentTarget.checked)}
              />
            )}
          </Stack>
        );
      case 'NS':
        return (
          <Stack gap="sm">
            <TextInput
              label={t('zones.nameServer')}
              placeholder="ns1.example.com"
              value={nameServer}
              onChange={e => setNameServer(e.target.value)}
              required
            />
            <TextInput
              label={t('zones.glueAddresses')}
              placeholder={t('zones.glueAddressesPlaceholder')}
              value={glue}
              onChange={e => setGlue(e.target.value)}
            />
          </Stack>
        );
      case 'SOA':
        return (
          <Stack gap="sm">
            <TextInput
              label={t('zones.primaryNameServer')}
              placeholder="ns1.example.com"
              value={soaPrimaryNameServer}
              onChange={e => setSoaPrimaryNameServer(e.target.value)}
              required
            />
            <TextInput
              label={t('zones.responsiblePerson')}
              placeholder="admin@example.com"
              value={soaResponsiblePerson}
              onChange={e => setSoaResponsiblePerson(e.target.value)}
              required
            />
            <Group grow>
              <TextInput
                label={t('zones.serial')}
                value={soaSerial}
                onChange={e => setSoaSerial(e.target.value)}
                disabled={soaUseSerialDateScheme}
              />
              <Checkbox
                label={t('zones.soaSerialDateScheme')}
                checked={soaUseSerialDateScheme}
                onChange={e => setSoaUseSerialDateScheme(e.currentTarget.checked)}
                mt={30}
              />
            </Group>
            <Group grow>
              <TextInput
                label={t('zones.refreshSec')}
                value={soaRefresh}
                onChange={e => setSoaRefresh(e.target.value)}
              />
              <TextInput
                label={t('zones.retrySec')}
                value={soaRetry}
                onChange={e => setSoaRetry(e.target.value)}
              />
            </Group>
            <Group grow>
              <TextInput
                label={t('zones.expireSec')}
                value={soaExpire}
                onChange={e => setSoaExpire(e.target.value)}
              />
              <TextInput
                label={t('zones.minimumTtlSec')}
                value={soaMinimum}
                onChange={e => setSoaMinimum(e.target.value)}
              />
            </Group>
          </Stack>
        );
      case 'CNAME':
        return (
          <TextInput
            label="CNAME"
            placeholder="target.example.com"
            value={cname}
            onChange={e => setCname(e.target.value)}
            required
          />
        );
      case 'MX':
        return (
          <Stack gap="sm">
            <NumberInput
              label={t('zones.preference')}
              value={preference}
              onChange={v => setPreference(Number(v))}
              min={0}
            />
            <TextInput
              label={t('zones.exchange')}
              placeholder="mail.example.com"
              value={exchange}
              onChange={e => setExchange(e.target.value)}
              required
            />
          </Stack>
        );
      case 'TXT':
        return (
          <Stack gap="sm">
            <Textarea
              label={t('zones.text')}
              placeholder="v=spf1 ..."
              value={text}
              onChange={e => setText(e.target.value)}
              minRows={3}
              required
            />
            <Checkbox
              label={t('zones.splitLongText')}
              checked={splitText}
              onChange={e => setSplitText(e.currentTarget.checked)}
            />
          </Stack>
        );
      case 'PTR':
        return (
          <TextInput
            label={t('zones.ptrName')}
            placeholder="host.example.com"
            value={ptrName}
            onChange={e => setPtrName(e.target.value)}
            required
          />
        );
      case 'RP':
        return (
          <Stack gap="sm">
            <TextInput
              label={t('zones.mailbox')}
              placeholder="admin.example.com"
              value={mailbox}
              onChange={e => setMailbox(e.target.value)}
            />
            <TextInput
              label={t('zones.txtDomain')}
              placeholder="txt.example.com"
              value={txtDomain}
              onChange={e => setTxtDomain(e.target.value)}
            />
          </Stack>
        );
      case 'SRV':
        return (
          <Stack gap="sm">
            <NumberInput
              label={t('zones.priority')}
              value={priority}
              onChange={v => setPriority(Number(v))}
              min={0}
            />
            <NumberInput
              label={t('zones.weight')}
              value={weight}
              onChange={v => setWeight(Number(v))}
              min={0}
            />
            <NumberInput
              label={t('zones.port')}
              value={port}
              onChange={v => setPort(Number(v))}
              min={0}
              max={65535}
            />
            <TextInput
              label={t('zones.target')}
              placeholder="server.example.com"
              value={target}
              onChange={e => setTarget(e.target.value)}
              required
            />
          </Stack>
        );
      case 'NAPTR':
        return (
          <Stack gap="sm">
            <Group grow>
              <NumberInput
                label={t('zones.order')}
                value={naptrOrder}
                onChange={v => setNaptrOrder(Number(v))}
                min={0}
              />
              <NumberInput
                label={t('zones.preference')}
                value={naptrPreference}
                onChange={v => setNaptrPreference(Number(v))}
                min={0}
              />
            </Group>
            <Group grow>
              <TextInput
                label={t('zones.flags')}
                value={naptrFlags}
                onChange={e => setNaptrFlags(e.target.value)}
              />
              <TextInput
                label={t('zones.services')}
                value={naptrServices}
                onChange={e => setNaptrServices(e.target.value)}
              />
            </Group>
            <Group grow>
              <TextInput
                label={t('zones.regexp')}
                value={naptrRegexp}
                onChange={e => setNaptrRegexp(e.target.value)}
              />
              <TextInput
                label={t('zones.replacement')}
                value={naptrReplacement}
                onChange={e => setNaptrReplacement(e.target.value)}
              />
            </Group>
          </Stack>
        );
      case 'DNAME':
        return (
          <TextInput
            label="DNAME"
            placeholder="target.example.com"
            value={dname}
            onChange={e => setDname(e.target.value)}
            required
          />
        );
      case 'DS':
        return (
          <Stack gap="sm">
            <TextInput
              label={t('zones.keyTag')}
              value={keyTag}
              onChange={e => setKeyTag(e.target.value)}
              required
            />
            <Select
              label={t('zones.dnssecAlgorithm')}
              data={DNSSEC_ALGORITHMS.map(a => ({ value: a, label: a }))}
              value={algorithm}
              onChange={v => setAlgorithm(v || '')}
              allowDeselect={false}
              required
            />
            <Select
              label={t('zones.digestType')}
              data={DIGEST_TYPES.map(d => ({ value: d, label: d }))}
              value={digestType}
              onChange={v => setDigestType(v || '')}
              allowDeselect={false}
              required
            />
            <TextInput
              label={t('zones.digest')}
              placeholder={t('zones.hashStringPlaceholder')}
              value={digest}
              onChange={e => setDigest(e.target.value)}
              required
            />
          </Stack>
        );
      case 'SSHFP':
        return (
          <Stack gap="sm">
            <Select
              label={t('zones.algorithm')}
              data={SSHFP_ALGORITHMS}
              value={sshfpAlgorithm}
              onChange={v => setSshfpAlgorithm(v || '')}
              allowDeselect={false}
              required
            />
            <Select
              label={t('zones.fingerprintType')}
              data={SSHFP_FINGERPRINT_TYPES}
              value={sshfpFingerprintType}
              onChange={v => setSshfpFingerprintType(v || '')}
              allowDeselect={false}
              required
            />
            <TextInput
              label={t('zones.fingerprint')}
              placeholder={t('zones.hashStringPlaceholder')}
              value={sshfpFingerprint}
              onChange={e => setSshfpFingerprint(e.target.value)}
              required
            />
          </Stack>
        );
      case 'TLSA':
        return (
          <Stack gap="sm">
            <Select
              label={t('zones.certificateUsage')}
              data={TLSA_CERTIFICATE_USAGES}
              value={tlsaCertificateUsage}
              onChange={v => setTlsaCertificateUsage(v || '')}
              allowDeselect={false}
              required
            />
            <Select
              label={t('zones.selector')}
              data={TLSA_SELECTORS}
              value={tlsaSelector}
              onChange={v => setTlsaSelector(v || '')}
              allowDeselect={false}
              required
            />
            <Select
              label={t('zones.matchingType')}
              data={TLSA_MATCHING_TYPES}
              value={tlsaMatchingType}
              onChange={v => setTlsaMatchingType(v || '')}
              allowDeselect={false}
              required
            />
            <Textarea
              label={t('zones.certificateAssociationData')}
              placeholder={t('zones.certAssociationDataPlaceholder')}
              value={tlsaCertificateAssociationData}
              onChange={e => setTlsaCertificateAssociationData(e.target.value)}
              minRows={4}
              required
            />
          </Stack>
        );
      case 'SVCB':
      case 'HTTPS':
        return (
          <Stack gap="sm">
            <NumberInput
              label={t('zones.priority')}
              description={t('zones.aliasModeDescription')}
              value={svcPriority}
              onChange={v => setSvcPriority(Number(v))}
              min={0}
            />
            <TextInput
              label={t('zones.targetName')}
              placeholder="target.example.com"
              value={svcTargetName}
              onChange={e => setSvcTargetName(e.target.value)}
              required
            />
            <Group justify="space-between">
              <Text fw={500} size="sm">
                {t('zones.svcParams')}
              </Text>
              <Button size="xs" variant="default" onClick={addSvcbParamRow}>
                {t('common.add')}
              </Button>
            </Group>
            {svcParams.map((param, i) => (
              <Group key={i} grow>
                <TextInput
                  size="xs"
                  placeholder={t('zones.svcbKeyPlaceholder')}
                  value={param.key}
                  onChange={e =>
                    setSvcParams(prev =>
                      prev.map((p, j) => (j === i ? { ...p, key: e.target.value } : p))
                    )
                  }
                />
                <TextInput
                  size="xs"
                  placeholder={t('common.value')}
                  value={param.value}
                  onChange={e =>
                    setSvcParams(prev =>
                      prev.map((p, j) => (j === i ? { ...p, value: e.target.value } : p))
                    )
                  }
                />
                <Button
                  size="xs"
                  color="red"
                  variant="subtle"
                  onClick={() => setSvcParams(prev => prev.filter((_, j) => j !== i))}
                >
                  X
                </Button>
              </Group>
            ))}
            <Group>
              <Checkbox
                label={t('zones.autoIpv4Hint')}
                checked={autoIpv4Hint}
                onChange={e => setAutoIpv4Hint(e.currentTarget.checked)}
              />
              <Checkbox
                label={t('zones.autoIpv6Hint')}
                checked={autoIpv6Hint}
                onChange={e => setAutoIpv6Hint(e.currentTarget.checked)}
              />
            </Group>
          </Stack>
        );
      case 'URI':
        return (
          <Stack gap="sm">
            <Group grow>
              <NumberInput
                label={t('zones.priority')}
                value={uriPriority}
                onChange={v => setUriPriority(Number(v))}
                min={0}
              />
              <NumberInput
                label={t('zones.weight')}
                value={uriWeight}
                onChange={v => setUriWeight(Number(v))}
                min={0}
              />
            </Group>
            <TextInput
              label={t('zones.uri')}
              placeholder="https://example.com"
              value={uri}
              onChange={e => setUri(e.target.value)}
              required
            />
          </Stack>
        );
      case 'CAA':
        return (
          <Stack gap="sm">
            <NumberInput
              label={t('zones.flags')}
              value={flags}
              onChange={v => setFlags(Number(v))}
              min={0}
            />
            <TextInput
              label={t('zones.tag')}
              placeholder={t('zones.caaTagPlaceholder')}
              value={tag}
              onChange={e => setTag(e.target.value)}
              required
            />
            <TextInput
              label={t('common.value')}
              placeholder="example.com"
              value={value}
              onChange={e => setValue(e.target.value)}
              required
            />
          </Stack>
        );
      case 'ANAME':
        return (
          <TextInput
            label="ANAME"
            placeholder="target.example.com"
            value={aname}
            onChange={e => setAname(e.target.value)}
            required
          />
        );
      case 'FWD':
        return (
          <Stack gap="sm">
            <Select
              label={t('zones.protocol')}
              data={['Udp', 'Tcp', 'Tls', 'Https', 'Quic'].map(p => ({ value: p, label: p }))}
              value={forwarderProtocol}
              onChange={v => setForwarderProtocol(v || 'Udp')}
              allowDeselect={false}
            />
            <TextInput
              label={t('zones.forwarder')}
              placeholder="8.8.8.8 or [2620:fe::10]"
              value={forwarder}
              onChange={e => setForwarder(e.target.value)}
              required
            />
            <TextInput
              label={t('zones.forwarderPriority')}
              placeholder={t('common.optional')}
              value={forwarderPriority}
              onChange={e => setForwarderPriority(e.target.value)}
            />
            <Checkbox
              label={t('zones.enableDnssecValidation')}
              checked={forwarderDnssecValidation}
              onChange={e => setForwarderDnssecValidation(e.currentTarget.checked)}
            />
            <Select
              label={t('zones.forwarderProxyType')}
              data={[
                { value: 'NoProxy', label: t('zones.noProxy') },
                { value: 'DefaultProxy', label: t('zones.proxyTypeDefault') },
                { value: 'Http', label: t('zones.httpProxy') },
                { value: 'Socks5', label: t('zones.socks5Proxy') },
              ]}
              value={forwarderProxyType}
              onChange={v => setForwarderProxyType(v || 'DefaultProxy')}
              allowDeselect={false}
            />
            {(forwarderProxyType === 'Http' || forwarderProxyType === 'Socks5') && (
              <>
                <TextInput
                  label={t('zones.recordProxyAddress')}
                  value={forwarderProxyAddress}
                  onChange={e => setForwarderProxyAddress(e.target.value)}
                  required
                />
                <TextInput
                  label={t('zones.recordProxyPort')}
                  value={forwarderProxyPort}
                  onChange={e => setForwarderProxyPort(e.target.value)}
                  required
                />
                <TextInput
                  label={t('zones.recordProxyUsername')}
                  value={forwarderProxyUsername}
                  onChange={e => setForwarderProxyUsername(e.target.value)}
                />
                <TextInput
                  label={t('zones.recordProxyPassword')}
                  type="password"
                  value={forwarderProxyPassword}
                  onChange={e => setForwarderProxyPassword(e.target.value)}
                />
              </>
            )}
          </Stack>
        );
      case 'APP':
        return (
          <Stack gap="sm">
            <TextInput
              label={t('common.appName')}
              value={appName}
              onChange={e => setAppName(e.target.value)}
              required
            />
            <TextInput
              label={t('common.classPath')}
              value={appClassPath}
              onChange={e => setAppClassPath(e.target.value)}
              required
            />
            <Textarea
              label={t('zones.recordDataLabel')}
              value={recordData}
              onChange={e => setRecordData(e.target.value)}
              minRows={4}
            />
          </Stack>
        );
      default:
        return null;
    }
  };

  const resetFields = () => {
    setIpAddress('');
    setPtr(false);
    setCreatePtrZone(false);
    setNameServer('');
    setGlue('');
    setSoaPrimaryNameServer('');
    setSoaResponsiblePerson('');
    setSoaSerial('');
    setSoaRefresh('');
    setSoaRetry('');
    setSoaExpire('');
    setSoaMinimum('');
    setSoaUseSerialDateScheme(false);
    setCname('');
    setDname('');
    setAname('');
    setPreference(1);
    setExchange('');
    setText('');
    setSplitText(false);
    setPtrName('');
    setMailbox('');
    setTxtDomain('');
    setPriority(0);
    setWeight(0);
    setPort(80);
    setTarget('');
    setNaptrOrder(0);
    setNaptrPreference(0);
    setNaptrFlags('');
    setNaptrServices('');
    setNaptrRegexp('');
    setNaptrReplacement('');
    setKeyTag('');
    setAlgorithm('');
    setDigestType('');
    setDigest('');
    setSshfpAlgorithm('');
    setSshfpFingerprintType('');
    setSshfpFingerprint('');
    setTlsaCertificateUsage('');
    setTlsaSelector('');
    setTlsaMatchingType('');
    setTlsaCertificateAssociationData('');
    setSvcPriority(0);
    setSvcTargetName('');
    setSvcParams([]);
    setAutoIpv4Hint(false);
    setAutoIpv6Hint(false);
    setUriPriority(0);
    setUriWeight(0);
    setUri('');
    setFlags(0);
    setTag('issue');
    setValue('');
    setForwarder('');
    setForwarderProtocol('Udp');
    setForwarderPriority('');
    setForwarderDnssecValidation(false);
    setForwarderProxyType('DefaultProxy');
    setForwarderProxyAddress('');
    setForwarderProxyPort('');
    setForwarderProxyUsername('');
    setForwarderProxyPassword('');
    setAppName('');
    setAppClassPath('');
    setRecordData('');
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        isEdit ? t('zones.editRecordTitle', { type: editRecord?.type }) : t('zones.addRecordTitle')
      }
      size="lg"
    >
      <Stack gap="md">
        <Select
          label={t('zones.recordTypeLabel')}
          data={allowedTypes.map(t => ({ value: t, label: t }))}
          value={recordType}
          onChange={v => {
            if (v) {
              resetFields();
              setRecordType(v);
            }
          }}
          disabled={isEdit}
        />

        <TextInput
          label={t('zones.domainName')}
          placeholder={zone}
          value={domain}
          onChange={e => setDomain(e.target.value)}
          description={t('zones.leaveEmptyForZoneRoot', { zone })}
        />

        <Group grow>
          <TextInput
            label={t('zones.recordTTL')}
            placeholder={t('zones.auto')}
            value={ttl}
            onChange={e => setTtl(e.target.value)}
            description={t('zones.ttlDescription')}
            disabled={recordType === 'FWD'}
          />
          <TextInput
            label={t('zones.expiryTtl')}
            placeholder={t('common.optional')}
            value={expiryTtl}
            onChange={e => setExpiryTtl(e.target.value)}
            description={t('zones.expiryTtlDescription')}
          />
        </Group>

        {renderTypeFields()}

        {!isEdit && (
          <Checkbox
            label={t('zones.overwriteExistingRecord')}
            checked={overwrite}
            onChange={e => setOverwrite(e.currentTarget.checked)}
          />
        )}

        <TextInput
          label={t('zones.comments')}
          placeholder={t('common.optional')}
          value={comments}
          onChange={e => setComments(e.target.value)}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? t('common.save') : t('common.add')}</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function getRecordTypes(zoneType: string, dnssecStatus: string | null): string[] {
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
