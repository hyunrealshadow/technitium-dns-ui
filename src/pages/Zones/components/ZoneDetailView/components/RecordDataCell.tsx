import { Box, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../../../utils/dateTime';
import type { ZoneRecord } from '../../../types';

interface DisplayField {
  key: string;
  value: string;
}

const SIMPLE_FIELDS: Record<string, string> = {
  A: 'ipAddress',
  AAAA: 'ipAddress',
  CNAME: 'cname',
  PTR: 'ptrName',
  DNAME: 'dname',
  ANAME: 'aname',
};

const FIELD_ORDER: Record<string, string[]> = {
  NS: ['nameServer', 'glueRecords'],
  SOA: [
    'primaryNameServer',
    'responsiblePerson',
    'serial',
    'refresh',
    'retry',
    'expire',
    'minimum',
    'useSerialDateScheme',
  ],
  MX: ['preference', 'exchange'],
  RP: ['mailbox', 'txtDomain'],
  SRV: ['priority', 'weight', 'port', 'target'],
  NAPTR: ['order', 'preference', 'flags', 'services', 'regexp', 'replacement'],
  DS: ['keyTag', 'algorithm', 'digestType', 'digest'],
  SSHFP: ['algorithm', 'fingerprintType', 'fingerprint'],
  RRSIG: [
    'typeCovered',
    'algorithm',
    'labels',
    'originalTtl',
    'signatureExpiration',
    'signatureInception',
    'keyTag',
    'signersName',
    'signature',
  ],
  NSEC: ['nextDomainName', 'types'],
  DNSKEY: [
    'flags',
    'protocol',
    'algorithm',
    'publicKey',
    'dnsKeyState',
    'dnsKeyStateReadyBy',
    'dnsKeyStateActiveBy',
    'computedKeyTag',
    'computedDigests',
  ],
  NSEC3: ['hashAlgorithm', 'flags', 'iterations', 'salt', 'nextHashedOwnerName', 'types'],
  NSEC3PARAM: ['hashAlgorithm', 'flags', 'iterations', 'salt'],
  TLSA: ['certificateUsage', 'selector', 'matchingType', 'certificateAssociationData'],
  ZONEMD: ['serial', 'scheme', 'hashAlgorithm', 'digest'],
  SVCB: ['svcPriority', 'svcTargetName', 'svcParams', 'autoIpv4Hint', 'autoIpv6Hint'],
  HTTPS: ['svcPriority', 'svcTargetName', 'svcParams', 'autoIpv4Hint', 'autoIpv6Hint'],
  URI: ['priority', 'weight', 'uri'],
  CAA: ['flags', 'tag', 'value'],
  FWD: [
    'protocol',
    'forwarder',
    'priority',
    'dnssecValidation',
    'proxyType',
    'proxyAddress',
    'proxyPort',
    'proxyUsername',
    'proxyPassword',
  ],
  APP: ['appName', 'classPath', 'data'],
  ALIAS: ['type', 'alias'],
};

const LABEL_KEYS: Record<string, string> = {
  glueRecords: 'glue',
  fingerprintType: 'sshfpFingerprintType',
  fingerprint: 'sshfpFingerprint',
  certificateUsage: 'tlsaCertificateUsage',
  selector: 'tlsaSelector',
  matchingType: 'tlsaMatchingType',
  certificateAssociationData: 'tlsaCertificateAssociationData',
};

const prettifyFieldKey = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, value => value.toUpperCase());

function formatFieldValue(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (key === 'proxyPassword' && value) return '••••••••';

  if (['refresh', 'retry', 'expire', 'minimum'].includes(key) && data[`${key}String`]) {
    return `${String(value)} (${String(data[`${key}String`])})`;
  }

  if (key === 'algorithm' && data.algorithmNumber != null) {
    return `${String(value)} (${String(data.algorithmNumber)})`;
  }

  if (key === 'digestType' && data.digestTypeNumber != null) {
    return `${String(value)} (${String(data.digestTypeNumber)})`;
  }

  if (key === 'signatureExpiration' || key === 'signatureInception') {
    return formatDateTime(value);
  }

  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
      .join(', ');
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([entryKey, entryValue]) => `${entryKey}=${String(entryValue ?? '')}`)
      .join('\n');
  }

  return String(value ?? '');
}

