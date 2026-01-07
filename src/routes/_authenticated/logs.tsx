import { createFileRoute } from '@tanstack/react-router';
import { Title, Paper, Text } from '@mantine/core';

function LogsPage() {
  return (
    <div>
      <Title order={2} mb="md">
        日志
      </Title>
      <Paper shadow="sm" p="xl" withBorder>
        <Text c="dimmed">日志功能正在开发中...</Text>
      </Paper>
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/logs')({
  component: LogsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      domain: typeof search.domain === 'string' ? search.domain : undefined,
      clientIp: typeof search.clientIp === 'string' ? search.clientIp : undefined,
    };
  },
});
