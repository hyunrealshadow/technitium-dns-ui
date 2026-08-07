// 按 DnsDatagram 序列化的 RDATA 字段名格式化（与区域接口的字段名不同）
export function formatRData(rdata: Record<string, unknown> | undefined): string {
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
export function formatOptData(
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

// 从服务器选项字符串中提取地址：`This Server {this-server}` → `this-server`
export function extractServer(value: string): string {
  let v = value;
  const i = v.indexOf('{');
  if (i > -1) {
    const j = v.lastIndexOf('}');
    v = v.substring(i + 1, j);
  }
  return v.trim();
}

// 剥离 URL 协议与路径，保留域名：`https://example.com/path` → `example.com`
export function sanitizeDomain(value: string): string {
  let v = value;
  const i = v.indexOf('://');
  if (i > -1) {
    let j = v.indexOf(':', i + 3);
    if (j < 0) j = v.indexOf('/', i + 3);
    v = j > -1 ? v.substring(i + 3, j) : v.substring(i + 3);
  }
  return v;
}
