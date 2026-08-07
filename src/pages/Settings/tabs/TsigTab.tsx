import { ActionIcon, Button, Group, Paper, Select, Table, Text, TextInput } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { Settings } from '../types';

export function TsigTab({ s, set }: { s: Settings; set: (patch: Partial<Settings>) => void }) {
  const { t } = useTranslation();
  const keys = s.tsigKeys || [];
  const updateKey = (
    index: number,
    field: 'keyName' | 'sharedSecret' | 'algorithmName',
    value: string
  ) => {
    const newKeys = keys.map((k, i) => (i === index ? { ...k, [field]: value } : k));
    set({ tsigKeys: newKeys });
  };
  const removeKey = (index: number) => {
    set({ tsigKeys: keys.filter((_, i) => i !== index) });
  };

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Group align="flex-start" justify="space-between" mb="sm">
        <Text fw={600}>{t('settings.tsigKeys')}</Text>
        <Button
          size="xs"
          variant="default"
          onClick={() =>
            set({
              tsigKeys: [...keys, { keyName: '', sharedSecret: '', algorithmName: 'HMAC-SHA256' }],
            })
          }
        >
          {t('common.add')}
        </Button>
      </Group>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('settings.keyName')}</Table.Th>
            <Table.Th>{t('settings.sharedSecret')}</Table.Th>
            <Table.Th>{t('settings.algorithm')}</Table.Th>
            <Table.Th style={{ width: 60 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {keys.map((key, i) => (
            <Table.Tr key={i}>
              <Table.Td>
                <TextInput
                  size="xs"
                  value={key.keyName}
                  onChange={e => updateKey(i, 'keyName', e.target.value)}
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  size="xs"
                  value={key.sharedSecret}
                  onChange={e => updateKey(i, 'sharedSecret', e.target.value)}
                />
              </Table.Td>
              <Table.Td>
                <Select
                  size="xs"
                  data={[
                    'HMAC-MD5',
                    'HMAC-SHA1',
                    'HMAC-SHA224',
                    'HMAC-SHA256',
                    'HMAC-SHA384',
                    'HMAC-SHA512',
                  ]}
                  value={key.algorithmName}
                  onChange={v => updateKey(i, 'algorithmName', v || 'HMAC-SHA256')}
                  allowDeselect={false}
                />
              </Table.Td>
              <Table.Td>
                <ActionIcon
                  size="sm"
                  color="red"
                  variant="subtle"
                  aria-label={t('common.delete')}
                  onClick={() => removeKey(i)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {keys.length === 0 && (
        <Text c="dimmed" size="sm">
          {t('settings.noTsigKeys')}
        </Text>
      )}
      <Text size="xs" c="dimmed" mt="sm">
        {t('settings.tsigKeysHelp')}
      </Text>
      <Text size="xs" c="dimmed">
        {t('settings.tsigNote')}
      </Text>
    </Paper>
  );
}
