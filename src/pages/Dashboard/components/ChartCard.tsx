import { Badge, Group, Paper, ScrollArea, Text, Title } from '@mantine/core';
import { LineChart } from '@mantine/charts';
import { useTranslation } from 'react-i18next';

interface ChartCardProps {
  title: string;
  data: any[];
  dataKey: string;
  series: Array<{ name: string; color: string; labelKey: string }>;
  activeSeries?: string[];
  onSeriesChange?: (name: string) => void;
}

export function ChartCard({
  title,
  data,
  dataKey,
  series,
  activeSeries,
  onSeriesChange,
}: ChartCardProps) {
  const { t } = useTranslation();
  const filteredSeries = activeSeries?.length
    ? series.filter(s => activeSeries.includes(s.name))
    : series;

  if (!data?.length || filteredSeries.length === 0) {
    return (
      <Paper shadow="sm" p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={5}>{title}</Title>
        </Group>
        <Text c="dimmed" ta="center" py="xl">
          {t('common.noData')}
        </Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Group justify="space-between" mb="md" align="flex-start" wrap="wrap" gap="xs">
        <Title order={5}>{title}</Title>
        {onSeriesChange && (
          <ScrollArea type="never">
            <Group gap={4} wrap="nowrap">
              {series.map(s => (
                <Badge
                  key={s.name}
                  variant="dot"
                  color={activeSeries?.includes(s.name) ? s.color : 'gray'}
                  size="sm"
                  style={{
                    cursor: 'pointer',
                    textDecoration: activeSeries?.includes(s.name) ? 'none' : 'line-through',
                    textTransform: 'none',
                    opacity: activeSeries?.includes(s.name) ? 1 : 0.6,
                  }}
                  onClick={() => onSeriesChange?.(s.name)}
                >
                  {t(s.labelKey)}
                </Badge>
              ))}
            </Group>
          </ScrollArea>
        )}
      </Group>
      <LineChart
        h={300}
        data={data}
        dataKey={dataKey}
        series={filteredSeries.map(s => ({ ...s, label: t(s.labelKey) }))}
        tooltipAnimationDuration={200}
        curveType="linear"
      />
    </Paper>
  );
}
