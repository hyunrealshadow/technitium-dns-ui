import {
  Button,
  Checkbox,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import type { TFunction } from 'i18next';
import type { RecordFormState } from './utils';
import {
  DNSSEC_ALGORITHMS,
  DIGEST_TYPES,
  FWD_PROTOCOLS,
  FWD_PROXY_TYPES,
  SSHFP_ALGORITHMS,
  SSHFP_FINGERPRINT_TYPES,
  TLSA_CERTIFICATE_USAGES,
  TLSA_MATCHING_TYPES,
  TLSA_SELECTORS,
} from './constants';

// 按记录类型渲染对应表单字段（22 种类型的字段区）
export function RecordTypeFields({
  recordType,
  s,
  set,
  t,
}: {
  recordType: string;
  s: RecordFormState;
  set: (patch: Partial<RecordFormState>) => void;
  t: TFunction;
}) {
  const updateSvcParam = (index: number, field: 'key' | 'value', value: string) =>
    set({ svcParams: s.svcParams.map((p, j) => (j === index ? { ...p, [field]: value } : p)) });
  const removeSvcParam = (index: number) =>
    set({ svcParams: s.svcParams.filter((_, j) => j !== index) });

  switch (recordType) {
    case 'A':
    case 'AAAA':
      return (
        <Stack gap="sm">
          <TextInput
            label={recordType === 'A' ? t('zones.ipv4Address') : t('zones.ipv6Address')}
            placeholder={recordType === 'A' ? '1.2.3.4' : '2001:db8::'}
            value={s.ipAddress}
            onChange={e => set({ ipAddress: e.target.value })}
            required
          />
          <Checkbox
            label={t('zones.addReversePtrRecord')}
            checked={s.ptr}
            onChange={e => set({ ptr: e.currentTarget.checked })}
          />
          {s.ptr && (
            <Checkbox
              label={t('zones.createPtrZoneIfNotExists')}
              checked={s.createPtrZone}
              onChange={e => set({ createPtrZone: e.currentTarget.checked })}
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
            value={s.nameServer}
            onChange={e => set({ nameServer: e.target.value })}
            required
          />
          <TextInput
            label={t('zones.glueAddresses')}
            placeholder={t('zones.glueAddressesPlaceholder')}
            value={s.glue}
            onChange={e => set({ glue: e.target.value })}
          />
        </Stack>
      );
    case 'SOA':
      return (
        <Stack gap="sm">
          <TextInput
            label={t('zones.primaryNameServer')}
            placeholder="ns1.example.com"
            value={s.soaPrimaryNameServer}
            onChange={e => set({ soaPrimaryNameServer: e.target.value })}
            required
          />
          <TextInput
            label={t('zones.responsiblePerson')}
            placeholder="admin@example.com"
            value={s.soaResponsiblePerson}
            onChange={e => set({ soaResponsiblePerson: e.target.value })}
            required
          />
          <Group grow>
            <TextInput
              label={t('zones.serial')}
              value={s.soaSerial}
              onChange={e => set({ soaSerial: e.target.value })}
              disabled={s.soaUseSerialDateScheme}
            />
            <Checkbox
              label={t('zones.soaSerialDateScheme')}
              checked={s.soaUseSerialDateScheme}
              onChange={e => set({ soaUseSerialDateScheme: e.currentTarget.checked })}
              mt={30}
            />
          </Group>
          <Group grow>
            <TextInput
              label={t('zones.refreshSec')}
              value={s.soaRefresh}
              onChange={e => set({ soaRefresh: e.target.value })}
            />
            <TextInput
              label={t('zones.retrySec')}
              value={s.soaRetry}
              onChange={e => set({ soaRetry: e.target.value })}
            />
          </Group>
          <Group grow>
            <TextInput
              label={t('zones.expireSec')}
              value={s.soaExpire}
              onChange={e => set({ soaExpire: e.target.value })}
            />
            <TextInput
              label={t('zones.minimumTtlSec')}
              value={s.soaMinimum}
              onChange={e => set({ soaMinimum: e.target.value })}
            />
          </Group>
        </Stack>
      );
    case 'CNAME':
      return (
        <TextInput
          label="CNAME"
          placeholder="target.example.com"
          value={s.cname}
          onChange={e => set({ cname: e.target.value })}
          required
        />
      );
    case 'MX':
      return (
        <Stack gap="sm">
          <NumberInput
            label={t('zones.preference')}
            value={s.preference}
            onChange={v => set({ preference: Number(v) })}
            min={0}
          />
          <TextInput
            label={t('zones.exchange')}
            placeholder="mail.example.com"
            value={s.exchange}
            onChange={e => set({ exchange: e.target.value })}
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
            value={s.text}
            onChange={e => set({ text: e.target.value })}
            minRows={3}
            required
          />
          <Checkbox
            label={t('zones.splitLongText')}
            checked={s.splitText}
            onChange={e => set({ splitText: e.currentTarget.checked })}
          />
        </Stack>
      );
    case 'PTR':
      return (
        <TextInput
          label={t('zones.ptrName')}
          placeholder="host.example.com"
          value={s.ptrName}
          onChange={e => set({ ptrName: e.target.value })}
          required
        />
      );
    case 'RP':
      return (
        <Stack gap="sm">
          <TextInput
            label={t('zones.mailbox')}
            placeholder="admin.example.com"
            value={s.mailbox}
            onChange={e => set({ mailbox: e.target.value })}
          />
          <TextInput
            label={t('zones.txtDomain')}
            placeholder="txt.example.com"
            value={s.txtDomain}
            onChange={e => set({ txtDomain: e.target.value })}
          />
        </Stack>
      );
    case 'SRV':
      return (
        <Stack gap="sm">
          <NumberInput
            label={t('zones.priority')}
            value={s.priority}
            onChange={v => set({ priority: Number(v) })}
            min={0}
          />
          <NumberInput
            label={t('zones.weight')}
            value={s.weight}
            onChange={v => set({ weight: Number(v) })}
            min={0}
          />
          <NumberInput
            label={t('zones.port')}
            value={s.port}
            onChange={v => set({ port: Number(v) })}
            min={0}
            max={65535}
          />
          <TextInput
            label={t('zones.target')}
            placeholder="server.example.com"
            value={s.target}
            onChange={e => set({ target: e.target.value })}
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
              value={s.naptrOrder}
              onChange={v => set({ naptrOrder: Number(v) })}
              min={0}
            />
            <NumberInput
              label={t('zones.preference')}
              value={s.naptrPreference}
              onChange={v => set({ naptrPreference: Number(v) })}
              min={0}
            />
          </Group>
          <Group grow>
            <TextInput
              label={t('zones.flags')}
              value={s.naptrFlags}
              onChange={e => set({ naptrFlags: e.target.value })}
            />
            <TextInput
              label={t('zones.services')}
              value={s.naptrServices}
              onChange={e => set({ naptrServices: e.target.value })}
            />
          </Group>
          <Group grow>
            <TextInput
              label={t('zones.regexp')}
              value={s.naptrRegexp}
              onChange={e => set({ naptrRegexp: e.target.value })}
            />
            <TextInput
              label={t('zones.replacement')}
              value={s.naptrReplacement}
              onChange={e => set({ naptrReplacement: e.target.value })}
            />
          </Group>
        </Stack>
      );
    case 'DNAME':
      return (
        <TextInput
          label="DNAME"
          placeholder="target.example.com"
          value={s.dname}
          onChange={e => set({ dname: e.target.value })}
          required
        />
      );
    case 'DS':
      return (
        <Stack gap="sm">
          <TextInput
            label={t('zones.keyTag')}
            value={s.keyTag}
            onChange={e => set({ keyTag: e.target.value })}
            required
          />
          <Select
            label={t('zones.dnssecAlgorithm')}
            data={DNSSEC_ALGORITHMS.map(a => ({ value: a, label: a }))}
            value={s.algorithm}
            onChange={v => set({ algorithm: v || '' })}
            allowDeselect={false}
            required
          />
          <Select
            label={t('zones.digestType')}
            data={DIGEST_TYPES.map(d => ({ value: d, label: d }))}
            value={s.digestType}
            onChange={v => set({ digestType: v || '' })}
            allowDeselect={false}
            required
          />
          <TextInput
            label={t('zones.digest')}
            placeholder={t('zones.hashStringPlaceholder')}
            value={s.digest}
            onChange={e => set({ digest: e.target.value })}
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
            value={s.sshfpAlgorithm}
            onChange={v => set({ sshfpAlgorithm: v || '' })}
            allowDeselect={false}
            required
          />
          <Select
            label={t('zones.fingerprintType')}
            data={SSHFP_FINGERPRINT_TYPES}
            value={s.sshfpFingerprintType}
            onChange={v => set({ sshfpFingerprintType: v || '' })}
            allowDeselect={false}
            required
          />
          <TextInput
            label={t('zones.fingerprint')}
            placeholder={t('zones.hashStringPlaceholder')}
            value={s.sshfpFingerprint}
            onChange={e => set({ sshfpFingerprint: e.target.value })}
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
            value={s.tlsaCertificateUsage}
            onChange={v => set({ tlsaCertificateUsage: v || '' })}
            allowDeselect={false}
            required
          />
          <Select
            label={t('zones.selector')}
            data={TLSA_SELECTORS}
            value={s.tlsaSelector}
            onChange={v => set({ tlsaSelector: v || '' })}
            allowDeselect={false}
            required
          />
          <Select
            label={t('zones.matchingType')}
            data={TLSA_MATCHING_TYPES}
            value={s.tlsaMatchingType}
            onChange={v => set({ tlsaMatchingType: v || '' })}
            allowDeselect={false}
            required
          />
          <Textarea
            label={t('zones.certificateAssociationData')}
            placeholder={t('zones.certAssociationDataPlaceholder')}
            value={s.tlsaCertificateAssociationData}
            onChange={e => set({ tlsaCertificateAssociationData: e.target.value })}
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
            value={s.svcPriority}
            onChange={v => set({ svcPriority: Number(v) })}
            min={0}
          />
          <TextInput
            label={t('zones.targetName')}
            placeholder="target.example.com"
            value={s.svcTargetName}
            onChange={e => set({ svcTargetName: e.target.value })}
            required
          />
          <Group justify="space-between">
            <Text fw={500} size="sm">
              {t('zones.svcParams')}
            </Text>
            <Button
              size="xs"
              variant="default"
              onClick={() => set({ svcParams: [...s.svcParams, { key: '', value: '' }] })}
            >
              {t('common.add')}
            </Button>
          </Group>
          {s.svcParams.map((param, i) => (
            <Group key={i} grow>
              <TextInput
                size="xs"
                placeholder={t('zones.svcbKeyPlaceholder')}
                value={param.key}
                onChange={e => updateSvcParam(i, 'key', e.target.value)}
              />
              <TextInput
                size="xs"
                placeholder={t('common.value')}
                value={param.value}
                onChange={e => updateSvcParam(i, 'value', e.target.value)}
              />
              <Button size="xs" color="red" variant="subtle" onClick={() => removeSvcParam(i)}>
                X
              </Button>
            </Group>
          ))}
          <Group>
            <Checkbox
              label={t('zones.autoIpv4Hint')}
              checked={s.autoIpv4Hint}
              onChange={e => set({ autoIpv4Hint: e.currentTarget.checked })}
            />
            <Checkbox
              label={t('zones.autoIpv6Hint')}
              checked={s.autoIpv6Hint}
              onChange={e => set({ autoIpv6Hint: e.currentTarget.checked })}
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
              value={s.uriPriority}
              onChange={v => set({ uriPriority: Number(v) })}
              min={0}
            />
            <NumberInput
              label={t('zones.weight')}
              value={s.uriWeight}
              onChange={v => set({ uriWeight: Number(v) })}
              min={0}
            />
          </Group>
          <TextInput
            label={t('zones.uri')}
            placeholder="https://example.com"
            value={s.uri}
            onChange={e => set({ uri: e.target.value })}
            required
          />
        </Stack>
      );
    case 'CAA':
      return (
        <Stack gap="sm">
          <NumberInput
            label={t('zones.flags')}
            value={s.flags}
            onChange={v => set({ flags: Number(v) })}
            min={0}
          />
          <TextInput
            label={t('zones.tag')}
            placeholder={t('zones.caaTagPlaceholder')}
            value={s.tag}
            onChange={e => set({ tag: e.target.value })}
            required
          />
          <TextInput
            label={t('common.value')}
            placeholder="example.com"
            value={s.value}
            onChange={e => set({ value: e.target.value })}
            required
          />
        </Stack>
      );
    case 'ANAME':
      return (
        <TextInput
          label="ANAME"
          placeholder="target.example.com"
          value={s.aname}
          onChange={e => set({ aname: e.target.value })}
          required
        />
      );
    case 'FWD':
      return (
        <Stack gap="sm">
          <Select
            label={t('zones.protocol')}
            data={FWD_PROTOCOLS.map(p => ({ value: p, label: p }))}
            value={s.forwarderProtocol}
            onChange={v => set({ forwarderProtocol: v || 'Udp' })}
            allowDeselect={false}
          />
          <TextInput
            label={t('zones.forwarder')}
            placeholder="8.8.8.8 or [2620:fe::10]"
            value={s.forwarder}
            onChange={e => set({ forwarder: e.target.value })}
            required
          />
          <TextInput
            label={t('zones.forwarderPriority')}
            placeholder={t('common.optional')}
            value={s.forwarderPriority}
            onChange={e => set({ forwarderPriority: e.target.value })}
          />
          <Checkbox
            label={t('zones.enableDnssecValidation')}
            checked={s.forwarderDnssecValidation}
            onChange={e => set({ forwarderDnssecValidation: e.currentTarget.checked })}
          />
          <Select
            label={t('zones.forwarderProxyType')}
            data={FWD_PROXY_TYPES.map(v => ({
              value: v,
              label:
                v === 'NoProxy'
                  ? t('zones.noProxy')
                  : v === 'DefaultProxy'
                    ? t('zones.proxyTypeDefault')
                    : v === 'Http'
                      ? t('zones.httpProxy')
                      : t('zones.socks5Proxy'),
            }))}
            value={s.forwarderProxyType}
            onChange={v => set({ forwarderProxyType: v || 'DefaultProxy' })}
            allowDeselect={false}
          />
          {(s.forwarderProxyType === 'Http' || s.forwarderProxyType === 'Socks5') && (
            <>
              <TextInput
                label={t('zones.recordProxyAddress')}
                value={s.forwarderProxyAddress}
                onChange={e => set({ forwarderProxyAddress: e.target.value })}
                required
              />
              <TextInput
                label={t('zones.recordProxyPort')}
                value={s.forwarderProxyPort}
                onChange={e => set({ forwarderProxyPort: e.target.value })}
                required
              />
              <TextInput
                label={t('zones.recordProxyUsername')}
                value={s.forwarderProxyUsername}
                onChange={e => set({ forwarderProxyUsername: e.target.value })}
              />
              <TextInput
                label={t('zones.recordProxyPassword')}
                type="password"
                value={s.forwarderProxyPassword}
                onChange={e => set({ forwarderProxyPassword: e.target.value })}
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
            value={s.appName}
            onChange={e => set({ appName: e.target.value })}
            required
          />
          <TextInput
            label={t('common.classPath')}
            value={s.appClassPath}
            onChange={e => set({ appClassPath: e.target.value })}
            required
          />
          <Textarea
            label={t('zones.recordDataLabel')}
            value={s.recordData}
            onChange={e => set({ recordData: e.target.value })}
            minRows={4}
          />
        </Stack>
      );
    default:
      return null;
  }
}
