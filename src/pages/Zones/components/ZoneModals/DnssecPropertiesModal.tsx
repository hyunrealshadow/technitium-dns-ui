import { useEffect, useState } from 'react';
import {
  Button,
  Code,
  Group,
  Modal,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../../components/notifications';
import { apiClient } from '../../../../api/client';
import { useConfirmDialog } from '../../../../components/ConfirmDialog.context';
export function DnssecPropertiesModal({
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
  const confirmDialog = useConfirmDialog();
  const [zoneProps, setZoneProps] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [dnsKeyTtl, setDnsKeyTtl] = useState('3600');
  const [nsec3Iterations, setNsec3Iterations] = useState(0);
  const [nsec3SaltLength, setNsec3SaltLength] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setLoading(true);
    const load = async () => {
      try {
        const response = await fetch(
          `/api/zones/dnssec/properties/get?zone=${encodeURIComponent(zone)}`,
          { headers: { Authorization: `Bearer ${apiClient.getToken() || ''}` } }
        );
        const data = await response.json();
        if (data.status === 'ok' && data.response) {
          setZoneProps(data.response);
          setDnsKeyTtl(String(data.response.dnsKeyTtl || 3600));
          setNsec3Iterations(data.response.nsec3Iterations || 0);
          setNsec3SaltLength(data.response.nsec3SaltLength || 0);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    };
    load();
  }, [opened, zone]);

  const dnssecStatusStr = zoneProps?.dnssecStatus as string | undefined;
  const privateKeys = (zoneProps?.dnssecPrivateKeys as Array<Record<string, unknown>>) || [];
  const isNsec3 = dnssecStatusStr === 'SignedWithNSEC3';

  const handleUpdateDnsKeyTtl = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/updateDnsKeyTtl', {
        zone,
        dnsKeyTtl: Number(dnsKeyTtl),
      });
      success(t('common.success'), t('zones.dnskeyTtlUpdated'));
      await onSuccess();
    } catch {
      error(t('common.error'), t('zones.dnskeyTtlUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleConvertNsec3 = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/convertToNSEC3', {
        zone,
        iterations: nsec3Iterations,
        saltLength: nsec3SaltLength,
      });
      success(t('common.success'), t('zones.convertedToNsec3'));
      await onSuccess();
    } catch {
      error(t('common.error'), t('zones.convertToNsec3Failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleConvertNsec = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/convertToNSEC', { zone });
      success(t('common.success'), t('zones.convertedToNsec'));
      await onSuccess();
    } catch {
      error(t('common.error'), t('zones.convertToNsecFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNsec3Params = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/updateNSEC3Params', {
        zone,
        iterations: nsec3Iterations,
        saltLength: nsec3SaltLength,
      });
      success(t('common.success'), t('zones.nsec3ParamsUpdated'));
      await onSuccess();
    } catch {
      error(t('common.error'), t('zones.nsec3ParamsUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePublishAllKeys = async () => {
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/publishAllPrivateKeys', { zone });
      success(t('common.success'), t('zones.privateKeysPublished'));
      await onSuccess();
    } catch {
      error(t('common.error'), t('zones.publishKeysFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleActivateKsk = async (keyTag: number) => {
    if (!(await confirmDialog(t('zones.activateKskConfirm', { keyTag })))) return;
    setSaving(true);
    try {
      await apiClient.post('/zones/dnssec/properties/activateKskDnsKey', { zone, keyTag });
      success(t('common.success'), t('zones.kskActivated'));
      await onSuccess();
    } catch {
      error(t('common.error'), t('zones.kskActivateFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${t('zones.dnssecProperties')}: ${zone}`}
      size="lg"
    >
      {loading ? (
        <Text>{t('common.loading')}</Text>
      ) : zoneProps ? (
        <Stack>
          <Text size="sm">
            {t('zones.statusColumn')}: <Code>{dnssecStatusStr || 'N/A'}</Code> |{' '}
            {t('zones.dnskeyTtl')}: <Code>{String(zoneProps?.dnsKeyTtl ?? 'N/A')}</Code>
          </Text>

          <TextInput
            label={t('zones.dnskeyTtl')}
            value={dnsKeyTtl}
            onChange={e => setDnsKeyTtl(e.target.value)}
          />
          <Group>
            <Button size="sm" onClick={handleUpdateDnsKeyTtl} loading={saving}>
              {t('zones.updateDnskeyTtl')}
            </Button>
          </Group>

          {isNsec3 ? (
            <Stack>
              <NumberInput
                label={t('zones.nsec3Iterations')}
                value={nsec3Iterations}
                onChange={v => setNsec3Iterations(Number(v))}
                min={0}
              />
              <NumberInput
                label={t('zones.nsec3SaltLength')}
                value={nsec3SaltLength}
                onChange={v => setNsec3SaltLength(Number(v))}
                min={0}
              />
              <Group>
                <Button size="sm" onClick={handleUpdateNsec3Params} loading={saving}>
                  {t('zones.updateNsec3Params')}
                </Button>
                <Button size="sm" variant="default" onClick={handleConvertNsec} loading={saving}>
                  {t('zones.convertToNsec')}
                </Button>
              </Group>
            </Stack>
          ) : (
            <Stack>
              <NumberInput
                label={t('zones.nsec3Iterations')}
                value={nsec3Iterations}
                onChange={v => setNsec3Iterations(Number(v))}
                min={0}
              />
              <NumberInput
                label={t('zones.nsec3SaltLength')}
                value={nsec3SaltLength}
                onChange={v => setNsec3SaltLength(Number(v))}
                min={0}
              />
              <Button
                size="sm"
                variant="default"
                onClick={handleConvertNsec3}
                loading={saving}
                style={{ alignSelf: 'flex-start' }}
              >
                {t('zones.convertToNsec3')}
              </Button>
            </Stack>
          )}

          <Text fw={600} mt="md">
            {t('zones.privateKeys', { count: privateKeys.length })}
          </Text>
          {privateKeys.length > 0 ? (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('zones.keyTag')}</Table.Th>
                  <Table.Th>{t('zones.type')}</Table.Th>
                  <Table.Th>{t('zones.algorithm')}</Table.Th>
                  <Table.Th>{t('zones.state')}</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {privateKeys.map((key, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{String(key.keyTag)}</Table.Td>
                    <Table.Td>{key.keyType as string}</Table.Td>
                    <Table.Td>{key.algorithm as string}</Table.Td>
                    <Table.Td>{key.state as string}</Table.Td>
                    <Table.Td>
                      {key.keyType === 'KeySigningKey' && key.state === 'Ready' && (
                        <Button
                          size="compact-xs"
                          variant="light"
                          loading={saving}
                          onClick={() => handleActivateKsk(Number(key.keyTag))}
                        >
                          {t('zones.activate')}
                        </Button>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text c="dimmed" size="sm">
              {t('zones.noPrivateKeys')}
            </Text>
          )}

          <Button variant="default" onClick={handlePublishAllKeys} loading={saving}>
            {t('zones.publishAllPrivateKeys')}
          </Button>
        </Stack>
      ) : (
        <Text c="dimmed">{t('zones.propertiesLoadFailed')}</Text>
      )}
      <Group justify="flex-end" mt="md">
        <Button onClick={onClose}>{t('common.close')}</Button>
      </Group>
    </Modal>
  );
}
