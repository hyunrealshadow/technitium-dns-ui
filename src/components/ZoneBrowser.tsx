import { Fragment, useCallback, useMemo, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Center,
  DataList,
  Divider,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconDownload,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  codeMirrorFontTheme,
  codeMirrorLightTheme,
  foldGutterExtension,
} from '../utils/codeMirror';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAtom } from 'jotai';
import { z } from 'zod';
import { success, error } from './notifications';
import { apiClient } from '../api/client';
import { colorModeAtom, resolveColorMode } from '../store/theme';

type ApiBase = 'cache' | 'allowed' | 'blocked';

interface ZoneBrowserRecord {
  name: string;
  nameIdn?: string;
  type: string;
  ttl?: number | string;
  ttlString?: string;
  disabled?: boolean;
  comments?: string;
  lastUsedOn?: string;
  lastModified?: string;
  dnssecStatus?: string;
  eDnsClientSubnet?: string;
  glueRecords?: string[];
  dnssecRecords?: string[];
  rData?: Record<string, unknown>;
}

interface ZoneBrowserResponse {
  domain: string;
  domainIdn?: string;
  zones: string[];
  records: ZoneBrowserRecord[];
}

// 路由 search 参数：当前浏览域
export const ZoneBrowserSearchSchema = z.object({
  domain: z.string().optional(),
});

export type ZoneBrowserSearch = z.infer<typeof ZoneBrowserSearchSchema>;

const RECORD_TYPE_COLORS: Record<string, string> = {
  A: 'blue',
  AAAA: 'blue',
  NS: 'green',
  CNAME: 'violet',
  MX: 'orange',
  TXT: 'teal',
  SOA: 'red',
  SRV: 'pink',
  PTR: 'cyan',
  CAA: 'grape',
  DS: 'indigo',
  SSHFP: 'indigo',
  TLSA: 'indigo',
  HTTPS: 'yellow',
  SVCB: 'yellow',
  DNAME: 'violet',
  RP: 'orange',
  NAPTR: 'pink',
  DNSKEY: 'dark',
  RRSIG: 'dark',
  NSEC: 'dark',
  NSEC3: 'dark',
  NSEC3PARAM: 'dark',
  URI: 'yellow',
  ANAME: 'violet',
  FWD: 'teal',
  APP: 'grape',
  ZONEMD: 'dark',
};

// 表格内 dot Badge 固定 body 背景，避免行 hover 高亮时 badge 融入行背景；文本光标便于选中复制
const DOT_BADGE_STYLE = { backgroundColor: 'var(--mantine-color-body)', cursor: 'text' as const };

const EMPTY_RECORDS: ZoneBrowserRecord[] = [];
const EMPTY_ZONES: string[] = [];
const EMPTY_FIELDS: RecordField[] = [];

function getParentDomain(domain: string): string {
  const i = domain.indexOf('.');
  if (i === -1) return '';
  return domain.substring(i + 1);
}

// SVCB/HTTPS 的 svcParams：后端返回对象（key → value），格式化为 zone 文件惯例的 key="value" 序列；
// 兼容数组（旧格式）与原始值
function formatSvcParams(value: unknown): string {
  if (Array.isArray(value)) return (value as unknown[]).map(String).join(' ');
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => `${key}="${String(val)}"`)
      .join(' ');
  }
  return String(value ?? '');
}

