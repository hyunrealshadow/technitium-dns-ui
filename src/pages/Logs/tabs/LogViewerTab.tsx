import { useCallback, useEffect, useState } from 'react';
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { IconTrash } from '@tabler/icons-react';
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
import type { LogFile } from '../types';
import { logHighlightPlugin } from '../components/logHighlightPlugin';

export function LogViewerTab() {
  const { t } = useTranslation();
  const [colorMode] = useAtom(colorModeAtom);
  const isDark = resolveColorMode(colorMode) === 'dark';
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ logFiles: LogFile[] }>('/logs/list');
      if (response.status === 'ok' && response.response) {
        setLogFiles(response.response.logFiles);
      }
    } catch {
      error(t('common.error'), t('logs.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const viewLog = async (fileName: string) => {
    setSelectedFile(fileName);
    setContent(null);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/logs/download?fileName=${encodeURIComponent(fileName)}&limit=2`,
        { headers: { Authorization: `Bearer ${apiClient.getToken() || ''}` } }
      );
      let text = await response.text();
      try {
        const json = JSON.parse(text);
        if (json.status != null) text = JSON.stringify(json, null, 2);
      } catch {
        /* plain text */
      }
      setContent(text);
    } catch {
      error(t('common.error'), t('logs.logFileLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const deleteLog = async (fileName: string) => {
    if (!window.confirm(t('logs.logFileDeleteConfirm', { fileName }))) return;
    try {
      const response = await apiClient.post('/logs/delete', { log: fileName });
      if (response.status === 'ok') {
        success(t('common.success'), t('logs.logFileDeleted'));
        setSelectedFile(null);
        setContent(null);
        await loadFiles();
      }
    } catch {
      error(t('common.error'), t('logs.logFileDeleteFailed'));
    }
  };

  const deleteAllLogs = async () => {
    if (!window.confirm(t('logs.deleteAllLogsConfirm'))) return;
    try {
      const response = await apiClient.post('/logs/deleteAll', {});
      if (response.status === 'ok') {
        success(t('common.success'), t('logs.allLogFilesDeleted'));
        setSelectedFile(null);
        setContent(null);
        await loadFiles();
      }
    } catch {
      error(t('common.error'), t('logs.logFilesDeleteFailed'));
    }
  };

  const deleteAllStats = async () => {
    if (!window.confirm(t('logs.deleteAllStatsConfirm'))) return;
    try {
      const response = await apiClient.post('/dashboard/stats/deleteAll', {});
      if (response.status === 'ok') {
        success(t('common.success'), t('logs.allStatsFilesDeleted'));
      }
    } catch {
      error(t('common.error'), t('logs.statsFilesDeleteFailed'));
    }
  };

  const downloadLog = async (fileName: string) => {
    try {
      const token = await apiClient.createSingleUseToken();
      window.open(
        `/api/logs/download?token=${encodeURIComponent(token)}&fileName=${encodeURIComponent(fileName)}&ts=${Date.now()}`,
        '_blank'
      );
    } catch {
      error(t('common.error'), t('logs.downloadFailed'));
    }
  };

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return (
    <Stack mt="md">
      {/* 操作区 */}
      <Group justify="flex-end">
        <Button
          size="xs"
          variant="default"
          color="red"
          leftSection={<IconTrash size={14} />}
          onClick={deleteAllStats}
        >
          {t('logs.deleteAllStats')}
        </Button>
        <Button
          size="xs"
          variant="default"
          color="red"
          leftSection={<IconTrash size={14} />}
          onClick={deleteAllLogs}
          disabled={logFiles.length === 0}
        >
          {t('logs.deleteAllLogs')}
        </Button>
      </Group>

      <Group align="start" gap="md">
        <Paper shadow="sm" p="md" withBorder style={{ minWidth: 260 }}>
          <Stack gap={6}>
            {logFiles.length === 0 ? (
              <Text c="dimmed" size="sm">
                {t('logs.noLogFileFound')}
              </Text>
            ) : (
              logFiles.map(file => (
                <Button
                  key={file.fileName}
                  variant={selectedFile === file.fileName ? 'light' : 'subtle'}
                  size="xs"
                  justify="flex-start"
                  onClick={() => viewLog(file.fileName)}
                >
                  {file.fileName} [{file.size}]
                </Button>
              ))
            )}
          </Stack>
        </Paper>

        <Paper shadow="sm" p="md" withBorder style={{ flex: 1 }}>
          {selectedFile ? (
            <Stack>
              <Group justify="space-between">
                <Text fw={600}>{selectedFile}</Text>
                <Group gap={4}>
                  <Button size="xs" variant="default" onClick={() => downloadLog(selectedFile)}>
                    {t('logs.download')}
                  </Button>
                  <Button size="xs" color="red" onClick={() => deleteLog(selectedFile)}>
                    {t('common.delete')}
                  </Button>
                </Group>
              </Group>
              {loading ? (
                <Text c="dimmed">{t('common.loading')}</Text>
              ) : content !== null ? (
                <CodeMirror
                  // theme 是 CodeMirror 创建期扩展，切换时用 key 强制重建编辑器
                  key={isDark ? 'dark' : 'light'}
                  value={content}
                  readOnly
                  height="600px"
                  extensions={[
                    EditorView.lineWrapping,
                    logHighlightPlugin,
                    codeMirrorFontTheme,
                    foldGutterExtension,
                  ]}
                  theme={isDark ? oneDark : codeMirrorLightTheme}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: false,
                    highlightActiveLine: false,
                    highlightActiveLineGutter: false,
                  }}
                />
              ) : null}
            </Stack>
          ) : (
            <Text c="dimmed">{t('logs.selectLogFile')}</Text>
          )}
        </Paper>
      </Group>
    </Stack>
  );
}
