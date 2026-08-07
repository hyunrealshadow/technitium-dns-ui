// 日志页共享类型

export interface LogFile {
  fileName: string;
  size: string;
}

export interface QueryLogEntry {
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

export interface QueryLogsResponse {
  entries: QueryLogEntry[];
  pageNumber: number;
  totalPages: number;
  totalEntries: number;
}