function formatRecordData(record: ZoneBrowserRecord, truncate = false): string {
  const d = record.rData;
  if (!d) return '';
  const s = (v: unknown) => String(v ?? '');
  const trunc = (v: string) => (truncate ? v.substring(0, 300) : v);

  // SOA: [主NS] 负责人 (序列号 刷新 重试 过期 最小TTL)，优先使用友好时间字符串
  if (d.primaryNameServer != null && d.responsiblePerson != null) {
    const soa = [
      `[${s(d.primaryNameServer)}]`,
      s(d.responsiblePerson),
      `(${s(d.serial)} ${s(d.refreshString ?? d.refresh)} ${s(d.retryString ?? d.retry)} ${s(
        d.expireString ?? d.expire
      )} ${s(d.minimumString ?? d.minimum)})`,
    ];
    return trunc(soa.join(' '));
  }
  // A / AAAA
  if (d.ipAddress) return s(d.ipAddress);
  if (d.ipv6Address) return s(d.ipv6Address);
  // NS
  if (d.nameServer) return s(d.nameServerIdn || d.nameServer);
  // CNAME / DNAME / ANAME / PTR
  if (d.cname) return s(d.cnameIdn || d.cname);
  if (d.dname) return s(d.dnameIdn || d.dname);
  if (d.aname) return s(d.aname);
  if (d.ptrName) return s(d.ptrName);
  // MX
  if (d.preference != null && d.exchange) return `[${s(d.preference)}] ${s(d.exchange)}`;
  // SRV
  if (d.priority != null && d.target)
    return `[${s(d.priority)}|${s(d.weight ?? 0)}|${s(d.port ?? 0)}] ${s(d.target)}`;
  // TXT
  if (d.value != null) {
    if (Array.isArray(d.value)) return (d.value as string[]).join(' ');
    return trunc(s(d.value));
  }
  // RP
  if (d.mailbox != null) return `${s(d.mailbox)} ${s(d.txtDomain ?? '')}`.trim();
  // NAPTR
  if (d.naptrOrder != null) {
    return `${s(d.naptrOrder)} ${s(d.naptrPreference)} "${s(d.naptrFlags)}" "${s(
      d.naptrServices
    )}" "${s(d.naptrRegexp)}" ${s(d.naptrReplacement)}`;
  }
  // DS
  if (d.keyTag != null) {
    return `${s(d.keyTag)} ${s(d.algorithm)} ${s(d.digestType)} ${trunc(s(d.digest))}`;
  }
  // SSHFP
  if (d.sshfpAlgorithm != null) {
    return `${s(d.sshfpAlgorithm)} ${s(d.sshfpFingerprintType)} ${trunc(s(d.sshfpFingerprint))}`;
  }
  // TLSA
  if (d.tlsaCertificateUsage != null) {
    return `${s(d.tlsaCertificateUsage)} ${s(d.tlsaSelector)} ${s(
      d.tlsaMatchingType
    )} ${trunc(s(d.tlsaCertificateAssociationData))}`;
  }
  // CAA
  if (d.flags != null && d.tag != null) return `${s(d.flags)} ${s(d.tag)} "${trunc(s(d.value))}"`;
  // URI
  if (d.uriPriority != null) return `[${s(d.uriPriority)}|${s(d.uriWeight ?? 0)}] ${s(d.uri)}`;
  // SVCB / HTTPS
  if (d.svcPriority != null) {
    return `[${s(d.svcPriority)}] ${s(d.svcTargetName)}${d.svcParams ? ` ${formatSvcParams(d.svcParams)}` : ''}`;
  }
  // DNSKEY: 标志 协议 算法 公钥
  if (d.publicKey != null) {
    return trunc(`${s(d.flags)} ${s(d.protocol)} ${s(d.algorithm)} ${s(d.publicKey)}`);
  }
  // RRSIG: 覆盖类型 算法 标签数 原始TTL 密钥标签 签名者 签名
  if (d.typeCovered != null) {
    return trunc(
      `${s(d.typeCovered)} ${s(d.algorithm)} ${s(d.labels)} ${s(d.originalTtl)} ${s(
        d.keyTag
      )} ${s(d.signersName)} ${s(d.signature)}`
    );
  }
  // NSEC: 下一个域名 类型列表
  if (d.nextDomainName != null) {
    const types = Array.isArray(d.types) ? (d.types as string[]).join(' ') : '';
    return trunc(`${s(d.nextDomainName)} ${types}`.trim());
  }
  // NSEC3: 哈希算法 标志 迭代次数 盐 下一个哈希所有者 类型列表
  if (d.hashAlgorithm != null && d.nextHashedOwnerName != null) {
    const types = Array.isArray(d.types) ? (d.types as string[]).join(' ') : '';
    return trunc(
      `${s(d.hashAlgorithm)} ${s(d.flags)} ${s(d.iterations)} ${s(d.salt)} ${s(
        d.nextHashedOwnerName
      )} ${types}`.trim()
    );
  }
  // NSEC3PARAM: 哈希算法 标志 迭代次数 盐
  if (d.hashAlgorithm != null) {
    return trunc(`${s(d.hashAlgorithm)} ${s(d.flags)} ${s(d.iterations)} ${s(d.salt)}`.trim());
  }
  // FWD
  if (d.forwarder) return s(d.forwarder);
  // APP
  if (d.classPath) return s(d.classPath);
  // 未知类型回退
  if (d.dataType != null && d.data != null) {
    // 负缓存/特殊缓存记录（如 DnsSpecialCacheRecordData）：data 形如
    // "NegativeCache: NoError; Synthesized: ...; <SOA 记录>"，
    // 数据列只显示关键摘要，SOA 等细节留在展开区查看
    if (truncate && d.dataType === 'DnsSpecialCacheRecordData' && typeof d.data === 'string') {
      const summary = d.data.split(';')[0]?.trim();
      if (summary) return summary;
    }
    return `${s(d.dataType)}: ${s(d.data)}`;
  }
  return JSON.stringify(d);
}

