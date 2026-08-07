import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Group,
  Paper,
  Radio,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { error } from '../../../components/notifications';
import type { QuickBlockList, Settings } from '../types';
import { toList, toArray } from '../constants';

export function BlockingTab({
  s,
  set,
  onUpdateBlockLists,
  onTemporaryDisable,
}: {
  s: Settings;
  set: (patch: Partial<Settings>) => void;
  onUpdateBlockLists: () => void;
  onTemporaryDisable: (minutes: number) => void;
}) {
  const { t } = useTranslation();
  const enabled = s.enableBlocking;
  const [quickBlockLists, setQuickBlockLists] = useState<QuickBlockList[]>([]);
  const [temporaryMinutes, setTemporaryMinutes] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/json/quick-block-lists-builtin.json')
      .then(r => r.json())
      .then((list: QuickBlockList[]) => {
        if (!cancelled) setQuickBlockLists(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const applyQuickBlockList = (name: string | null) => {
    if (!name) return;
    if (name === 'none') {
      set({ blockListUrls: [] });
      return;
    }
    const item = quickBlockLists.find(x => x.name === name);
    if (!item) return;
    const existing = toList(s.blockListUrls)
      .split('\n')
      .filter(x => x.trim() !== '');
    const merged = [...existing];
    for (const url of item.urls) {
      if (!merged.includes(url)) merged.push(url);
    }
    set({ blockListUrls: merged });
  };

  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Group align="flex-start">
          <Checkbox
            label={t('settings.enableBlocking')}
            description={t('settings.enableBlockingHelp')}
            checked={s.enableBlocking}
            onChange={e => set({ enableBlocking: e.currentTarget.checked })}
          />
          <Checkbox
            label={t('settings.allowTxtBlockingReport')}
            description={t('settings.allowTxtBlockingReportHelp')}
            checked={s.allowTxtBlockingReport}
            onChange={e => set({ allowTxtBlockingReport: e.currentTarget.checked })}
            disabled={!enabled}
          />
        </Group>
        <Stack gap="xs" mt="sm">
          <Text size="sm" fw={500}>
            {t('settings.blockingType')}
          </Text>
          <Radio
            disabled={!enabled}
            checked={s.blockingType === 'AnyAddress'}
            onChange={() => set({ blockingType: 'AnyAddress' })}
            label={t('settings.anyAddress')}
            description={t('settings.blockingTypeAnyHelp')}
          />
          <Radio
            disabled={!enabled}
            checked={s.blockingType === 'NxDomain'}
            onChange={() => set({ blockingType: 'NxDomain' })}
            label={t('settings.nxdomain')}
            description={t('settings.blockingTypeNxHelp')}
          />
          <Radio
            disabled={!enabled}
            checked={s.blockingType === 'CustomAddress'}
            onChange={() => set({ blockingType: 'CustomAddress' })}
            label={t('settings.customAddress')}
            description={t('settings.blockingTypeCustomHelp')}
          />
        </Stack>
        <Textarea
          mt="sm"
          label={t('settings.customBlockingAddresses')}
          value={toList(s.customBlockingAddresses)}
          onChange={e => set({ customBlockingAddresses: e.target.value.split('\n') })}
          minRows={3}
          autosize
          disabled={!enabled || s.blockingType !== 'CustomAddress'}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
            marginTop: 'var(--mantine-spacing-sm)',
          }}
        >
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.blockingAnswerTtl')}
            description={t('settings.blockingAnswerTtlHelp')}
            value={s.blockingAnswerTtl}
            onChange={e => set({ blockingAnswerTtl: e.target.value })}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.blockingBypassList')}
            description={t('settings.blockingBypassListHelp')}
            value={toList(s.blockingBypassList)}
            onChange={e => set({ blockingBypassList: toArray(e.target.value).split(',') })}
            disabled={!enabled}
          />
        </div>
        <Group mt="sm" align="end">
          <TextInput
            label={t('settings.temporarilyDisableBlocking')}
            type="number"
            value={temporaryMinutes}
            onChange={e => setTemporaryMinutes(e.target.value)}
            w={220}
            disabled={!enabled}
          />
          <Button
            color="yellow"
            disabled={!enabled}
            onClick={() => {
              const minutes = Number(temporaryMinutes);
              if (!minutes) {
                error(t('common.error'), t('settings.tempDisableMinutesRequired'));
                return;
              }
              onTemporaryDisable(minutes);
            }}
          >
            {t('settings.disableBlockingNow')}
          </Button>
          {s.temporaryDisableBlockingTill && (
            <Text size="sm" c="orange">
              {t('settings.temporarilyDisabledTill', {
                date: new Date(s.temporaryDisableBlockingTill).toLocaleString(),
              })}
            </Text>
          )}
        </Group>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.blockLists')}
        </Text>
        <Textarea
          label={t('settings.blockListUrls')}
          description={t('settings.blockListUrlsHelp')}
          placeholder={t('common.onePerLine')}
          value={toList(s.blockListUrls)}
          onChange={e => set({ blockListUrls: e.target.value.split('\n') })}
          minRows={4}
          autosize
          disabled={!enabled}
        />
        <Text size="xs" c="dimmed" mt="xs">
          {t('settings.blockListUrlsNote1')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.blockListUrlsNote2')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.blockListUrlsNote3')}
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 'var(--mantine-spacing-md)',
            marginTop: 'var(--mantine-spacing-sm)',
          }}
        >
          <Select
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              wrapper: { flexGrow: 1 },
              description: { flexGrow: 1 },
            }}
            label={t('common.quickAdd')}
            placeholder={t('settings.selectQuickBlockList')}
            description={t('settings.quickAddHelp')}
            data={[
              { value: 'none', label: t('settings.none') },
              ...quickBlockLists.map(x => ({ value: x.name, label: x.name })),
            ]}
            value={null}
            onChange={v => applyQuickBlockList(v)}
            disabled={!enabled}
            clearable
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.blockListUpdateInterval')}
            description={t('settings.blockListUpdateIntervalHelp')}
            value={s.blockListUpdateIntervalHours}
            onChange={e => set({ blockListUpdateIntervalHours: e.target.value })}
            disabled={!enabled}
          />
          <TextInput
            styles={{
              root: { display: 'flex', flexDirection: 'column' },
              description: { flexGrow: 1 },
            }}
            label={t('settings.nextUpdatedOn')}
            description={t('settings.blockListNextUpdateOnHelp')}
            value={
              s.blockListNextUpdatedOn
                ? new Date(s.blockListNextUpdatedOn).toLocaleString()
                : t('settings.notScheduled')
            }
            disabled
          />
        </div>
        <Group align="flex-start" mt="sm">
          <Button
            size="xs"
            variant="default"
            onClick={onUpdateBlockLists}
            disabled={!enabled || (s.blockListUrls || []).length === 0}
          >
            {t('settings.updateBlockListsNow')}
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.blockListsNote')}
        </Text>
      </Paper>
    </Stack>
  );
}
