import { Checkbox, Group, Paper, Radio, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Settings } from '../types';
import { toList } from '../constants';

export function RecursionTab({ s, set }: { s: Settings; set: (patch: Partial<Settings>) => void }) {
  const { t } = useTranslation();
  const showAcl = s.recursion === 'UseSpecifiedNetworkACL';
  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            {t('settings.recursion')}
          </Text>
          <Radio
            checked={s.recursion === 'Allow'}
            onChange={() => set({ recursion: 'Allow' })}
            label={t('settings.allow')}
            description={t('settings.recursionAllowHelp')}
          />
          <Radio
            checked={s.recursion === 'AllowOnlyForPrivateNetworks'}
            onChange={() => set({ recursion: 'AllowOnlyForPrivateNetworks' })}
            label={t('settings.allowOnlyForPrivateNetworks')}
            description={t('settings.recursionPrivateHelp')}
          />
          <Radio
            checked={s.recursion === 'UseSpecifiedNetworkACL'}
            onChange={() => set({ recursion: 'UseSpecifiedNetworkACL' })}
            label={t('settings.useSpecifiedNetworkACL')}
            description={t('settings.recursionAclHelp')}
          />
          <Radio
            checked={s.recursion === 'Deny'}
            onChange={() => set({ recursion: 'Deny' })}
            label={t('settings.denyDefault')}
            description={t('settings.recursionDenyHelp')}
          />
        </Stack>
        <Textarea
          mt="sm"
          label={t('settings.recursionNetworkAcl')}
          description={t('settings.recursionNetworkAclHelp')}
          value={toList(s.recursionNetworkACL)}
          onChange={e => set({ recursionNetworkACL: e.target.value.split('\n') })}
          minRows={4}
          autosize
          disabled={!showAcl}
        />
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.recursionNote')}
        </Text>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.recursiveResolver')}
        </Text>
        <Group align="flex-start">
          <Checkbox
            label={t('settings.randomizeName')}
            description={t('settings.randomizeNameHelp')}
            checked={s.randomizeName}
            onChange={e => set({ randomizeName: e.currentTarget.checked })}
          />
          <Checkbox
            label={t('settings.qnameMinimization')}
            description={t('settings.qnameMinimizationHelp')}
            checked={s.qnameMinimization}
            onChange={e => set({ qnameMinimization: e.currentTarget.checked })}
          />
          <Checkbox
            label={t('settings.locallyServedDnsZones')}
            description={t('settings.locallyServedDnsZonesHelp')}
            checked={s.locallyServedDnsZones}
            onChange={e => set({ locallyServedDnsZones: e.currentTarget.checked })}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.randomizeNameWarning')}
        </Text>
      </Paper>
      <Paper shadow="sm" p="md" withBorder>
        <Text fw={600} mb="sm">
          {t('settings.resolver')}
        </Text>
        <Group align="flex-start" grow>
          <TextInput
            label={t('settings.resolverRetries')}
            description={t('settings.resolverRetriesHelp')}
            value={s.resolverRetries}
            onChange={e => set({ resolverRetries: e.target.value })}
          />
          <TextInput
            label={t('settings.resolverTimeout')}
            description={t('settings.resolverTimeoutHelp')}
            value={s.resolverTimeout}
            onChange={e => set({ resolverTimeout: e.target.value })}
          />
          <TextInput
            label={t('settings.resolverConcurrency')}
            description={t('settings.resolverConcurrencyHelp')}
            value={s.resolverConcurrency}
            onChange={e => set({ resolverConcurrency: e.target.value })}
          />
        </Group>
        <Group align="flex-start" grow mt="sm">
          <TextInput
            label={t('settings.resolverMaxStackCount')}
            description={t('settings.resolverMaxStackCountHelp')}
            value={s.resolverMaxStackCount}
            onChange={e => set({ resolverMaxStackCount: e.target.value })}
          />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {t('settings.resolverNote1')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('settings.resolverNote2')}
        </Text>
      </Paper>
    </Stack>
  );
}