interface RecordField {
  label: string;
  value: string;
}

// 字段名 → zoneTree.fieldLabels 下的 i18n 键；未列出的字段名按驼峰拆分显示
const RDATA_FIELD_LABEL_KEYS: Record<string, string> = {
  ipAddress: 'ipAddress',
  ipv6Address: 'ipv6Address',
  nameServer: 'nameServer',
  nameServerIdn: 'nameServerIdn',
  cname: 'cname',
  cnameIdn: 'cnameIdn',
  ptrName: 'ptrName',
  aname: 'aname',
  dname: 'dname',
  preference: 'preference',
  exchange: 'exchange',
  priority: 'priority',
  weight: 'weight',
  port: 'port',
  target: 'target',
  value: 'value',
  dataType: 'dataType',
  data: 'data',
  forwarder: 'forwarder',
  classPath: 'classPath',
  appName: 'appName',
  recordData: 'recordData',
  protocol: 'protocol',
  flags: 'flags',
  tag: 'tag',
  uri: 'uri',
  order: 'order',
  services: 'services',
  regexp: 'regexp',
  replacement: 'replacement',
  keyTag: 'keyTag',
  algorithm: 'algorithm',
  digestType: 'digestType',
  digest: 'digest',
  salt: 'salt',
  iterations: 'iterations',
  totalQueries: 'totalQueries',
  answerRate: 'answerRate',
  smoothedRoundTripTime: 'smoothedRoundTripTime',
  datagramSize: 'datagramSize',
  roundTripTime: 'roundTripTime',
  comments: 'comments',
  lastUsedOn: 'lastUsedOn',
  lastModified: 'lastModified',
  dnssecStatus: 'dnssecStatus',
  eDnsClientSubnet: 'eDnsClientSubnet',
  glueRecords: 'glueRecords',
  dnssecRecords: 'dnssecRecords',
  responseMetadata: 'responseMetadata',
  nameServerMetadata: 'nameServerMetadata',
  primaryNameServer: 'primaryNameServer',
  responsiblePerson: 'responsiblePerson',
  serial: 'serial',
  refresh: 'refresh',
  retry: 'retry',
  expire: 'expire',
  minimum: 'minimum',
  mailbox: 'mailbox',
  txtDomain: 'txtDomain',
  glue: 'glue',
  naptrOrder: 'naptrOrder',
  naptrPreference: 'naptrPreference',
  naptrFlags: 'naptrFlags',
  naptrServices: 'naptrServices',
  naptrRegexp: 'naptrRegexp',
  naptrReplacement: 'naptrReplacement',
  sshfpAlgorithm: 'sshfpAlgorithm',
  sshfpFingerprintType: 'sshfpFingerprintType',
  sshfpFingerprint: 'sshfpFingerprint',
  tlsaCertificateUsage: 'tlsaCertificateUsage',
  tlsaSelector: 'tlsaSelector',
  tlsaMatchingType: 'tlsaMatchingType',
  tlsaCertificateAssociationData: 'tlsaCertificateAssociationData',
  svcPriority: 'svcPriority',
  svcTargetName: 'svcTargetName',
  svcParams: 'svcParams',
  uriPriority: 'uriPriority',
  uriWeight: 'uriWeight',
  publicKey: 'publicKey',
  computedKeyTag: 'computedKeyTag',
  dnsKeyState: 'dnsKeyState',
  dnsKeyStateReadyBy: 'dnsKeyStateReadyBy',
  dnsKeyStateActiveBy: 'dnsKeyStateActiveBy',
  typeCovered: 'typeCovered',
  algorithmNumber: 'algorithmNumber',
  labels: 'labels',
  originalTtl: 'originalTtl',
  signatureExpiration: 'signatureExpiration',
  signatureInception: 'signatureInception',
  signersName: 'signersName',
  signature: 'signature',
  nextDomainName: 'nextDomainName',
  nextHashedOwnerName: 'nextHashedOwnerName',
  hashAlgorithm: 'hashAlgorithm',
  types: 'types',
};

function prettifyFieldKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

// 时间值本地化显示；无效时间或 .NET DateTime.MinValue（0001-01-01）返回 undefined
function formatTimestamp(value: unknown): string | undefined {
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return undefined;
  if (d.getFullYear() < 1000) return undefined;
  return d.toLocaleString();
}

// 把 rData（含顶层附加字段）平铺为键值对列表；嵌套对象递归展开，数组逐行展示。
// 数字字段存在对应的 xxxString 友好值（如 refreshString: "15m"）时，用友好值替换并隐藏冗余字段。
function flattenRecordFields(record: ZoneBrowserRecord, t: TFunction): RecordField[] {
  const fields: RecordField[] = [];

  const pushField = (key: string, value: unknown) => {
    const label = key
      .split('.')
      .map(part => {
        const i18nKey = RDATA_FIELD_LABEL_KEYS[part];
        return i18nKey
          ? t(`zoneTree.fieldLabels.${i18nKey}`, { defaultValue: prettifyFieldKey(part) })
          : prettifyFieldKey(part);
      })
      .join('. ');
    // RRSIG 的签名时间戳做本地化显示
    let display = value;
    if (
      (key === 'signatureExpiration' || key === 'signatureInception') &&
      typeof display === 'string'
    ) {
      display = formatTimestamp(display) ?? display;
    }
    const text = Array.isArray(display) ? (display as unknown[]).join('\n') : String(display ?? '');
    fields.push({ label, value: text });
  };

  const walk = (obj: Record<string, unknown>, prefix: string) => {
    const entries = Object.entries(obj);
    const friendlyValues = new Map<string, string>();
    for (const [key, value] of entries) {
      if (key.endsWith('String') && typeof value === 'string') {
        friendlyValues.set(key.slice(0, -'String'.length), value);
      }
    }
    for (const [key, value] of entries) {
      if (key.endsWith('String')) continue;
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, fullKey);
      } else {
        pushField(fullKey, friendlyValues.has(key) ? friendlyValues.get(key) : value);
      }
    }
  };

  if (record.rData) walk(record.rData, '');

  // 记录顶层附加信息（缓存命中统计、DNSSEC、glue 等）
  const extras: [string, unknown][] = [
    ['comments', record.comments],
    ['lastUsedOn', record.lastUsedOn ? formatTimestamp(record.lastUsedOn) : undefined],
    ['lastModified', record.lastModified ? formatTimestamp(record.lastModified) : undefined],
    ['dnssecStatus', record.dnssecStatus],
    ['eDnsClientSubnet', record.eDnsClientSubnet],
    ['glueRecords', record.glueRecords],
    ['dnssecRecords', record.dnssecRecords],
  ];
  for (const [key, value] of extras) {
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);
    if (isEmpty) {
      // 时间字段：JSON 数据中不存在该字段时隐藏；字段存在但时间无效时保留标签、值留白
      if (key === 'lastUsedOn' && record.lastUsedOn !== undefined) {
        pushField(key, value);
      } else if (key === 'lastModified' && record.lastModified !== undefined) {
        pushField(key, value);
      }
      continue;
    }
    pushField(key, value);
  }

  return fields;
}

