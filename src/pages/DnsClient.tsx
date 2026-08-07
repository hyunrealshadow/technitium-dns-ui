import { useEffect, useState, type CSSProperties } from 'react';
import {
  Accordion,
  Autocomplete,
  Badge,
  Button,
  Checkbox,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  codeMirrorFontTheme,
  codeMirrorLightTheme,
  foldGutterExtension,
} from '../utils/codeMirror';
import { getRcodeColor } from '../utils/rcode';
import { useTranslation } from 'react-i18next';
import { useSearch } from '@tanstack/react-router';
import { useAtom } from 'jotai';
import { success, error, warning } from '../components/notifications';
import { apiClient } from '../api/client';
import { colorModeAtom, resolveColorMode } from '../store/theme';

const DNS_RECORD_TYPES = [
  'A',
  'NS',
  'CNAME',
  'SOA',
  'PTR',
  'MX',
  'TXT',
  'RP',
  'AAAA',
  'SRV',
  'NAPTR',
  'DNAME',
  'DS',
  'SSHFP',
  'RRSIG',
  'NSEC',
  'DNSKEY',
  'NSEC3',
  'NSEC3PARAM',
  'TLSA',
  'ZONEMD',
  'SVCB',
  'HTTPS',
  'URI',
  'CAA',
  'ANY',
  'AXFR',
  'ANAME',
];

const DNS_PROTOCOLS = ['UDP', 'TCP', 'TLS', 'HTTPS', 'QUIC'];

interface ServerListItem {
  name?: string;
  addresses: string[];
}

interface DnsMetadata {
  NameServer?: string;
  Protocol?: string;
  DatagramSize?: string;
  RoundTripTime?: string;
}

interface DnsResponseRecord {
  Name: string;
  NameIDN?: string;
  Type: string;
  Class?: string;
  TTL?: string;
  RDLENGTH?: string;
  RDATA?: Record<string, unknown>;
  DnssecStatus?: string;
}

interface DnsQueryResult {
  Metadata?: DnsMetadata;
  EDNS?: Record<string, unknown>;
  RCODE?: string;
  AuthoritativeAnswer?: boolean;
  Truncation?: boolean;
  RecursionAvailable?: boolean;
  AuthenticData?: boolean;
  Question?: { Name: string; NameIDN?: string; Type: string; Class: string }[];
  Answer?: DnsResponseRecord[];
  Authority?: DnsResponseRecord[];
  Additional?: DnsResponseRecord[];
}

interface ResolveResponse {
  result: DnsQueryResult;
  rawResponses?: Record<string, unknown>[];
  warningMessage?: string;
}

// 表格内 dot Badge 固定 body 背景，避免行 hover 高亮时 badge 融入行背景
const DOT_BADGE_STYLE = { backgroundColor: 'var(--mantine-color-body)' };

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
  OPT: 'gray',
};

// 按 DnsDatagram 序列化的 RDATA 字段名格式化（与区域接口的字段名不同）
function formatRData(rdata: Record<string, unknown> | undefined): string {
  if (!rdata) return '';
  const s = (v: unknown) => String(v ?? '');
  if (rdata.IPAddress) return s(rdata.IPAddress);
  if (rdata.NameServer) return s(rdata.NameServerIDN || rdata.NameServer);
  if (rdata.Domain) return s(rdata.DomainIDN || rdata.Domain);
  if (rdata.Preference != null && rdata.Exchange)
    return `[${s(rdata.Preference)}] ${s(rdata.ExchangeIDN || rdata.Exchange)}`;
  if (rdata.Priority != null && rdata.Target)
    return `[${s(rdata.Priority)}|${s(rdata.Weight ?? 0)}|${s(rdata.Port ?? 0)}] ${s(
      rdata.TargetIDN || rdata.Target
    )}`;
  if (rdata.PrimaryNameServer) {
    return `[${s(rdata.PrimaryNameServerIDN || rdata.PrimaryNameServer)}] ${s(
      rdata.ResponsiblePerson
    )} (${s(rdata.Serial)} ${s(rdata.Refresh)} ${s(rdata.Retry)} ${s(rdata.Expire)} ${s(
      rdata.Minimum
    )})`;
  }
  if (rdata.Mailbox) return `${s(rdata.Mailbox)} ${s(rdata.TxtDomain ?? '')}`.trim();
  if (rdata.Order != null)
    return `${s(rdata.Order)} ${s(rdata.Preference)} "${s(rdata.Flags)}" "${s(
      rdata.Services
    )}" "${s(rdata.Regexp)}" ${s(rdata.Replacement)}`;
  if (rdata.Text != null) {
    if (Array.isArray(rdata.CharacterStrings))
      return (rdata.CharacterStrings as string[]).join(' ');
    return s(rdata.Text);
  }
  if (rdata.Algorithm != null && rdata.Fingerprint != null)
    return `${s(rdata.Algorithm)} ${s(rdata.FingerprintType)} ${s(rdata.Fingerprint)}`;
  if (rdata.CertificateUsage != null)
    return `${s(rdata.CertificateUsage)} ${s(rdata.Selector)} ${s(
      rdata.MatchingType
    )} ${s(rdata.CertificateAssociationData)}`;
  if (rdata.Flags != null && rdata.Tag != null)
    return `${s(rdata.Flags)} ${s(rdata.Tag)} "${s(rdata.Value)}"`;
  return JSON.stringify(rdata);
}

