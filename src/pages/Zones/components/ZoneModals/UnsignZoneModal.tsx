import { useState } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../../components/notifications';
import { apiClient } from '../../../../api/client';
export function UnsignZoneModal({
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
  const [saving, setSaving] = useState(false);

  const handleUnsign = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/unsign', { zone });
      success(t('common.success'), t('zones.zoneUnsignSuccess'));
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), t('zones.zoneUnsignFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`${t('zones.unsignZone')}: ${zone}`} size="sm">
      <Stack>
        <Text>{t('zones.unsignConfirm', { zone })}</Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button color="red" onClick={handleUnsign} loading={saving}>
            {t('zones.unsignZone')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
