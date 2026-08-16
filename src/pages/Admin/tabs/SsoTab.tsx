import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Button,
  Checkbox,
  Code,
  Group,
  LoadingOverlay,
  Paper,
  PasswordInput,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../../api/client';
import { error, success } from '../../../components/notifications';
import { useConfirmDialog } from '../../../components/ConfirmDialog.context';

interface SsoGroupMap {
  remoteGroup: string;
  localGroup: string;
}

interface SsoConfig {
  ssoEnabled: boolean;
  ssoAuthority: string;
  ssoClientId: string;
  ssoClientSecret: string;
  ssoMetadataAddress: string;
  ssoScopes: string[];
  ssoAllowSignup: boolean;
  ssoAllowSignupOnlyForMappedUsers: boolean;
  ssoGroupMap: SsoGroupMap[];
  localGroups: string[];
}

const emptyConfig: SsoConfig = {
  ssoEnabled: false,
  ssoAuthority: '',
  ssoClientId: '',
  ssoClientSecret: '',
  ssoMetadataAddress: '',
  ssoScopes: ['openid', 'profile'],
  ssoAllowSignup: false,
  ssoAllowSignupOnlyForMappedUsers: true,
  ssoGroupMap: [],
  localGroups: [],
};

export function SsoTab() {
  const { t } = useTranslation();
  const confirmDialog = useConfirmDialog();
  const [config, setConfig] = useState<SsoConfig>(emptyConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<SsoConfig>) => setConfig(current => ({ ...current, ...patch }));

  useEffect(() => {
    apiClient
      .get<SsoConfig>('/admin/sso/get?includeGroups=true')
      .then(response => {
        if (response.status === 'ok' && response.response) {
          setConfig({ ...emptyConfig, ...response.response });
        }
      })
      .catch(() => error(t('common.error'), t('admin.ssoLoadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  const save = async () => {
    if (
      config.ssoEnabled &&
      (!config.ssoAuthority || !config.ssoClientId || !config.ssoClientSecret)
    ) {
      error(t('common.error'), t('admin.ssoRequiredFields'));
      return;
    }
    if (
      (config.ssoAuthority.startsWith('http:') || config.ssoMetadataAddress.startsWith('http:')) &&
      !(await confirmDialog(t('admin.ssoHttpWarning'), { color: 'orange' }))
    ) {
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.post<SsoConfig>('/admin/sso/set', {
        ssoEnabled: config.ssoEnabled,
        ssoAuthority: config.ssoAuthority,
        ssoClientId: config.ssoClientId,
        ssoClientSecret: config.ssoClientSecret,
        ssoMetadataAddress: config.ssoMetadataAddress,
        ssoScopes: config.ssoScopes.filter(Boolean).join('|') || 'false',
        ssoAllowSignup: config.ssoAllowSignup,
        ssoAllowSignupOnlyForMappedUsers: config.ssoAllowSignupOnlyForMappedUsers,
        ssoGroupMap:
          config.ssoGroupMap
            .filter(row => row.remoteGroup && row.localGroup)
            .flatMap(row => [row.remoteGroup, row.localGroup])
            .join('|') || 'false',
      });
      if (response.status !== 'ok') throw new Error(response.errorMessage);
      if (response.response) setConfig({ ...emptyConfig, ...response.response });
      success(t('common.success'), t('admin.ssoSaved'));
    } catch (e) {
      error(t('common.error'), e instanceof Error ? e.message : t('admin.ssoSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const updateMap = (index: number, patch: Partial<SsoGroupMap>) =>
    set({
      ssoGroupMap: config.ssoGroupMap.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row
      ),
    });

  return (
    <Stack pos="relative">
      <LoadingOverlay visible={loading} />
      <Paper shadow="sm" p="md" withBorder>
        <Stack>
          <Checkbox
            label={t('admin.ssoEnable')}
            description={t('admin.ssoEnableHelp')}
            checked={config.ssoEnabled}
            onChange={e => set({ ssoEnabled: e.currentTarget.checked })}
          />
          <div className="form-grid form-grid--2">
            <TextInput
              label={t('admin.ssoAuthority')}
              placeholder="https://auth.example.com"
              value={config.ssoAuthority}
              onChange={e => set({ ssoAuthority: e.target.value })}
              required={config.ssoEnabled}
            />
            <TextInput
              label={t('admin.ssoClientId')}
              value={config.ssoClientId}
              onChange={e => set({ ssoClientId: e.target.value })}
              required={config.ssoEnabled}
            />
            <PasswordInput
              label={t('admin.ssoClientSecret')}
              value={config.ssoClientSecret}
              onChange={e => set({ ssoClientSecret: e.target.value })}
              required={config.ssoEnabled}
            />
            <TextInput
              label={t('admin.ssoMetadataAddress')}
              placeholder="https://auth.example.com/.well-known/openid-configuration"
              value={config.ssoMetadataAddress}
              onChange={e => set({ ssoMetadataAddress: e.target.value })}
            />
          </div>
          <TagsInput
            label={t('admin.ssoScopes')}
            description={t('admin.ssoScopesHelp')}
            value={config.ssoScopes}
            onChange={ssoScopes => set({ ssoScopes })}
          />
          <Text size="sm">
            {t('admin.ssoRedirectUri')}: <Code>{`${window.location.origin}/sso/callback`}</Code>
          </Text>
        </Stack>
      </Paper>

      <Paper shadow="sm" p="md" withBorder>
        <Stack>
          <Checkbox
            label={t('admin.ssoAllowSignup')}
            description={t('admin.ssoAllowSignupHelp')}
            checked={config.ssoAllowSignup}
            onChange={e => set({ ssoAllowSignup: e.currentTarget.checked })}
          />
          <Checkbox
            label={t('admin.ssoMappedOnly')}
            description={t('admin.ssoMappedOnlyHelp')}
            checked={config.ssoAllowSignupOnlyForMappedUsers}
            onChange={e => set({ ssoAllowSignupOnlyForMappedUsers: e.currentTarget.checked })}
            disabled={!config.ssoAllowSignup}
          />
        </Stack>
      </Paper>

      <Paper shadow="sm" p="md" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={600}>{t('admin.ssoGroupMap')}</Text>
            <Text size="sm" c="dimmed">
              {t('admin.ssoGroupMapHelp')}
            </Text>
          </div>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlus size={14} />}
            onClick={() =>
              set({
                ssoGroupMap: [
                  ...config.ssoGroupMap,
                  { remoteGroup: '', localGroup: config.localGroups[0] || '' },
                ],
              })
            }
          >
            {t('common.add')}
          </Button>
        </Group>
        <Stack gap="xs">
          {config.ssoGroupMap.map((row, index) => (
            <Group key={index} align="end" wrap="nowrap">
              <TextInput
                label={t('admin.ssoRemoteGroup')}
                value={row.remoteGroup}
                onChange={e => updateMap(index, { remoteGroup: e.target.value })}
                style={{ flex: 1 }}
              />
              <Select
                label={t('admin.ssoLocalGroup')}
                data={config.localGroups}
                value={row.localGroup}
                onChange={localGroup => updateMap(index, { localGroup: localGroup || '' })}
                style={{ flex: 1 }}
              />
              <ActionIcon
                color="red"
                variant="subtle"
                aria-label={t('common.delete')}
                onClick={() =>
                  set({
                    ssoGroupMap: config.ssoGroupMap.filter((_, rowIndex) => rowIndex !== index),
                  })
                }
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          ))}
          {config.ssoGroupMap.length === 0 && (
            <Text size="sm" c="dimmed">
              {t('common.noData')}
            </Text>
          )}
        </Stack>
      </Paper>

      <Group justify="flex-end">
        <Button onClick={save} loading={saving}>
          {t('common.save')}
        </Button>
      </Group>
    </Stack>
  );
}
