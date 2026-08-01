import { Badge, Group, Paper, ScrollArea, Text, Title } from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { LABEL_TRANSLATION_KEYS } from '../constants';
import { type PieChartData } from '../types';
import { getLabelColor } from '../utils';

interface DonutChartCardProps {
  title: string;
  data: PieChartData;
  activeLabels?: string[];
  onLabelClick?: (label: string) => void;
  colorMap: Record<string, string> | string[];
}

export function DonutChartCard({
  title,
  data,
  activeLabels,
  onLabelClick,
  colorMap,
}: DonutChartCardProps) {
  const { t } = useTranslation();

  if (!data?.labels?.length) {
    return (
      <Paper shadow="sm" p="md" withBorder h="100%">
        <Title order={5} mb="md">
          {title}
        </Title>
        <Text c="dimmed" ta="center" py="xl">
          {t('common.noData')}
        </Text>
      </Paper>
    );
  }

  const chartData = data.labels.map((label, index) => {
    const isActive = activeLabels?.includes(label);
    return {
      name: t(LABEL_TRANSLATION_KEYS[label] || label),
      value: isActive ? data.datasets[0]?.data[index] || 0 : 0,
      color: getLabelColor(label, index, colorMap),
    };
  });

  return (
    <Paper shadow="sm" p="md" withBorder h="100%">
      <Group justify="space-between" mb="md" align="flex-start" wrap="wrap" gap="xs">
        <Title order={5}>{title}</Title>
        {onLabelClick && (
          <ScrollArea type="never">
            <Group gap={4}>
              {data.labels.map((label, index) => {
                const isActive = activeLabels?.includes(label);
                const badgeColor = getLabelColor(label, index, colorMap);
                return (
                  <Badge
                    key={label}
                    variant="dot"
                    color={badgeColor}
                    size="sm"
                    style={
                      {
                        cursor: 'pointer',
                        textDecoration: isActive ? 'none' : 'line-through',
                        textTransform: 'none',
                        opacity: isActive ? 1 : 0.6,
                      } as React.CSSProperties
                    }
                    onClick={() => onLabelClick?.(label)}
                  >
                    {t(LABEL_TRANSLATION_KEYS[label] || label)}
                  </Badge>
                );
              })}
            </Group>
          </ScrollArea>
        )}
      </Group>
      <DonutChart
        h={250}
        data={chartData}
        withLabels
        withLabelsLine
        tooltipAnimationDuration={200}
        labelsType="percent"
        ml="auto"
        mr="auto"
        style={{ '--chart-size': 'auto' } as React.CSSProperties}
      />
    </Paper>
  );
}
