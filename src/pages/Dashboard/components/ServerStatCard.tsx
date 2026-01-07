import { Paper, Text, Box } from '@mantine/core';

interface ServerStatCardProps {
  title: string;
  value: number;
  color: string;
}

export function ServerStatCard({ title, value, color }: ServerStatCardProps) {
  return (
    <Paper shadow="xs" p="sm" withBorder h="100%">
      <Box style={{ display: 'flex', flexDirection: 'column' }}>
        <Text size="lg" fw={600} c={color} style={{ lineHeight: 1.2 }}>
          {value.toLocaleString()}
        </Text>
        <Text size="xs" c="dimmed" style={{ marginTop: 4 }}>
          {title}
        </Text>
      </Box>
    </Paper>
  );
}
