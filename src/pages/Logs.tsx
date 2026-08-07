import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Collapse,
  Group,
  Menu,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconDotsVertical, IconTrash } from '@tabler/icons-react';
import CodeMirror from '@uiw/react-codemirror';
import { RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  type DecorationSet,
} from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  codeMirrorFontTheme,
  codeMirrorLightTheme,
  foldGutterExtension,
} from '../utils/codeMirror';
import { getRcodeColor } from '../utils/rcode';
import { useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { success, error } from '../components/notifications';
import { apiClient } from '../api/client';
import { colorModeAtom, resolveColorMode } from '../store/theme';

interface LogFile {
  fileName: string;
  size: string;
}

interface QueryLogEntry {
  rowNumber: number;
  timestamp: string;
  clientIpAddress: string;
  protocol: string;
  responseType: string;
  responseRtt?: number;
  rcode: string;
  qname: string;
  qtype?: string;
  qclass?: string;
  answer: string;
}

interface QueryLogsResponse {
  entries: QueryLogEntry[];
  pageNumber: number;
  totalPages: number;
  totalEntries: number;
}

const PROTOCOLS = ['', 'Udp', 'Tcp', 'Tls', 'Https', 'Quic', 'UdpProxy', 'TcpProxy'];
const RESPONSE_TYPES = [
  '',
  'Authoritative',
  'Recursive',
  'Cached',
  'Blocked',
  'UpstreamBlocked',
  'UpstreamBlockedCached',
];
const RCODES = [
  '',
  'NoError',
  'FormatError',
  'ServerFailure',
  'NxDomain',
  'NotImplemented',
  'Refused',
  'YXDomain',
  'YXRRSet',
  'NXRRSet',
  'NotAuth',
  'NotZone',
];
const QCLASSES = ['', 'IN', 'CS', 'CH', 'HS', 'NONE', 'ANY'];

function getRowColor(entry: QueryLogEntry): string | undefined {
  // 用主题色低透明度混合（8%），深浅模式都柔和，避免整行铺满饱和色
  const tint = (color: string) =>
    `color-mix(in srgb, var(--mantine-color-${color}-6) 8%, transparent)`;
  switch (entry.rcode.toLowerCase()) {
    case 'serverfailure':
      return tint('red');
    case 'nxdomain':
      if (
        ['blocked', 'upstreamblocked', 'upstreamblockedcached'].includes(
          entry.responseType.toLowerCase()
        )
      )
        return tint('orange');
      return tint('gray');
    case 'refused':
      return tint('cyan');
    default:
      switch (entry.responseType.toLowerCase()) {
        case 'authoritative':
          return tint('yellow');
        case 'recursive':
          return tint('cyan');
        case 'cached':
          return tint('grape');
        case 'blocked':
        case 'upstreamblocked':
        case 'upstreamblockedcached':
          return tint('orange');
        default:
          return undefined;
      }
  }
}

// 日志行高亮：时间戳 / 客户端地址 / 用户名 分别着色（颜色用 Mantine CSS 变量，随深浅主题自适应）
const logHighlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.build(update.view);
      }
    }

    build(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      const mark = (style: string) => Decoration.mark({ attributes: { style: `color: ${style}` } });
      const timestamp = mark('var(--mantine-color-dimmed)');
      const address = mark('var(--mantine-color-cyan-6)');
      const username = mark('var(--mantine-color-teal-6)');
      const appName = mark('var(--mantine-color-violet-6)');

      for (let pos = 1; pos <= view.state.doc.length; ) {
        const line = view.state.doc.lineAt(pos);
        let offset = 0;
        let rest = line.text;

        // [2026-08-03 12:48:36 UTC]
        const mTime = rest.match(/^\[[^\]]+\]\s*/);
        if (mTime) {
          builder.add(line.from + offset, line.from + offset + mTime[0].length, timestamp);
          offset += mTime[0].length;
          rest = rest.slice(mTime[0].length);

          // [10.10.10.1:56448] 客户端地址
          const mAddr = rest.match(/^\[[0-9a-fA-F:.]+:[0-9]+\]\s*/);
          if (mAddr) {
            builder.add(line.from + offset, line.from + offset + mAddr[0].length, address);
            offset += mAddr[0].length;
            rest = rest.slice(mAddr[0].length);
          }

          // DNS App [Dns Domain Forwarding]: ... 方括号中的 app 名
          const mApp = rest.match(/^DNS App \[[^\]]+\]:\s*/);
          if (mApp) {
            const open = mApp[0].indexOf('[');
            const close = mApp[0].indexOf(']');
            builder.add(line.from + offset + open, line.from + offset + close + 1, appName);
            offset += mApp[0].length;
            rest = rest.slice(mApp[0].length);
          }

          // [admin] 用户名
          const mUser = rest.match(/^\[[^\]]+\]\s*/);
          if (mUser) {
            builder.add(line.from + offset, line.from + offset + mUser[0].length, username);
          }
        }

        pos = line.to + 1;
      }

      return builder.finish();
    }
  },
  {
    // 必须通过该选项把 decorations 暴露给视图，否则高亮不生效
    decorations: v => v.decorations,
  }
);

