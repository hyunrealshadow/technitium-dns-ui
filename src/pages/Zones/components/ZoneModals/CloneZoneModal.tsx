import { useState } from 'react';
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../../components/notifications';
import { apiClient } from '../../../../api/client';
export function CloneZoneModal({
  zone,
  opened,
  onClose,
  onSuccess,
}: {
  zone: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [newZone, setNewZone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClone = async () => {
    if (!newZone.trim()) {
      error(t('common.error'), t('zones.newZoneNameRequired'));
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/zones/clone', { zone: newZone, sourceZone: zone });
      success(t('common.success'), t('zones.zoneImportSuccess'));
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), t('zones.cloneFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('zones.cloneZone')} size="md">
      <Stack>
        <TextInput label={t('zones.sourceZone')} value={zone} disabled />
        <TextInput
          label={t('zones.newZoneName')}
          placeholder={t('zones.newZoneNamePlaceholder')}
          value={newZone}
          onChange={e => setNewZone(e.target.value)}
          required
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleClone} loading={loading}>
            {t('zones.cloneZone')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
