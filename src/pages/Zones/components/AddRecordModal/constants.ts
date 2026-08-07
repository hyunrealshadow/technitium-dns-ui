// 添加记录 Modal 的常量：记录类型与 DNSSEC 相关选项

export const RECORD_TYPES = [
  'A',
  'AAAA',
  'NS',
  'CNAME',
  'SOA',
  'MX',
  'TXT',
  'PTR',
  'RP',
  'SRV',
  'NAPTR',
  'DNAME',
  'DS',
  'SSHFP',
  'TLSA',
  'SVCB',
  'HTTPS',
  'URI',
  'CAA',
  'ANAME',
  'FWD',
  'APP',
];

export const DNSSEC_ALGORITHMS = [
  'RSAMD5',
  'RSASHA1',
  'RSASHA256',
  'RSASHA512',
  'ECDSAP256SHA256',
  'ECDSAP384SHA384',
  'ED25519',
  'ED448',
];

export const DIGEST_TYPES = ['SHA1', 'SHA256', 'SHA384'];

export const SSHFP_ALGORITHMS = ['RSA', 'DSA', 'ECDSA', 'Ed25519', 'Ed448'];
export const SSHFP_FINGERPRINT_TYPES = ['SHA1', 'SHA256'];

export const TLSA_CERTIFICATE_USAGES = ['PKIX-TA', 'PKIX-EE', 'DANE-TA', 'DANE-EE'];
export const TLSA_SELECTORS = ['Cert', 'SPKI'];
export const TLSA_MATCHING_TYPES = ['Full', 'SHA2-256', 'SHA2-512'];

export const FWD_PROTOCOLS = ['Udp', 'Tcp', 'Tls', 'Https', 'Quic'];

export const FWD_PROXY_TYPES = ['NoProxy', 'DefaultProxy', 'Http', 'Socks5'];