function LogViewerTab() {
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
        `/api/logs/download?token=${encodeURIComponent(apiClient.getToken() || '')}&fileName=${encodeURIComponent(fileName)}&limit=2`
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

  const downloadLog = (fileName: string) => {
    const token = apiClient.getToken();
    if (token) {
      window.open(
        `/api/logs/download?token=${encodeURIComponent(token)}&fileName=${encodeURIComponent(fileName)}&ts=${Date.now()}`,
        '_blank'
      );
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

function QueryLogsTab({
  initialQname = '',
  initialClientIp = '',
}: {
  initialQname?: string;
  initialClientIp?: string;
}) {
  const { t } = useTranslation();
  const [colorMode] = useAtom(colorModeAtom);
  const isDark = resolveColorMode(colorMode) === 'dark';
  // 表格内 dot Badge 固定 body 背景，避免行 hover 高亮/行背景色时 badge 融入（与 DNS Client 一致）
  const dotBadgeStyle = {
    backgroundColor: 'var(--mantine-color-body)',
    ...(isDark ? { border: '1px solid var(--mantine-color-dark-4)' } : {}),
  };

  interface QueryLogsApp {
    name: string;
    dnsApps: { classPath: string; isQueryLogs?: boolean }[];
  }

  const [appOptions, setAppOptions] = useState<{ value: string; label: string }[]>([]);
  const [classPathOptions, setClassPathOptions] = useState<string[]>([]);
  const [appName, setAppName] = useState('');
  const [classPath, setClassPath] = useState('');
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState('25');
  const [descendingOrder, setDescendingOrder] = useState('true');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [clientIp, setClientIp] = useState(initialClientIp);
  const [protocol, setProtocol] = useState('');
  const [responseType, setResponseType] = useState('');
  const [rcode, setRcode] = useState('');
  const [qname, setQname] = useState(initialQname);
  const [qtype, setQtype] = useState('');
  const [qclass, setQclass] = useState('');

  const [entries, setEntries] = useState<QueryLogEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [queried, setQueried] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const autoQueried = useRef(false);
  const [blockConfirm, setBlockConfirm] = useState<{
    qname: string;
    action: 'block' | 'allow';
  } | null>(null);

  const loadApps = useCallback(async () => {
    try {
      const response = await apiClient.get<{ apps: QueryLogsApp[] }>('/apps/list');
      if (response.status === 'ok' && response.response) {
        const apps = response.response.apps;
        const names: string[] = [];
        for (const app of apps) {
          for (const dnsApp of app.dnsApps) {
            if (dnsApp.isQueryLogs) {
              names.push(app.name);
              break;
            }
          }
        }
        setAppOptions(names.map(n => ({ value: n, label: n })));
        if (names.length > 0) setAppName(names[0]);
      }
    } catch {
      setAppOptions([]);
    }
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  useEffect(() => {
    if (!appName) {
      setClassPathOptions([]);
      setClassPath('');
      return;
    }
    async function loadClassPaths() {
      try {
        const response = await apiClient.get<{ apps: QueryLogsApp[] }>('/apps/list');
        if (response.status === 'ok' && response.response) {
          for (const app of response.response.apps) {
            if (app.name === appName) {
              const paths = app.dnsApps.filter(a => a.isQueryLogs).map(a => a.classPath);
              setClassPathOptions(paths);
              if (paths.length > 0) setClassPath(paths[0]);
              break;
            }
          }
        }
      } catch {
        setClassPathOptions([]);
      }
    }
    loadClassPaths();
  }, [appName]);

  // 自动查询：应用与类路径就绪后执行一次（含从其他页面带筛选参数跳转的场景）
  useEffect(() => {
    if (appName && classPath && !autoQueried.current) {
      autoQueried.current = true;
      queryLogs(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appName, classPath]);

  const hasAdvancedFilters = !!(
    start ||
    end ||
    clientIp ||
    protocol ||
    responseType ||
    rcode ||
    qname ||
    qtype ||
    qclass
  );

  const queryLogs = async (pageNumber?: number) => {
    if (!appName || !classPath) return;
    const p = pageNumber ?? page;
    setLoading(true);
    try {
      const url =
        `/logs/query?name=${encodeURIComponent(appName)}&classPath=${encodeURIComponent(classPath)}` +
        `&pageNumber=${p}&entriesPerPage=${entriesPerPage}&descendingOrder=${descendingOrder}` +
        `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&clientIpAddress=${encodeURIComponent(clientIp)}` +
        `&protocol=${protocol}&responseType=${responseType}&rcode=${rcode}` +
        `&qname=${encodeURIComponent(qname)}&qtype=${qtype}&qclass=${qclass}`;
      const response = await apiClient.get<QueryLogsResponse>(url);
      if (response.status === 'ok' && response.response) {
        setEntries(response.response.entries);
        setTotalEntries(response.response.totalEntries);
        setTotalPages(Math.max(1, response.response.totalPages));
        setPage(response.response.pageNumber);
      }
      setQueried(true);
    } catch {
      error(t('common.error'), t('logs.queryFailed'));
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const token = apiClient.getToken();
    if (!token) return;
    const url =
      `/api/logs/export?token=${encodeURIComponent(token)}&name=${encodeURIComponent(appName)}&classPath=${encodeURIComponent(classPath)}` +
      `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&clientIpAddress=${encodeURIComponent(clientIp)}` +
      `&protocol=${protocol}&responseType=${responseType}&rcode=${rcode}` +
      `&qname=${encodeURIComponent(qname)}&qtype=${qtype}&qclass=${qclass}`;
    window.open(url, '_blank');
  };

  const handleBlockAllow = async (action: 'block' | 'allow') => {
    if (!blockConfirm) return;
    try {
      if (action === 'block') {
        await apiClient.post('/blocked/add', { domain: blockConfirm.qname });
      } else {
        await apiClient.post('/allowed/add', { domain: blockConfirm.qname });
      }
      success(
        t('common.success'),
        action === 'block'
          ? t('logs.domainBlocked', { domain: blockConfirm.qname })
          : t('logs.domainAllowed', { domain: blockConfirm.qname })
      );
    } catch {
      error(t('common.error'), action === 'block' ? t('logs.blockFailed') : t('logs.allowFailed'));
    }
    setBlockConfirm(null);
  };

  const isBlocked = (entry: QueryLogEntry) =>
    ['blocked', 'upstreamblocked', 'upstreamblockedcached'].includes(
      entry.responseType.toLowerCase()
    );

  return (
    <Stack mt="md">
      <Paper shadow="sm" p="md" withBorder>
        <Group gap="sm" align="end" wrap="wrap">
          <Select
            label={t('common.appName')}
            data={appOptions}
            value={appName}
            onChange={v => setAppName(v || '')}
            w={200}
            allowDeselect={false}
            searchable
          />
          <Select
            label={t('common.classPath')}
            data={classPathOptions}
            value={classPath}
            onChange={v => setClassPath(v || '')}
            w={260}
            allowDeselect={false}
            searchable
          />
          <Select
            label={t('logs.logsPerPage')}
            data={['10', '25', '50', '100', '250', '500']}
            value={entriesPerPage}
            onChange={v => setEntriesPerPage(v || '25')}
            w={120}
            allowDeselect={false}
          />
          <Select
            label={t('logs.order')}
            data={[
              { value: 'false', label: t('logs.ascending') },
              { value: 'true', label: t('logs.descending') },
            ]}
            value={descendingOrder}
            onChange={v => setDescendingOrder(v || 'true')}
            w={120}
            allowDeselect={false}
          />
          <Group gap="xs" ml="auto" align="end">
            <Button onClick={() => queryLogs(1)} loading={loading}>
              {t('logs.query')}
            </Button>
            <Button variant="default" onClick={exportCsv}>
              {t('common.export')}
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setStart('');
                setEnd('');
                setClientIp('');
                setProtocol('');
                setResponseType('');
                setRcode('');
                setQname('');
                setQtype('');
                setQclass('');
              }}
            >
              {t('common.reset')}
            </Button>
          </Group>
        </Group>

        <Group mt="md" gap={6}>
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            rightSection={
              advancedOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
            }
            onClick={() => setAdvancedOpen(o => !o)}
          >
            {t('logs.advancedFilters')}
          </Button>
          {hasAdvancedFilters && (
            <Badge size="sm" variant="light" color="blue" tt="none">
              {t('logs.filtersActive')}
            </Badge>
          )}
        </Group>

        <Collapse expanded={advancedOpen}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 'var(--mantine-spacing-md)',
              marginTop: 'var(--mantine-spacing-sm)',
            }}
          >
            <TextInput
              label={t('logs.from')}
              type="datetime-local"
              value={start}
              onChange={e => setStart(e.target.value)}
            />
            <TextInput
              label={t('logs.to')}
              type="datetime-local"
              value={end}
              onChange={e => setEnd(e.target.value)}
            />
            <TextInput
              label={t('logs.clientIpAddress')}
              value={clientIp}
              onChange={e => setClientIp(e.target.value)}
            />
            <Select
              label={t('logs.protocol')}
              data={PROTOCOLS}
              value={protocol}
              onChange={v => setProtocol(v || '')}
              allowDeselect={false}
            />
            <Select
              label={t('logs.responseType')}
              data={RESPONSE_TYPES.map(v => ({
                value: v,
                label: v ? t(`logs.responseTypes.${v}`, { defaultValue: v }) : v,
              }))}
              value={responseType}
              onChange={v => setResponseType(v || '')}
              allowDeselect={false}
            />
            <Select
              label={t('logs.rcode')}
              data={RCODES.map(v => ({
                value: v,
                label: v
                  ? t(`common.rcodes.${v === 'NxDomain' ? 'NXDomain' : v}`, { defaultValue: v })
                  : v,
              }))}
              value={rcode}
              onChange={v => setRcode(v || '')}
              allowDeselect={false}
            />
            <TextInput
              label={t('logs.domain')}
              value={qname}
              onChange={e => setQname(e.target.value)}
            />
            <TextInput
              label={t('logs.type')}
              value={qtype}
              onChange={e => setQtype(e.target.value)}
            />
            <Select
              label={t('logs.class')}
              data={QCLASSES}
              value={qclass}
              onChange={v => setQclass(v || '')}
              allowDeselect={false}
            />
          </div>
        </Collapse>
      </Paper>

      {entries.length > 0 && (
        <Paper shadow="sm" p="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text size="sm">
              {t('logs.summary', {
                start: entries[0].rowNumber,
                end: entries[entries.length - 1].rowNumber,
                count: entries.length,
                total: totalEntries,
                page,
                pages: totalPages,
              })}
            </Text>
            {totalPages > 1 && (
              <Pagination
                value={page}
                onChange={p => queryLogs(p)}
                total={totalPages}
                size="sm"
                disabled={loading}
              />
            )}
          </Group>
          <Table.ScrollContainer minWidth={1100}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>{t('logs.timestamp')}</Table.Th>
                  <Table.Th>{t('logs.clientIpAddress')}</Table.Th>
                  <Table.Th>{t('logs.protocol')}</Table.Th>
                  <Table.Th>{t('logs.responseType')}</Table.Th>
                  <Table.Th>{t('logs.rcode')}</Table.Th>
                  <Table.Th>{t('logs.domain')}</Table.Th>
                  <Table.Th>{t('logs.type')}</Table.Th>
                  <Table.Th>{t('logs.class')}</Table.Th>
                  <Table.Th>{t('logs.answer')}</Table.Th>
                  <Table.Th style={{ width: 40 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {entries.map(entry => (
                  <Table.Tr
                    key={entry.rowNumber}
                    style={getRowColor(entry) ? { backgroundColor: getRowColor(entry) } : undefined}
                  >
                    <Table.Td>{entry.rowNumber}</Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(entry.timestamp).toLocaleString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ maxWidth: 180 }} truncate="end">
                        {entry.clientIpAddress}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{entry.protocol}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {entry.responseType
                          ? t(`logs.responseTypes.${entry.responseType}`, {
                              defaultValue: entry.responseType,
                            })
                          : entry.responseType}
                        {entry.responseRtt != null && (
                          <Text component="span" size="xs" c="dimmed">
                            ({entry.responseRtt.toFixed(2)} ms)
                          </Text>
                        )}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        variant="dot"
                        color={getRcodeColor(entry.rcode)}
                        tt="none"
                        style={{ ...dotBadgeStyle, cursor: 'text' }}
                      >
                        {entry.rcode
                          ? t(
                              `common.rcodes.${entry.rcode === 'NxDomain' ? 'NXDomain' : entry.rcode}`,
                              { defaultValue: entry.rcode }
                            )
                          : entry.rcode}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ maxWidth: 260 }} truncate="end">
                        {entry.qname === '' ? '.' : entry.qname}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{entry.qtype || ''}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{entry.qclass || ''}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ maxWidth: 300 }} truncate="end">
                        {entry.answer}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Menu position="bottom-end" shadow="sm">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" size="sm">
                            <IconDotsVertical size={14} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            onClick={() => {
                              window.location.href = `/dns-client?domain=${encodeURIComponent(entry.qname)}&type=${encodeURIComponent(entry.qtype || 'A')}`;
                            }}
                          >
                            {t('topTable.queryDns')}
                          </Menu.Item>
                          {isBlocked(entry) ? (
                            <Menu.Item
                              onClick={() =>
                                setBlockConfirm({ qname: entry.qname, action: 'allow' })
                              }
                            >
                              {t('topTable.allowDomain')}
                            </Menu.Item>
                          ) : (
                            <Menu.Item
                              onClick={() =>
                                setBlockConfirm({ qname: entry.qname, action: 'block' })
                              }
                            >
                              {t('topTable.blockDomain')}
                            </Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      {entries.length === 0 && queried && (
        <Paper shadow="sm" p="md" withBorder>
          <Text c="dimmed" ta="center" py="xl">
            {t('logs.noResults')}
          </Text>
        </Paper>
      )}

      <Modal
        opened={blockConfirm !== null}
        onClose={() => setBlockConfirm(null)}
        title={t('common.confirm')}
        centered
      >
        <Text mb="lg">
          {t('logs.blockAllowConfirm', {
            action: blockConfirm?.action === 'block' ? t('logs.block') : t('logs.allow'),
            domain: blockConfirm?.qname,
          })}
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setBlockConfirm(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            color={blockConfirm?.action === 'block' ? 'red' : 'green'}
            onClick={() => handleBlockAllow(blockConfirm!.action)}
          >
            {blockConfirm?.action === 'block' ? t('logs.block') : t('logs.allow')}
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}

export function LogsPage({ tab = 'view' }: { tab?: 'view' | 'query' }) {
  const { t } = useTranslation();
  const search = useSearch({ strict: false }) as { domain?: string; clientIp?: string };
  return (
    <Stack>
      <Title order={2}>{t('nav.logs')}</Title>
      {tab === 'query' ? (
        <QueryLogsTab initialQname={search.domain} initialClientIp={search.clientIp} />
      ) : (
        <LogViewerTab />
      )}
    </Stack>
  );
}
