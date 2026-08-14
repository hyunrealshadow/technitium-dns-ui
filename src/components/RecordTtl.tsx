import { Stack, Text } from '@mantine/core';
import { getRecordTtlParts } from './RecordTtl.utils';

interface RecordTtlProps {
  ttl?: number | string | null;
  ttlString?: string | null;
}

export function RecordTtl({ ttl, ttlString }: RecordTtlProps) {
  const { value, friendly } = getRecordTtlParts(ttl, ttlString);

  return (
    <Stack gap={0}>
      <Text size="sm">{value}</Text>
      {friendly && (
        <Text size="xs" c="dimmed">
          ({friendly})
        </Text>
      )}
    </Stack>
  );
}
