import {createFileRoute} from '@tanstack/react-router';
import {Paper, Text, Title} from '@mantine/core';

function CachePage() {
  return (
    <div>
      <Title order={2} mb="md">
        缓存管理
      </Title>
      <Paper shadow="sm" p="xl" withBorder>
        <Text c="dimmed">缓存管理功能正在开发中...</Text>
      </Paper>
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/cache')({
  component: CachePage,
});
