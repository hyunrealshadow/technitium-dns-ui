import { useEffect, useState } from 'react';
import { Button, Group, Modal, Stack } from '@mantine/core';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import {
  codeMirrorFontTheme,
  codeMirrorLightTheme,
  foldGutterExtension,
} from '../../../utils/codeMirror';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import { colorModeAtom, resolveColorMode } from '../../../store/theme';
import type { App } from '../types';

// 应用配置 JSON 编辑 Modal：打开时加载当前配置，保存后通知父页面
export function AppConfigModal({
  app,
  opened,
  onClose,
  onSaved,
}: {
  app: App | null;
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [colorMode] = useAtom(colorModeAtom);
  const isDark = resolveColorMode(colorMode) === 'dark';
  const [configText, setConfigText] = useState('');

  useEffect(() => {
    if (!opened || !app) return;
    let cancelled = false;
    apiClient
      .get<{ config: string }>(`/apps/config/get?name=${encodeURIComponent(app.name)}`)
      .then(response => {
        if (!cancelled && response.status === 'ok' && response.response) {
          setConfigText(response.response.config || '{}');
        }
      })
      .catch(() => {
        if (!cancelled) error(t('common.error'), t('apps.configLoadFailed'));
      });
    return () => {
      cancelled = true;
    };
  }, [opened, app, t]);

  const saveConfig = async () => {
    if (!app) return;
    try {
      const response = await apiClient.post(
        `/apps/config/set?name=${encodeURIComponent(app.name)}`,
        { config: configText }
      );
      if (response.status === 'ok') {
        success(t('common.success'), t('apps.configSaved'));
        onSaved();
        onClose();
      }
    } catch {
      error(t('common.error'), t('apps.configSaveFailed'));
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('apps.configTitle', { name: app?.name })}
      size="lg"
    >
      <Stack>
        <CodeMirror
          value={configText}
          onChange={setConfigText}
          height="400px"
          extensions={[json(), codeMirrorFontTheme, foldGutterExtension]}
          theme={isDark ? oneDark : codeMirrorLightTheme}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
          }}
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={saveConfig}>{t('common.save')}</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