function getDisplayFields(record: ZoneRecord): DisplayField[] {
  const data = record.rData;

  if (record.type === 'NS') {
    const fields: DisplayField[] = [];
    if (data.nameServer != null) {
      fields.push({ key: 'nameServer', value: formatFieldValue(data, 'nameServer') });
    }
    if (record.glueRecords?.length) {
      fields.push({ key: 'glueRecords', value: record.glueRecords.join(', ') });
    }
    return fields;
  }

  if (record.type === 'TXT') {
    const characterStrings = data.characterStrings;
    if (Array.isArray(characterStrings) && characterStrings.length > 0) {
      return [
        { key: 'text', value: characterStrings.map(value => `"${String(value)}"`).join('\n') },
      ];
    }
    return [{ key: 'text', value: String(data.text ?? '') }];
  }

  const simpleKey = SIMPLE_FIELDS[record.type];
  if (simpleKey) return [{ key: '', value: formatFieldValue(data, simpleKey) }];

  const orderedKeys = FIELD_ORDER[record.type];
  if (orderedKeys) {
    return orderedKeys
      .filter(key => data[key] !== undefined && data[key] !== null && data[key] !== '')
      .map(key => ({ key, value: formatFieldValue(data, key) }));
  }

  if (data.value !== undefined) {
    return [{ key: 'rdata', value: formatFieldValue(data, 'value') }];
  }

  return Object.keys(data)
    .filter(key => !key.endsWith('String') && !key.endsWith('Base64'))
    .map(key => ({ key, value: formatFieldValue(data, key) }));
}

function formatRecordDate(value: string | undefined): string {
  return formatDateTime(value, '—');
}

export function RecordDataCell({ record }: { record: ZoneRecord }) {
  const { t } = useTranslation();
  const fields = getDisplayFields(record);
  const expiresOn =
    record.expiryTtl && record.lastModified
      ? new Date(new Date(record.lastModified).getTime() + record.expiryTtl * 1000)
      : null;

  const label = (key: string) => {
    if (key === 'rdata') return t('zones.recordDataLabel');
    if (key === 'text') return t('zones.text');
    if (key === 'dnssecValidation') return t('zones.forwarderDnssecValidation');
    if (key === 'proxyType') return t('settings.proxyType');
    if (key === 'proxyAddress') return t('zones.recordProxyAddress');
    if (key === 'proxyPort') return t('zones.recordProxyPort');
    if (key === 'proxyUsername') return t('zones.recordProxyUsername');
    if (key === 'proxyPassword') return t('zones.recordProxyPassword');

    return t(`zoneTree.fieldLabels.${LABEL_KEYS[key] ?? key}`, {
      defaultValue: prettifyFieldKey(key),
    });
  };

  return (
    <Stack gap={3} py={2} style={{ minWidth: 0 }}>
      {fields.map(field => (
        <Text
          key={field.key || field.value}
          size="sm"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {field.key && (
            <Text span c="dimmed">
              {label(field.key)}:{' '}
            </Text>
          )}
          {field.value || '—'}
        </Text>
      ))}

      {(record.expiryTtl != null || record.lastUsedOn || record.lastModified) && (
        <Stack gap={2} mt={6}>
          {record.expiryTtl != null && record.expiryTtl > 0 && (
            <Text size="xs" c="dimmed">
              <Text span inherit>
                {t('zones.expiryTtl')}:{' '}
              </Text>
              {record.expiryTtl} ({record.expiryTtlString || `${record.expiryTtl}s`})
            </Text>
          )}
          {expiresOn && (
            <Text size="xs" c="dimmed">
              <Text span inherit>
                {t('zoneTree.fieldLabels.expiresOn')}:{' '}
              </Text>
              {formatDateTime(expiresOn)}
            </Text>
          )}
          {record.lastUsedOn && (
            <Text size="xs" c="dimmed">
              <Text span inherit>
                {t('zoneTree.fieldLabels.lastUsedOn')}:{' '}
              </Text>
              {formatRecordDate(record.lastUsedOn)}
            </Text>
          )}
          {record.lastModified && (
            <Text size="xs" c="dimmed">
              <Text span inherit>
                {t('zoneTree.fieldLabels.lastModified')}:{' '}
              </Text>
              {formatRecordDate(record.lastModified)}
            </Text>
          )}
        </Stack>
      )}

      {record.comments && (
        <Box
          mt={5}
          px="sm"
          py={6}
          style={{
            backgroundColor: 'var(--mantine-color-default-hover)',
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        >
          <Text size="xs" c="dimmed" mb={2}>
            {t('zones.comments')}
          </Text>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {record.comments}
          </Text>
        </Box>
      )}
    </Stack>
  );
}
