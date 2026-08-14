export interface RecordTtlParts {
  value: string;
  friendly?: string;
}

const COMBINED_TTL_PATTERN = /^(.+?)\s*\(([^()]*)\)$/;

export function getRecordTtlParts(ttl?: number | string | null, ttlString?: string | null) {
  const ttlValue = ttl == null ? '' : String(ttl).trim();
  const friendlyValue = ttlString?.trim() || '';
  const combinedTtl = COMBINED_TTL_PATTERN.exec(ttlValue);

  if (combinedTtl) {
    return { value: combinedTtl[1].trim(), friendly: combinedTtl[2].trim() };
  }

  const combinedFriendly = COMBINED_TTL_PATTERN.exec(friendlyValue);
  if (combinedFriendly) {
    return {
      value: ttlValue || combinedFriendly[1].trim(),
      friendly: combinedFriendly[2].trim(),
    };
  }

  return {
    value: ttlValue || friendlyValue || '—',
    friendly: friendlyValue && friendlyValue !== ttlValue ? friendlyValue : undefined,
  };
}

export function formatRecordTtl(ttl?: number | string | null, ttlString?: string | null) {
  const { value, friendly } = getRecordTtlParts(ttl, ttlString);
  return friendly ? `${value}\n(${friendly})` : value;
}
