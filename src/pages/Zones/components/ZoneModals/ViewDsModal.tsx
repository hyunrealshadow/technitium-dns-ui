import { useEffect, useState } from 'react';
import { Button, Code, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../../../api/client';
export function ViewDsModal({
  zone,
  opened,
  onClose,
}: {
  zone: string;
  opened: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [dsData, setDsData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!opened) return;
    const load = async () => {
      setDsData(null);
      try {
        const token = apiClient.getToken();
        const response = await fetch(
          `/api/zones/dnssec/viewDS?token=${encodeURIComponent(token || '')}&zone=${encodeURIComponent(zone)}`
        );
        const data = await response.json();
        if (data.status === 'ok') setDsData(data.response);
        else setDsData({});
      } catch {
        setDsData({});
      }
    };
    load();
  }, [opened, zone]);

  const dsRecords = (dsData?.dsRecords as Array<Record<string, unknown>>) || [];

  return (
    <Modal opened={opened} onClose={onClose} title={`${t('zones.viewDsInfo')}: ${zone}`} size="lg">
      {dsData === null ? (
        <Text>{t('common.loading')}</Text>
      ) : dsRecords.length === 0 ? (
        <Text>{t('zones.noDsRecords')}</Text>
      ) : (
        <Stack>
          {dsRecords.map((ds, i) => (
            <Stack key={i} gap="xs">
              <Text fw={600}>
                {t('zones.keyTag')}: {String(ds.keyTag)}
              </Text>
              <Text size="sm">
                {t('zones.algorithm')}: {ds.algorithm as string} ({String(ds.algorithmNumber)})
              </Text>
              <Text size="sm">
                {t('zones.state')}: {ds.dnsKeyState as string}
              </Text>
              {(ds.digests as Array<Record<string, string>>)?.map((digest, j) => (
                <Stack key={j} gap={2}>
                  <Text size="sm">
                    {t('zones.digestType')}: {digest.digestType}
                  </Text>
                  <Code block>{digest.digest}</Code>
                </Stack>
              ))}
            </Stack>
          ))}
        </Stack>
      )}
      <Group justify="flex-end" mt="md">
        <Button onClick={onClose}>{t('common.close')}</Button>
      </Group>
    </Modal>
  );
}
