// Label translation keys for charts
export const LABEL_TRANSLATION_KEYS: Record<string, string> = {
  // Response types
  Authoritative: 'chartLabels.response.Authoritative',
  Recursive: 'chartLabels.response.Recursive',
  Cached: 'chartLabels.response.Cached',
  Blocked: 'chartLabels.response.Blocked',
  Dropped: 'chartLabels.response.Dropped',
  // Protocol types
  Udp: 'chartLabels.protocol.Udp',
  Tcp: 'chartLabels.protocol.Tcp',
  Tls: 'chartLabels.protocol.Tls',
  Https: 'chartLabels.protocol.Https',
  Quic: 'chartLabels.protocol.Quic',
};

// Response type colors (match main chart)
export const RESPONSE_TYPE_COLORS: Record<string, string> = {
  Authoritative: 'yellow',
  Recursive: 'cyan',
  Cached: 'violet',
  Blocked: 'orange',
  Dropped: 'dark',
};

// Query type colors
export const QUERY_TYPE_COLORS = [
  'blue',
  'green',
  'dark',
  'cyan',
  'lime',
  'teal',
  'grape',
  'orange',
  'indigo',
  'gray',
];

// Protocol type colors
export const PROTOCOL_TYPE_COLORS = ['grape', 'lime', 'teal', 'orange', 'cyan'];

// Main chart colors
export const CHART_COLORS = {
  TOTAL: 'blue',
  NO_ERROR: 'green',
  SERVER_FAILURE: 'red',
  NX_DOMAIN: 'gray',
  REFUSED: 'cyan',
  AUTHORITATIVE: 'lime',
  RECURSIVE: 'teal',
  CACHED: 'grape',
  BLOCKED: 'orange',
  DROPPED: 'dark',
  CLIENTS: 'indigo',
};

// Main chart series
export const CHART_SERIES = [
  { name: 'Total', color: CHART_COLORS.TOTAL, labelKey: 'chartLabels.series.Total' },
  { name: 'No Error', color: CHART_COLORS.NO_ERROR, labelKey: 'chartLabels.series.NoError' },
  {
    name: 'Server Failure',
    color: CHART_COLORS.SERVER_FAILURE,
    labelKey: 'chartLabels.series.ServerFailure',
  },
  { name: 'NX Domain', color: CHART_COLORS.NX_DOMAIN, labelKey: 'chartLabels.series.NXDomain' },
  { name: 'Refused', color: CHART_COLORS.REFUSED, labelKey: 'chartLabels.series.Refused' },
  {
    name: 'Authoritative',
    color: CHART_COLORS.AUTHORITATIVE,
    labelKey: 'chartLabels.series.Authoritative',
  },
  { name: 'Recursive', color: CHART_COLORS.RECURSIVE, labelKey: 'chartLabels.series.Recursive' },
  { name: 'Cached', color: CHART_COLORS.CACHED, labelKey: 'chartLabels.series.Cached' },
  { name: 'Blocked', color: CHART_COLORS.BLOCKED, labelKey: 'chartLabels.series.Blocked' },
  { name: 'Dropped', color: CHART_COLORS.DROPPED, labelKey: 'chartLabels.series.Dropped' },
  { name: 'Clients', color: CHART_COLORS.CLIENTS, labelKey: 'chartLabels.series.Clients' },
];
