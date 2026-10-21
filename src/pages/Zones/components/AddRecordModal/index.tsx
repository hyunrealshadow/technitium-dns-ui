import { useEffect, useState } from 'react';
import { Button, Checkbox, Group, Modal, Select, Stack, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../../components/notifications';
import { apiClient } from '../../../../api/client';
import type { ZoneRecord } from '../../types';
import type { App } from '../../../Apps/types';
import { getRecordTypes, buildParams, initialStateFrom, type RecordFormState } from './utils';
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

  const [s, setState] = useState<RecordFormState>(() => initialStateFrom(editRecord));
  const allowedTypes = isEdit ? [s.recordType] : getRecordTypes(zoneType, dnssecStatus);
  const [apps, setApps] = useState<App[]>([]);
  const [saving, setSaving] = useState(false);
  const [domain, setDomain] = useState(editRecord?.name || '');
  const [ttl, setTtl] = useState(str0(editRecord?.ttl));
  const [overwrite, setOverwrite] = useState(false);
  const [comments, setComments] = useState(editRecord?.comments || '');
  const [expiryTtl, setExpiryTtl] = useState(str0(editRecord?.expiryTtl));

  const set = (patch: Partial<RecordFormState>) => setState(prev => ({ ...prev, ...patch }));

  useEffect(() => {
    if (!opened || isEdit || s.recordType !== 'APP') return;
    let cancelled = false;
    apiClient
      .get<{ apps: App[] }>('/apps/list')
      .then(response => {
        if (!cancelled) setApps(response.response?.apps || []);
      })
      .catch(() => {
        if (!cancelled) error(t('common.error'), t('apps.loadFailed'));
      });
    return () => {
      cancelled = true;
    };
  }, [opened, isEdit, s.recordType, t]);

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
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
    } finally {
      setSaving(false);
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
      <form
        onSubmit={event => {
          event.preventDefault();
          void handleSubmit();
        }}
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
            disabled={s.recordType === 'SOA'}
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
              disabled={
                s.recordType === 'FWD' ||
                (s.recordType === 'SOA' && ['Forwarder', 'Catalog'].includes(zoneType))
              }
            />
            <TextInput
              label={t('zones.expiryTtl')}
              placeholder={t('common.optional')}
              value={expiryTtl}
              disabled={s.recordType === 'SOA'}
              onChange={e => setExpiryTtl(e.target.value)}
              description={t('zones.expiryTtlDescription')}
            />
          </Group>

          <RecordTypeFields
            recordType={s.recordType}
            s={s}
            set={set}
            t={t}
            apps={apps}
            isEdit={isEdit}
            zoneType={zoneType}
          />

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
            <Button type="submit" loading={saving}>
              {isEdit ? t('common.save') : t('common.add')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

function str0(v: unknown): string {
  return v == null ? '' : String(v);
}
