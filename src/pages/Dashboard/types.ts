// Types for Dashboard

export interface DashboardStats {
  totalQueries: number;
  totalNoError: number;
  totalServerFailure: number;
  totalNxDomain: number;
  totalRefused: number;
  totalAuthoritative: number;
  totalRecursive: number;
  totalCached: number;
  totalBlocked: number;
  totalDropped: number;
  totalClients: number;
  zones: number;
  cachedEntries: number;
  allowedZones: number;
  blockedZones: number;
  allowListZones: number;
  blockListZones: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

export interface PieChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor?: string[];
  }>;
}

export interface TopStats {
  name: string;
  nameIdn?: string;
  hits: number;
}

export interface TopClientStats extends TopStats {
  domain?: string;
  rateLimited: boolean;
}

export interface StatsData {
  stats: DashboardStats;
  mainChartData: ChartData;
  queryResponseChartData: PieChartData;
  queryTypeChartData: PieChartData;
  protocolTypeChartData: PieChartData;
  topClients: TopClientStats[];
  topDomains: TopStats[];
  topBlockedDomains: TopStats[];
}
