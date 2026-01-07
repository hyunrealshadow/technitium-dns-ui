import { createFileRoute } from '@tanstack/react-router';
import { Title, Paper, Text } from '@mantine/core';

function DnsClientPage() {
  return (
    <div>
      <Title order={2} mb="md">
        DNS 客户端
      </Title>
      <Paper shadow="sm" p="xl" withBorder>
        <Text c="dimmed">DNS 客户端功能正在开发中...</Text>
      </Paper>
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/dns-client')({
  component: DnsClientPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      domain: typeof search.domain === 'string' ? search.domain : undefined,
      type: typeof search.type === 'string' ? search.type : undefined,
    };
  },
});
