import { useState } from 'react';
import { Button, Checkbox, Group, Modal, Select, Stack, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../../components/notifications';
import { apiClient } from '../../../../api/client';
import type { ZoneRecord } from '../../types';
import { getRecordTypes, buildParams, type RecordFormState } from './utils';
import { RecordTypeFields } from './fields';

interface AddRecordModalProps {
  zone: string;
  zoneType: string;
  dnssecStatus: string | null;
  editRecord: ZoneRecord | null;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 从 rData 初始化表单状态（数字字段保留原始值）
function initialStateFrom(editRecord: ZoneRecord | null): RecordFormState {
  const r0 = editRecord?.rData || {};
  const str0 = (v: unknown) => (v == null ? '' : String(v));
  return {
    recordType: editRecord?.type || 'A',
    ipAddress: str0(r0.ipAddress),
    ptr: !!r0.ptr,
    createPtrZone: !!r0.createPtrZone,
    nameServer: str0(r0.nameServer),
    glue: str0(r0.glue),
    soaPrimaryNameServer: str0(r0.primaryNameServer),
    soaResponsiblePerson: str0(r0.responsiblePerson),
    soaSerial: str0(r0.serial),
    soaRefresh: str0(r0.refresh),
    soaRetry: str0(r0.retry),
    soaExpire: str0(r0.expire),
    soaMinimum: str0(r0.minimum),
    soaUseSerialDateScheme: false,
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
    naptrOrder: r0.naptrOrder == null ? 0 : Number(r0.naptrOrder),
    naptrPreference: r0.naptrPreference == null ? 0 : Number(r0.naptrPreference),
    naptrFlags: str0(r0.naptrFlags),
    naptrServices: str0(r0.naptrServices),
    naptrRegexp: str0(r0.naptrRegexp),
    naptrReplacement: str0(r0.naptrReplacement),
    keyTag: str0(r0.keyTag),
    algorithm: str0(r0.algorithm),
    digestType: str0(r0.digestType),
    digest: str0(r0.digest),
    sshfpAlgorithm: str0(r0.sshfpAlgorithm),
    sshfpFingerprintType: str0(r0.sshfpFingerprintType),
    sshfpFingerprint: str0(r0.sshfpFingerprint),
    tlsaCertificateUsage: str0(r0.tlsaCertificateUsage),
    tlsaSelector: str0(r0.tlsaSelector),
    tlsaMatchingType: str0(r0.tlsaMatchingType),
    tlsaCertificateAssociationData: str0(r0.tlsaCertificateAssociationData),
    svcPriority: r0.svcPriority == null ? 0 : Number(r0.svcPriority),
    svcTargetName: str0(r0.svcTargetName),
    svcParams: [],
    autoIpv4Hint: false,
    autoIpv6Hint: false,
    uriPriority: r0.uriPriority == null ? 0 : Number(r0.uriPriority),
    uriWeight: r0.uriWeight == null ? 0 : Number(r0.uriWeight),
    uri: str0(r0.uri),
    flags: r0.flags == null ? 0 : Number(r0.flags),
    tag: str0(r0.tag) || 'issue',
    value: str0(r0.value),
    forwarder: str0(r0.forwarder),
    forwarderProtocol: str0(r0.protocol) || 'Udp',
    forwarderPriority: '',
    forwarderDnssecValidation: false,
    forwarderProxyType: 'DefaultProxy',
    forwarderProxyAddress: '',
    forwarderProxyPort: '',
    forwarderProxyUsername: '',
    forwarderProxyPassword: '',
    appName: str0(r0.appName),
    appClassPath: str0(r0.classPath),
    recordData: str0(r0.recordData),
  };
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

  const [s, setState] = useState<RecordFormState>(() => initialStateFrom(editRecord));
  const [domain, setDomain] = useState(editRecord?.name || '');
  const [ttl, setTtl] = useState(str0(editRecord?.rData?.ttl));
  const [overwrite, setOverwrite] = useState(false);
  const [comments, setComments] = useState(editRecord?.comments || '');
  const [expiryTtl, setExpiryTtl] = useState('');

  const set = (patch: Partial<RecordFormState>) => setState(prev => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    try {
      const endpoint = isEdit ? '/zones/records/update' : '/zones/records/add';
      await apiClient.post(
        endpoint,
        buildParams(s, editRecord, zone, domain, ttl, overwrite, comments, expiryTtl)
      );
      success(t('common.success'), isEdit ? t('zones.recordUpdated') : t('zones.recordAdded'));
      onSuccess();
    } catch {
      error(t('common.error'), isEdit ? t('zones.recordUpdateFailed') : t('zones.recordAddFailed'));
    }
  };

  const resetFields = () => setState(initialStateFrom(null));

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
          value={s.recordType}
          onChange={v => {
            if (v) {
              resetFields();
              set({ recordType: v });
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
            disabled={s.recordType === 'FWD'}
          />
          <TextInput
            label={t('zones.expiryTtl')}
            placeholder={t('common.optional')}
            value={expiryTtl}
            onChange={e => setExpiryTtl(e.target.value)}
            description={t('zones.expiryTtlDescription')}
          />
        </Group>

        <RecordTypeFields recordType={s.recordType} s={s} set={set} t={t} />

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

function str0(v: unknown): string {
  return v == null ? '' : String(v);
}
