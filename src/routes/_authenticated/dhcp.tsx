import {createFileRoute} from '@tanstack/react-router';
import {Paper, Text, Title} from '@mantine/core';

function DhcpPage() {
  return (
    <div>
      <Title order={2} mb="md">
        DHCP 服务器
      </Title>
      <Paper shadow="sm" p="xl" withBorder>
        <Text c="dimmed">DHCP 服务器功能正在开发中...</Text>
      </Paper>
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/dhcp')({
  component: DhcpPage,
});
