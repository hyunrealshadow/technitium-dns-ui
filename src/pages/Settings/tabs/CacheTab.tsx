import { Button, Checkbox, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Settings } from '../types';

export function CacheTab({
  s,
  set,
  onFlushCache,
}: {
  s: Settings;
  set: (patch: Partial<Settings>) => void;
  onFlushCache: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.dnsCache')}
        </Text>
        <Group align="flex-start">
          <Checkbox
            label={t('settings.saveCache')}
            description={t('settings.saveCacheHelp')}
            checked={s.saveCache}
            onChange={e => set({ saveCache: e.currentTarget.checked })}
          />
          <Button size="xs" color="red" onClick={onFlushCache}>
            {t('settings.flushCache')}
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.saveCacheNote')}
        </Text>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.serveStale')}
        </Text>
        <Checkbox
          label={t('settings.serveStale')}
          description={t('settings.serveStaleHelp')}
          checked={s.serveStale}
          onChange={e => set({ serveStale: e.currentTarget.checked })}
        />
        <div
          className="form-grid form-grid--2"
          style={{
            marginTop: 'var(--mantine-spacing-sm)',
          }}
        >
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.serveStaleTtl')}
            description={t('settings.serveStaleTtlHelp')}
            value={s.serveStaleTtl}
            onChange={e => set({ serveStaleTtl: e.target.value })}
            disabled={!s.serveStale}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.serveStaleAnswerTtl')}
            description={t('settings.serveStaleAnswerTtlHelp')}
            value={s.serveStaleAnswerTtl}
            onChange={e => set({ serveStaleAnswerTtl: e.target.value })}
            disabled={!s.serveStale}
          />
        </div>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.serveStaleResetTtl')}
            description={t('settings.serveStaleResetTtlHelp')}
            value={s.serveStaleResetTtl}
            onChange={e => set({ serveStaleResetTtl: e.target.value })}
            disabled={!s.serveStale}
          />
          <TextInput
            label={t('settings.serveStaleMaxWaitTime')}
            description={t('settings.serveStaleMaxWaitTimeHelp')}
            value={s.serveStaleMaxWaitTime}
            onChange={e => set({ serveStaleMaxWaitTime: e.target.value })}
            disabled={!s.serveStale}
          />
        </Group>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.cache')}
        </Text>
        <div className="form-grid form-grid--3">
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.cacheMaximumEntries')}
            description={t('settings.cacheMaximumEntriesHelp')}
            value={s.cacheMaximumEntries}
            onChange={e => set({ cacheMaximumEntries: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.minimumRecordTtl')}
            description={t('settings.minimumRecordTtlHelp')}
            value={s.cacheMinimumRecordTtl}
            onChange={e => set({ cacheMinimumRecordTtl: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.maximumRecordTtl')}
            description={t('settings.maximumRecordTtlHelp')}
            value={s.cacheMaximumRecordTtl}
            onChange={e => set({ cacheMaximumRecordTtl: e.target.value })}
          />
        </div>
        <div
          className="form-grid form-grid--2"
          style={{
            marginTop: 'var(--mantine-spacing-sm)',
          }}
        >
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.negativeRecordTtl')}
            description={t('settings.negativeRecordTtlHelp')}
            value={s.cacheNegativeRecordTtl}
            onChange={e => set({ cacheNegativeRecordTtl: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.failureRecordTtl')}
            description={t('settings.failureRecordTtlHelp')}
            value={s.cacheFailureRecordTtl}
            onChange={e => set({ cacheFailureRecordTtl: e.target.value })}
          />
        </div>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.prefetch')}
        </Text>
        <Group align="flex-start" grow>
          <TextInput
            label={t('settings.prefetchEligibility')}
            description={t('settings.prefetchEligibilityHelp')}
            value={s.cachePrefetchEligibility}
            onChange={e => set({ cachePrefetchEligibility: e.target.value })}
          />
          <TextInput
            label={t('settings.prefetchTrigger')}
            description={t('settings.prefetchTriggerHelp')}
            value={s.cachePrefetchTrigger}
            onChange={e => set({ cachePrefetchTrigger: e.target.value })}
          />
          <TextInput
            label={t('settings.sampleInterval')}
            description={t('settings.sampleIntervalHelp')}
            value={s.cachePrefetchSampleIntervalInMinutes}
            onChange={e => set({ cachePrefetchSampleIntervalInMinutes: e.target.value })}
          />
        </Group>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.sampleEligibility')}
            description={t('settings.sampleEligibilityHelp')}
            value={s.cachePrefetchSampleEligibilityHitsPerHour}
            onChange={e => set({ cachePrefetchSampleEligibilityHitsPerHour: e.target.value })}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.prefetchNote')}
        </Text>
      </Paper>
    </Stack>
  );
}
