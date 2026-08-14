import { Text } from '@mantine/core';
import { getRecordTtlParts } from './RecordTtl.utils';

interface RecordTtlProps {
  ttl?: number | string | null;
  ttlString?: string | null;
}

export function RecordTtl({ ttl, ttlString }: RecordTtlProps) {
  const { value, friendly } = getRecordTtlParts(ttl, ttlString);

  return <Text size="sm">{friendly ? `${value} (${friendly})` : value}</Text>;
}
