import {createFileRoute} from '@tanstack/react-router';
import {Paper, Text, Title} from '@mantine/core';

function AllowedPage() {
  return (
    <div>
      <Title order={2} mb="md">
        允许列表
      </Title>
      <Paper shadow="sm" p="xl" withBorder>
        <Text c="dimmed">允许列表功能正在开发中...</Text>
      </Paper>
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/allowed')({
  component: AllowedPage,
});
