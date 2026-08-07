import { Checkbox, Group, Paper, Radio, Stack, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Settings } from '../types';

export function LoggingTab({ s, set }: { s: Settings; set: (patch: Partial<Settings>) => void }) {
  const { t } = useTranslation();
  const enabled = s.loggingType !== 'None';
  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            {t('settings.loggingType')}
          </Text>
          <Radio
            checked={s.loggingType === 'None'}
            onChange={() => set({ loggingType: 'None' })}
            label={t('settings.none')}
            description={t('settings.loggingTypeNoneHelp')}
          />
          <Radio
            checked={s.loggingType === 'File'}
            onChange={() => set({ loggingType: 'File' })}
            label={t('settings.file')}
            description={t('settings.loggingTypeFileHelp')}
          />
          <Radio
            checked={s.loggingType === 'Console'}
            onChange={() => set({ loggingType: 'Console' })}
            label={t('settings.console')}
            description={t('settings.loggingTypeConsoleHelp')}
          />
          <Radio
            checked={s.loggingType === 'FileAndConsole'}
            onChange={() => set({ loggingType: 'FileAndConsole' })}
            label={t('settings.fileAndConsole')}
            description={t('settings.loggingTypeBothHelp')}
          />
        </Stack>
        <Group align="flex-start" mt="sm">
          <Checkbox
            label={t('settings.ignoreResolverLogs')}
            description={t('settings.ignoreResolverLogsHelp')}
            checked={s.ignoreResolverLogs}
            onChange={e => set({ ignoreResolverLogs: e.currentTarget.checked })}
            disabled={!enabled}
          />
          <Checkbox
            label={t('settings.logQueries')}
            description={t('settings.logQueriesHelp')}
            checked={s.logQueries}
            onChange={e => set({ logQueries: e.currentTarget.checked })}
            disabled={!enabled}
          />
          <Checkbox
            label={t('settings.useLocalTime')}
            description={t('settings.useLocalTimeHelp')}
            checked={s.useLocalTime}
            onChange={e => set({ useLocalTime: e.currentTarget.checked })}
            disabled={!enabled}
          />
        </Group>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.logFolderPath')}
            description={t('settings.logFolderPathHelp')}
            value={s.logFolder}
            onChange={e => set({ logFolder: e.target.value })}
            disabled={!enabled}
          />
          <TextInput
            label={t('settings.maxLogFileDays')}
            description={t('settings.maxLogFileDaysHelp')}
            value={s.maxLogFileDays}
            onChange={e => set({ maxLogFileDays: e.target.value })}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.loggingWarning')}
        </Text>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.stats')}
        </Text>
        <Group align="flex-start">
          <Checkbox
            label={t('settings.enableInMemoryStats')}
            description={t('settings.enableInMemoryStatsHelp')}
            checked={s.enableInMemoryStats}
            onChange={e => set({ enableInMemoryStats: e.currentTarget.checked })}
          />
        </Group>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.maxStatFileDays')}
            description={t('settings.maxStatFileDaysHelp')}
            value={s.maxStatFileDays}
            onChange={e => set({ maxStatFileDays: e.target.value })}
          />
        </Group>
      </Paper>
    </Stack>
  );
}