export function ZoneBrowser({ apiBase }: { apiBase: ApiBase }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [colorMode] = useAtom(colorModeAtom);
  const isDark = resolveColorMode(colorMode) === 'dark';
  const dotBadgeStyle = {
    ...DOT_BADGE_STYLE,
    ...(isDark ? { border: '1px solid var(--mantine-color-dark-4)' } : {}),
  };

  const isZones = apiBase !== 'cache';

  // 浏览状态以路由 search 为唯一数据源，支持前进/后退与分享链接
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Partial<ZoneBrowserSearch>;
  const currentDomain = search.domain ?? '';

  const [input, setInput] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [confirmAction, setConfirmAction] = useState<'delete' | 'flush' | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  const updateSearch = useCallback(
    (next: Partial<ZoneBrowserSearch>) => {
      // 该组件被 cache/allowed/blocked 三个路由复用（search schema 相同），
      // 无 from 的 useNavigate 无法推断宿主路由的 search 类型，这里做类型收窄
      const search = {
        domain: next.domain !== undefined ? next.domain || undefined : currentDomain || undefined,
      };
      navigate({ search: search as never });
    },
    [navigate, currentDomain]
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['zone-browser', apiBase, currentDomain],
    queryFn: async () => {
      const res = await apiClient.get<ZoneBrowserResponse>(
        `/${apiBase}/list?domain=${encodeURIComponent(currentDomain)}`
      );
      if (res.status !== 'ok' || !res.response) {
        throw new Error(res.errorMessage || t('zoneTree.browseFailed'));
      }
      return res.response;
    },
    staleTime: 10_000,
  });

  const records = data?.records ?? EMPTY_RECORDS;
  const zones = data?.zones ?? EMPTY_ZONES;
  const displayDomain = data?.domainIdn || data?.domain || '';
  const hasStatusColumn = records.some(r => r.disabled !== undefined);

  const flushMessages = {
    cache: {
      confirm: t('zoneTree.flushCacheConfirm'),
      success: t('zoneTree.flushedCache'),
      fail: t('zoneTree.flushCacheFailed'),
    },
    allowed: {
      confirm: t('zoneTree.flushAllowedConfirm'),
      success: t('zoneTree.flushedAllowed'),
      fail: t('zoneTree.flushAllowedFailed'),
    },
    blocked: {
      confirm: t('zoneTree.flushBlockedConfirm'),
      success: t('zoneTree.flushedBlocked'),
      fail: t('zoneTree.flushBlockedFailed'),
    },
  };

  // 面包屑：根 → 各级父域 → 当前域
  const crumbs = useMemo(() => {
    const items: { title: string; onClick?: () => void }[] = [
      {
        title: t('zoneTree.root'),
        onClick: () => updateSearch({ domain: '' }),
      },
    ];
    if (currentDomain) {
      const parts = currentDomain.split('.');
      for (let i = parts.length - 1; i >= 0; i--) {
        // 每级用块级常量绑定，避免闭包捕获循环结束后变化的 acc
        const level = parts.slice(i).join('.');
        if (i === 0) {
          items.push({ title: displayDomain || level });
        } else {
          items.push({
            title: level,
            onClick: () => updateSearch({ domain: level }),
          });
        }
      }
    }
    return items;
  }, [currentDomain, displayDomain, t, updateSearch]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['zone-browser', apiBase] });

  const browseInput = () => {
    const v = input.trim();
    setInput(v);
    updateSearch({ domain: v });
  };

  const handleAdd = async () => {
    const domain = input.trim();
    if (!domain) {
      error(t('common.error'), t('zoneTree.domainRequired'));
      return;
    }
    try {
      const res = await apiClient.post(`/${apiBase}/add`, { domain });
      if (res.status !== 'ok') throw new Error(res.errorMessage || 'Failed');
      success(t('common.success'), t('zoneTree.added', { domain }));
      setInput('');
      // IP 地址会自动转为反向区域，跳回根目录查看
      updateSearch({ domain: /^(\d{1,3}\.){3}\d{1,3}$/.test(domain) ? '' : domain });
      await invalidate();
    } catch {
      error(t('common.error'), t('zoneTree.addFailed'));
    }
  };

  const handleDelete = async () => {
    if (!currentDomain) return;
    try {
      const res = await apiClient.post(`/${apiBase}/delete`, { domain: currentDomain });
      if (res.status !== 'ok') throw new Error(res.errorMessage || 'Failed');
      success(t('common.success'), t('zoneTree.deleted'));
      updateSearch({ domain: getParentDomain(currentDomain) });
      setConfirmAction(null);
      await invalidate();
    } catch {
      error(t('common.error'), t('zoneTree.deleteFailed'));
    }
  };

  const handleFlush = async () => {
    try {
      const res = await apiClient.post(`/${apiBase}/flush`, {});
      if (res.status !== 'ok') throw new Error(res.errorMessage || 'Failed');
      success(t('common.success'), flushMessages[apiBase].success);
      updateSearch({ domain: '' });
      setConfirmAction(null);
      await invalidate();
    } catch {
      error(t('common.error'), flushMessages[apiBase].fail);
    }
  };

  const handleImport = async () => {
    try {
      const key = apiBase === 'allowed' ? 'allowedZones' : 'blockedZones';
      const res = await apiClient.post(`/${apiBase}/import`, { [key]: importText });
      if (res.status !== 'ok') throw new Error(res.errorMessage || 'Failed');
      success(t('common.success'), t('zoneTree.imported'));
      setImportOpen(false);
      setImportText('');
      await invalidate();
    } catch {
      error(t('common.error'), t('zoneTree.importFailed'));
    }
  };

  const handleExport = () => {
    const token = apiClient.getToken();
    if (token) {
      window.open(`/api/${apiBase}/export?token=${encodeURIComponent(token)}`, '_blank');
      success(t('common.success'), t('zoneTree.exported'));
    }
  };

  return (
    <Stack>
      <Paper shadow="sm" p="md" withBorder>
        <Group justify="space-between" mb="md" wrap="wrap">
          <Breadcrumbs separator="›" separatorMargin="sm">
            {crumbs.map((crumb, i) =>
              crumb.onClick ? (
                <Anchor key={i} component="button" size="sm" onClick={crumb.onClick}>
                  {crumb.title}
                </Anchor>
              ) : (
                <Text key={i} size="sm" c="dimmed">
                  {crumb.title}
                </Text>
              )
            )}
          </Breadcrumbs>
          <Group gap="xs">
            <Tooltip label={t('common.refresh')}>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => refetch()}
                loading={isLoading}
              >
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Button
              size="xs"
              variant="default"
              color="red"
              leftSection={<IconX size={14} />}
              onClick={() => setConfirmAction('flush')}
            >
              {t('zoneTree.flush')}
            </Button>
          </Group>
        </Group>

        <Group align="end" wrap="wrap">
          <TextInput
            label={t('zoneTree.domain')}
            placeholder={t('zoneTree.browsePlaceholder')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') browseInput();
            }}
            w={320}
          />
          <Button onClick={browseInput}>{t('zoneTree.browse')}</Button>
          {isZones && (
            <Button
              leftSection={<IconPlus size={14} />}
              color={apiBase === 'allowed' ? 'teal' : 'orange'}
              onClick={handleAdd}
            >
              {apiBase === 'allowed' ? t('zoneTree.allow') : t('zoneTree.block')}
            </Button>
          )}
          {isZones && (
            <Button
              variant="default"
              leftSection={<IconUpload size={14} />}
              onClick={() => setImportOpen(true)}
            >
              {t('common.import')}
            </Button>
          )}
          {isZones && (
            <Button
              variant="default"
              leftSection={<IconDownload size={14} />}
              onClick={handleExport}
            >
              {t('common.export')}
            </Button>
          )}
          {currentDomain !== '' && (
            <Button
              color="red"
              variant="light"
              leftSection={<IconTrash size={14} />}
              onClick={() => setConfirmAction('delete')}
            >
              {t('common.delete')}
            </Button>
          )}
        </Group>
      </Paper>

      <Group align="start" gap="md">
        <Paper shadow="sm" p="md" withBorder style={{ minWidth: 240 }}>
          <Text fw={600} size="sm" mb="sm">
            {t('zoneTree.subDomains')}
          </Text>
          {zones.length === 0 ? (
            <Text c="dimmed" size="sm">
              {t('zoneTree.noSubDomains')}
            </Text>
          ) : (
            <Stack gap={4}>
              {zones.map(zone => (
                <Button
                  key={zone}
                  variant="subtle"
                  size="xs"
                  justify="flex-start"
                  fullWidth
                  rightSection={<IconChevronRight size={12} />}
                  onClick={() => updateSearch({ domain: zone })}
                >
                  {zone}
                </Button>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper shadow="sm" p="md" withBorder style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" mb="md">
            <Text fw={600}>
              {displayDomain || t('zoneTree.root')}
              <Text span size="sm" c="dimmed" ml={6}>
                {t('zoneTree.recordCount', { count: records.length })}
              </Text>
            </Text>
            <SegmentedControl
              size="xs"
              value={viewMode}
              onChange={v => setViewMode((v || 'table') as 'table' | 'json')}
              data={[
                { value: 'table', label: t('common.table') },
                { value: 'json', label: t('common.json') },
              ]}
            />
          </Group>

          {viewMode === 'json' ? (
            isLoading ? (
              <Stack gap="sm">
                <Skeleton height={36} />
                <Skeleton height={36} />
                <Skeleton height={36} />
              </Stack>
            ) : (
              <CodeMirror
                value={JSON.stringify(records, null, 2)}
                readOnly
                height="600px"
                extensions={[json(), codeMirrorFontTheme, foldGutterExtension]}
                theme={isDark ? oneDark : codeMirrorLightTheme}
                basicSetup={{ lineNumbers: true, foldGutter: false }}
              />
            )
          ) : isLoading ? (
            <Stack gap="sm">
              <Skeleton height={36} />
              <Skeleton height={36} />
              <Skeleton height={36} />
            </Stack>
          ) : isError ? (
            <Center py="xl">
              <Stack align="center">
                <Text c="dimmed">{t('zoneTree.browseFailed')}</Text>
                <Button variant="subtle" onClick={() => refetch()}>
                  {t('error.retry')}
                </Button>
              </Stack>
            </Center>
          ) : records.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">{t('zones.noRecords')}</Text>
            </Center>
          ) : (
            <>
              <Table striped highlightOnHover layout="fixed">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 110 }}>{t('zones.recordType')}</Table.Th>
                    <Table.Th style={{ width: 240 }}>{t('zones.recordName')}</Table.Th>
                    <Table.Th style={{ width: 180 }}>{t('zones.recordTTL')}</Table.Th>
                    <Table.Th>{t('zones.recordData')}</Table.Th>
                    {hasStatusColumn && (
                      <Table.Th style={{ width: 100 }}>{t('zones.recordStatus')}</Table.Th>
                    )}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {records.map((record, idx) => {
                    const rowKey = `${record.name}-${record.type}-${idx}`;
                    const isExpanded = expandedRow === rowKey;
                    const recordFields = isExpanded ? flattenRecordFields(record, t) : EMPTY_FIELDS;
                    return (
                      <Fragment key={rowKey}>
                        <Table.Tr>
                          <Table.Td>
                            <Badge
                              color={RECORD_TYPE_COLORS[record.type] || 'gray'}
                              variant="dot"
                              size="sm"
                              tt="none"
                              style={dotBadgeStyle}
                            >
                              {record.type}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{record.nameIdn || record.name}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{record.ttlString || record.ttl}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={6} wrap="nowrap" align="flex-start">
                              <Box style={{ flex: 1, minWidth: 0 }}>
                                <Text
                                  size="sm"
                                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                                >
                                  {formatRecordData(record, true)}
                                </Text>
                              </Box>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="gray"
                                aria-label={
                                  isExpanded ? t('common.close') : t('common.viewDetails')
                                }
                                onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                              >
                                {isExpanded ? (
                                  <IconChevronUp size={14} />
                                ) : (
                                  <IconChevronDown size={14} />
                                )}
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                          {hasStatusColumn && (
                            <Table.Td>
                              {record.disabled ? (
                                <Badge
                                  color="gray"
                                  size="sm"
                                  variant="dot"
                                  tt="none"
                                  style={dotBadgeStyle}
                                >
                                  {t('common.disabled')}
                                </Badge>
                              ) : (
                                <Badge
                                  color="green"
                                  size="sm"
                                  variant="dot"
                                  tt="none"
                                  style={dotBadgeStyle}
                                >
                                  {t('common.enabled')}
                                </Badge>
                              )}
                            </Table.Td>
                          )}
                        </Table.Tr>
                        {isExpanded && (
                          <Table.Tr>
                            <Table.Td
                              colSpan={hasStatusColumn ? 5 : 4}
                              style={{ backgroundColor: 'var(--mantine-color-body)' }}
                            >
                              <Stack gap="md">
                                {/* 记录数据：标准 zone 文件格式，等宽代码块便于复制 */}
                                <Box
                                  p="sm"
                                  style={{
                                    fontFamily: 'var(--mantine-font-family-monospace)',
                                    fontSize: 'var(--mantine-font-size-sm)',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                    backgroundColor: 'var(--mantine-color-default-hover)',
                                    border: '1px solid var(--mantine-color-default-border)',
                                    borderRadius: 'var(--mantine-radius-md)',
                                  }}
                                >
                                  {formatRecordData(record)}
                                </Box>
                                {recordFields.length > 0 && (
                                  <>
                                    <Divider />
                                    <DataList size="sm" labelWidth={200} withDivider>
                                      {recordFields.map(field => (
                                        <DataList.Item key={field.label}>
                                          <DataList.ItemLabel c="dimmed">
                                            {field.label}
                                          </DataList.ItemLabel>
                                          <DataList.ItemValue>
                                            <Text
                                              size="sm"
                                              style={{
                                                fontFamily: 'var(--mantine-font-family-monospace)',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-all',
                                              }}
                                            >
                                              {field.value}
                                            </Text>
                                          </DataList.ItemValue>
                                        </DataList.Item>
                                      ))}
                                    </DataList>
                                  </>
                                )}
                              </Stack>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Fragment>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </>
          )}
        </Paper>
      </Group>

      {/* 导入域名 */}
      <Modal
        opened={importOpen}
        onClose={() => setImportOpen(false)}
        title={t('zoneTree.importDomains')}
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            {t('zoneTree.importHint')}
          </Text>
          <Textarea
            placeholder={t('zoneTree.oneDomainPerLine')}
            value={importText}
            onChange={e => setImportText(e.target.value)}
            minRows={8}
            autosize
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setImportOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleImport} disabled={!importText.trim()}>
              {t('common.import')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 删除当前域 / 清空确认 */}
      <Modal
        opened={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={t('common.confirm')}
        centered
      >
        <Text mb="lg">
          {confirmAction === 'flush'
            ? flushMessages[apiBase].confirm
            : t('zoneTree.deleteConfirm', { domain: currentDomain })}
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setConfirmAction(null)}>
            {t('common.cancel')}
          </Button>
          <Button color="red" onClick={confirmAction === 'flush' ? handleFlush : handleDelete}>
            {confirmAction === 'flush' ? t('zoneTree.flush') : t('common.delete')}
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
