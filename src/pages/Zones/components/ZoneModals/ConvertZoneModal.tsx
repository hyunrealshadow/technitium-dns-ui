import { useState } from 'react';
import { Button, Group, Modal, Radio, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../../components/notifications';
import { apiClient } from '../../../../api/client';
export function ConvertZoneModal({
  zone,
  zoneType,
  opened,
  onClose,
  onSuccess,
}: {
  zone: string;
  zoneType: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();

  const availableTypes = (() => {
    switch (zoneType) {
      case 'Primary':
        return ['Forwarder'];
      case 'Secondary':
      case 'SecondaryForwarder':
        return ['Primary', 'Forwarder'];
      case 'Forwarder':
        return ['Primary'];
      case 'SecondaryCatalog':
        return ['Catalog'];
      default:
        return [];
    }
  })();

  const [convertType, setConvertType] = useState(availableTypes[0] || '');
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!convertType) return;
    setLoading(true);
    try {
      await apiClient.post('/zones/convert', { zone, type: convertType });
      success(t('common.success'), t('zones.zoneConverted'));
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), t('zones.zoneConvertFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (availableTypes.length === 0) {
    return (
      <Modal opened={opened} onClose={onClose} title={t('zones.convertZone')} size="sm">
        <Text>{t('zones.convertNotSupported')}</Text>
        <Group justify="flex-end" mt="md">
          <Button onClick={onClose}>{t('common.close')}</Button>
        </Group>
      </Modal>
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('zones.convertZone')} size="sm">
      <Stack>
        <Text fw={500}>{t('zones.convertToType')}</Text>
        {availableTypes.map(type => (
          <Radio
            key={type}
            checked={convertType === type}
            onChange={() => setConvertType(type)}
            label={t(`zones.types.${type}`)}
          />
        ))}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConvert} loading={loading}>
            {t('zones.convertZone')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
