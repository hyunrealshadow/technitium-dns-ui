import { Paper, Text, Box } from '@mantine/core';

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  subtitle?: string;
}

export function StatCard({ title, value, color, subtitle }: StatCardProps) {
  return (
    <Paper shadow="sm" p="md" withBorder h="100%">
      <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <Text size="xl" fw={700} c={color}>
          {value.toLocaleString()}
        </Text>
        <Text size="sm" c="dimmed">
          {title}
        </Text>
        {subtitle && (
          <Text size="xs" c="dimmed" style={{ marginTop: 'auto' }}>
            {subtitle}
          </Text>
        )}
      </Box>
    </Paper>
  );
}
