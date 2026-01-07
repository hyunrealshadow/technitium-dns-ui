import { createFileRoute } from '@tanstack/react-router';
import { Title, Paper, Text } from '@mantine/core';

function BlockedPage() {
  return (
    <div>
      <Title order={2} mb="md">
        阻止列表
      </Title>
      <Paper shadow="sm" p="xl" withBorder>
        <Text c="dimmed">阻止列表功能正在开发中...</Text>
      </Paper>
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/blocked')({
  component: BlockedPage,
});