// OPT 记录（EDNS）的数据列：从 result.EDNS 取负载/版本等信息，RDATA 只有 Options 数组
function formatOptData(
  edns: Record<string, unknown> | undefined,
  rdata: Record<string, unknown> | undefined
): string {
  const parts: string[] = [];
  if (edns) {
    if (edns.UdpPayloadSize != null) parts.push(`udp: ${edns.UdpPayloadSize}`);
    if (edns.Version != null) parts.push(`version: ${edns.Version}`);
    if (edns.Flags) parts.push(`flags: ${edns.Flags}`);
  }
  const options = Array.isArray(rdata?.Options) ? (rdata.Options as unknown[]) : [];
  if (options.length > 0) parts.push(`options: ${options.length}`);
  return parts.length > 0 ? parts.join(', ') : 'EDNS';
}

function DnsRecordTable({
  records,
  dotBadgeStyle,
  edns,
}: {
  records: DnsResponseRecord[];
  dotBadgeStyle: CSSProperties;
  edns?: Record<string, unknown>;
}) {
  const { t } = useTranslation();
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: 110 }}>{t('zones.recordType')}</Table.Th>
          <Table.Th>{t('zones.recordName')}</Table.Th>
          <Table.Th style={{ width: 180 }}>{t('zones.recordTTL')}</Table.Th>
          <Table.Th>{t('zones.recordData')}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {records.map((record, i) => (
          <Table.Tr key={`${record.Name}-${record.Type}-${i}`}>
            <Table.Td>
              <Badge
                color={RECORD_TYPE_COLORS[record.Type] || 'gray'}
                variant="dot"
                size="sm"
                tt="none"
                style={dotBadgeStyle}
              >
                {record.Type}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Text size="sm" style={{ maxWidth: 280 }} truncate="end">
                {record.NameIDN || record.Name}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{record.TTL}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm" style={{ maxWidth: 400 }} truncate="end">
                {record.Type === 'OPT'
                  ? formatOptData(edns, record.RDATA)
                  : formatRData(record.RDATA)}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

export function DnsClientPage() {
  const { t } = useTranslation();
  const [colorMode] = useAtom(colorModeAtom);
  const isDark = resolveColorMode(colorMode) === 'dark';
  const dotBadgeStyle = {
    ...DOT_BADGE_STYLE,
    ...(isDark ? { border: '1px solid var(--mantine-color-dark-4)' } : {}),
  };
  const search = useSearch({ from: '/_authenticated/dns-client' });
  const [serverOptions, setServerOptions] = useState<string[]>([]);
  const [server, setServer] = useState('This Server {this-server}');
  const [domain, setDomain] = useState(search.domain || '');
  const [type, setType] = useState(search.type || 'A');
  const [protocol, setProtocol] = useState('UDP');
  const [eDnsClientSubnet, setEDnsClientSubnet] = useState('');
  const [dnssecValidation, setDnssecValidation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DnsQueryResult | null>(null);
  const [rawResponses, setRawResponses] = useState<Record<string, unknown>[]>([]);
  const [viewMode, setViewMode] = useState<'result' | 'json'>('result');

  useEffect(() => {
    async function loadServerList() {
      try {
        let response = await fetch('/json/dnsclient-server-list-custom.json');
        if (!response.ok) {
          response = await fetch('/json/dnsclient-server-list-builtin.json');
        }
        const list: ServerListItem[] = await response.json();
        const options = ['This Server {this-server}'];
        for (const item of list) {
          for (const addr of item.addresses) {
            options.push(item.name ? `${item.name} {${addr}}` : addr);
          }
        }
        setServerOptions(options);
      } catch {
        setServerOptions(['This Server {this-server}']);
      }
    }
    loadServerList();
  }, []);

  const extractServer = (value: string): string => {
    let v = value;
    const i = v.indexOf('{');
    if (i > -1) {
      const j = v.lastIndexOf('}');
      v = v.substring(i + 1, j);
    }
    return v.trim();
  };

  const sanitizeDomain = (value: string): string => {
    let v = value;
    const i = v.indexOf('://');
    if (i > -1) {
      let j = v.indexOf(':', i + 3);
      if (j < 0) j = v.indexOf('/', i + 3);
      v = j > -1 ? v.substring(i + 3, j) : v.substring(i + 3);
    }
    return v;
  };

  const handleResolve = async (importRecords: boolean) => {
    const serverValue = extractServer(server);
    if (!serverValue) {
      error(t('common.error'), t('dnsClient.nameServerRequired'));
      return;
    }
    const domainValue = sanitizeDomain(domain);
    if (!domainValue) {
      error(t('common.error'), t('dnsClient.domainRequired'));
      return;
    }

    if (importRecords) {
      if (!window.confirm(t('dnsClient.importConfirm', { domain: domainValue }))) return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get<ResolveResponse>(
        `/dnsClient/resolve?server=${encodeURIComponent(serverValue)}&domain=${encodeURIComponent(
          domainValue
        )}&type=${type}&protocol=${protocol}&dnssec=${dnssecValidation}&eDnsClientSubnet=${encodeURIComponent(
          eDnsClientSubnet
        )}${importRecords ? '&import=true' : ''}`
      );
      if (response.status !== 'ok' || !response.response) {
        throw new Error(response.errorMessage || t('dnsClient.resolveFailed'));
      }
      setResult(response.response.result);
      setRawResponses(response.response.rawResponses || []);
      if (response.response.warningMessage) {
        warning('Warning!', response.response.warningMessage);
      } else if (importRecords) {
        success(t('common.success'), t('dnsClient.recordsImported'));
      }
      if (server && !serverOptions.includes(server)) {
        setServerOptions(prev => [server, ...prev]);
      }
    } catch (e) {
      error(t('common.error'), e instanceof Error ? e.message : t('dnsClient.resolveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack>
      <Title order={2}>{t('nav.dnsClient')}</Title>

      <Paper shadow="sm" p="md" withBorder>
        <Group gap="md" align="end" wrap="wrap">
          <Autocomplete
            label={t('dnsClient.server')}
            data={serverOptions}
            value={server}
            onChange={v => {
              setServer(v);
              if (v.includes('QUIC')) setProtocol('QUIC');
              else if (v.includes('TLS') || v.includes(':853')) setProtocol('TLS');
              else if (v.includes('HTTPS') || v.includes('http://') || v.includes('https://'))
                setProtocol('HTTPS');
              else if (protocol !== 'UDP' && protocol !== 'TCP') setProtocol('UDP');
              if (v && !serverOptions.includes(v)) {
                setServerOptions(prev => [...prev, v]);
              }
            }}
            w={320}
          />
          <TextInput
            label={t('dnsClient.domain')}
            placeholder="example.com"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            w={300}
          />
          <Select
            label={t('dnsClient.type')}
            data={DNS_RECORD_TYPES}
            value={type}
            onChange={v => setType(v || 'A')}
            w={120}
            allowDeselect={false}
          />
          <Select
            label={t('dnsClient.dnsOver')}
            data={DNS_PROTOCOLS}
            value={protocol}
            onChange={v => setProtocol(v || 'UDP')}
            w={110}
            allowDeselect={false}
          />
          <TextInput
            label={t('dnsClient.ednsClientSubnet')}
            value={eDnsClientSubnet}
            onChange={e => setEDnsClientSubnet(e.target.value)}
            w={240}
          />
          <Checkbox
            label={t('dnsClient.enableDnssecValidation')}
            checked={dnssecValidation}
            onChange={e => setDnssecValidation(e.currentTarget.checked)}
            mb={8}
          />
        </Group>
        <Group mt="sm">
          <Button onClick={() => handleResolve(false)} loading={loading}>
            {t('dnsClient.resolve')}
          </Button>
          <Button variant="default" onClick={() => handleResolve(true)} loading={loading}>
            {t('common.import')}
          </Button>
        </Group>
      </Paper>

      {result && (
        <Paper shadow="sm" p="md" withBorder>
          <Title order={5} mb="sm">
            {t('dnsClient.response')}
          </Title>

          <Tabs
            value={viewMode}
            onChange={v => setViewMode((v || 'result') as 'result' | 'json')}
            mb="md"
          >
            <Tabs.List>
              <Tabs.Tab value="result">{t('dnsClient.result')}</Tabs.Tab>
              <Tabs.Tab value="json">{t('common.json')}</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          {viewMode === 'json' ? (
            <CodeMirror
              value={JSON.stringify(result, null, 2)}
              readOnly
              height="600px"
              extensions={[json(), codeMirrorFontTheme, foldGutterExtension]}
              theme={isDark ? oneDark : codeMirrorLightTheme}
              basicSetup={{ lineNumbers: true, foldGutter: false }}
            />
          ) : (
            <>
              {/* 状态摘要 */}
              <Group gap="xs" mb="md" wrap="wrap">
                <Badge variant="light" color={getRcodeColor(result.RCODE)} tt="none">
                  {t('dnsClient.rcode')}:{' '}
                  {result.RCODE
                    ? t(`common.rcodes.${result.RCODE}`, { defaultValue: result.RCODE })
                    : '-'}
                </Badge>
                {result.Metadata?.NameServer && (
                  <Badge variant="light" color="blue" tt="none">
                    {result.Metadata.NameServer}
                  </Badge>
                )}
                {result.Metadata?.Protocol && (
                  <Badge variant="light" color="gray" tt="none">
                    {result.Metadata.Protocol}
                  </Badge>
                )}
                {result.Metadata?.RoundTripTime && (
                  <Badge variant="light" color="teal" tt="none">
                    {t('dnsClient.roundTripTime')}: {result.Metadata.RoundTripTime}
                  </Badge>
                )}
                {result.Metadata?.DatagramSize && (
                  <Badge variant="light" color="gray" tt="none">
                    {t('dnsClient.datagramSize')}: {result.Metadata.DatagramSize}
                  </Badge>
                )}
                {result.AuthoritativeAnswer && (
                  <Badge variant="light" color="indigo" tt="none">
                    {t('dnsClient.authoritative')}
                  </Badge>
                )}
                {result.RecursionAvailable && (
                  <Badge variant="light" color="indigo" tt="none">
                    {t('dnsClient.recursionAvailable')}
                  </Badge>
                )}
                {result.AuthenticData && (
                  <Badge variant="light" color="lime" tt="none">
                    {t('dnsClient.authenticData')}
                  </Badge>
                )}
                {result.Truncation && (
                  <Badge variant="light" color="red" tt="none">
                    {t('dnsClient.truncated')}
                  </Badge>
                )}
              </Group>

              {/* 查询信息 */}
              {result.Question && result.Question.length > 0 && (
                <Text size="sm" c="dimmed" mb="md">
                  {t('dnsClient.querying', {
                    name: result.Question[0].NameIDN || result.Question[0].Name,
                    type: result.Question[0].Type,
                  })}
                </Text>
              )}

              {/* 回答记录 */}
              <Text fw={600} mb="xs">
                {t('dnsClient.answer')} ({result.Answer?.length ?? 0})
              </Text>
              {result.Answer && result.Answer.length > 0 ? (
                <DnsRecordTable
                  records={result.Answer}
                  dotBadgeStyle={dotBadgeStyle}
                  edns={result.EDNS}
                />
              ) : (
                <Text size="sm" c="dimmed">
                  {t('dnsClient.noAnswerRecords')}
                </Text>
              )}

              {/* 权威 / 附加记录 */}
              {(result.Authority?.length || 0) > 0 || (result.Additional?.length || 0) > 0 ? (
                <Accordion mt="md" variant="separated" defaultValue={null}>
                  {result.Authority && result.Authority.length > 0 && (
                    <Accordion.Item value="authority">
                      <Accordion.Control>
                        {t('dnsClient.authority')} ({result.Authority.length})
                      </Accordion.Control>
                      <Accordion.Panel>
                        <DnsRecordTable
                          records={result.Authority}
                          dotBadgeStyle={dotBadgeStyle}
                          edns={result.EDNS}
                        />
                      </Accordion.Panel>
                    </Accordion.Item>
                  )}
                  {result.Additional && result.Additional.length > 0 && (
                    <Accordion.Item value="additional">
                      <Accordion.Control>
                        {t('dnsClient.additional')} ({result.Additional.length})
                      </Accordion.Control>
                      <Accordion.Panel>
                        <DnsRecordTable
                          records={result.Additional}
                          dotBadgeStyle={dotBadgeStyle}
                          edns={result.EDNS}
                        />
                      </Accordion.Panel>
                    </Accordion.Item>
                  )}
                </Accordion>
              ) : null}

              {/* 原始响应 */}
              {rawResponses.length > 0 && (
                <Accordion mt="md" variant="separated" defaultValue={null}>
                  <Accordion.Item value="raw">
                    <Accordion.Control>
                      {t('dnsClient.rawResponses', { count: rawResponses.length })}
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="sm">
                        {rawResponses.map((raw, i) => (
                          <CodeMirror
                            key={i}
                            value={JSON.stringify(raw, null, 2)}
                            readOnly
                            height="300px"
                            extensions={[json(), codeMirrorFontTheme, foldGutterExtension]}
                            theme={isDark ? oneDark : codeMirrorLightTheme}
                            basicSetup={{ lineNumbers: true, foldGutter: false }}
                          />
                        ))}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              )}
            </>
          )}
        </Paper>
      )}
    </Stack>
  );
}
