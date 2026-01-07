import { createFileRoute } from '@tanstack/react-router';
import { Title, Paper, Text, Stack } from '@mantine/core';

function AboutPage() {
  return (
    <div>
      <Title order={2} mb="md">
        关于
      </Title>
      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md">
          <div>
            <Text fw={600} size="lg">
              Technitium DNS Server
            </Text>
            <Text size="sm" c="dimmed">
              现代化 Web 管理界面
            </Text>
          </div>
          <div>
            <Text size="sm">基于以下技术构建：</Text>
            <ul>
              <li>React 19</li>
              <li>TypeScript</li>
              <li>Vite</li>
              <li>Mantine UI</li>
              <li>TanStack Router</li>
              <li>Jotai 状态管理</li>
            </ul>
          </div>
        </Stack>
      </Paper>
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/about')({
  component: AboutPage,
});
