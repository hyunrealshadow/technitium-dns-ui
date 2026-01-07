import {createFileRoute} from '@tanstack/react-router';
import {Paper, Text, Title} from '@mantine/core';

function AdminPage() {
  return (
    <div>
      <Title order={2} mb="md">
        系统管理
      </Title>
      <Paper shadow="sm" p="xl" withBorder>
        <Text c="dimmed">系统管理功能正在开发中...</Text>
      </Paper>
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/admin')({
  component: AdminPage,
});
