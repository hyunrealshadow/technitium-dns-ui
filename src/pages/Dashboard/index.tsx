import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Title,
  Paper,
  Grid,
  Group,
  Button,
  SegmentedControl,
  ScrollArea,
  Stack,
  Text,
  Skeleton,
  Menu,
} from '@mantine/core';
import { IconClockPause, IconRefresh, IconShieldCheck, IconShieldOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { error, success } from '../../components/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatCard } from './components/StatCard';
import { ServerStatCard } from './components/ServerStatCard';
import { ChartCard } from './components/ChartCard';
import { DonutChartCard } from './components/DonutChartCard';
import { TopTable } from './components/TopTable';
import {
  RESPONSE_TYPE_COLORS,
  QUERY_TYPE_COLORS,
  PROTOCOL_TYPE_COLORS,
  CHART_SERIES,
  CHART_COLORS,
} from './constants';
import { type StatsData } from './types';
import { formatPercentage } from './utils';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { DashboardSearch } from './schema.ts';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useConfirmDialog } from '../../components/ConfirmDialog.context';

export function DashboardPage() {
  const { t } = useTranslation();
  const confirmDialog = useConfirmDialog();
  const navigate = useNavigate();
  const search = useSearch({ from: '/_authenticated/dashboard' });
  const queryClient = useQueryClient();
  const [statPeriod, setStatPeriod] = useState(search.statPeriod);

  // Loading states - add debouncing to prevent flickering
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const skeletonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chart filter states
  const [activeSeries, setActiveSeries] = useState<string[]>(CHART_SERIES.map(s => s.name));
  const [responseLabels, setResponseLabels] = useState<string[]>([]);
  const [queryTypeLabels, setQueryTypeLabels] = useState<string[]>([]);
  const [protocolLabels, setProtocolLabels] = useState<string[]>([]);
  const [activeResponseLabels, setActiveResponseLabels] = useState<string[]>([]);
  const [activeQueryTypeLabels, setActiveQueryTypeLabels] = useState<string[]>([]);
  const [activeProtocolLabels, setActiveProtocolLabels] = useState<string[]>([]);

  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', statPeriod],
    queryFn: async () => {
      const response = await apiClient.get<StatsData>(`/dashboard/stats/get?type=${statPeriod}`);
      if (response.status === 'ok' && response.response) {
        return response.response;
      }
      throw new Error(response.errorMessage || t('dashboard.loadFailed'));
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const stats = dashboardData?.stats || null;
  const topClients = dashboardData?.topClients || [];
  const topDomains =
    dashboardData?.topDomains?.map(d => ({
      ...d,
      name: d.name === '' ? '.' : d.name,
    })) || [];
  const topBlockedDomains = dashboardData?.topBlockedDomains || [];
  const queryResponseData = dashboardData?.queryResponseChartData || null;
  const queryTypeData = dashboardData?.queryTypeChartData || null;
  const protocolData = dashboardData?.protocolTypeChartData || null;

  const { data: blockingEnabled } = useQuery({
    queryKey: ['settings', 'blocking-status'],
    queryFn: async () => {
      const response = await apiClient.get<{ enableBlocking: boolean }>('/settings/get');
      if (response.status === 'ok' && response.response) {
        return response.response.enableBlocking;
      }
      throw new Error(response.errorMessage || t('dashboard.blocking.loadFailed'));
    },
    staleTime: 60_000,
  });

  const mainChartData = dashboardData?.mainChartData?.labels?.length
    ? dashboardData.mainChartData.labels.map((label, index) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dataPoint: Record<string, any> = { label };
        dashboardData.mainChartData?.datasets.forEach(dataset => {
          dataPoint[dataset.label] = dataset.data[index];
        });
        return dataPoint;
      })
    : [];

  const blockDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      await apiClient.post('/allowed/delete', { domain });
      await apiClient.post('/blocked/add', { domain });
      return domain;
    },
    onSuccess: async domain => {
      success(t('common.success'), t('dashboard.notification.domainBlocked', { domain }));
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (_error: Error, domain: string) => {
      error(t('common.error'), t('dashboard.notification.domainBlockFailed'), domain);
    },
  });

  const allowDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      await apiClient.post('/blocked/delete', { domain });
      await apiClient.post('/allowed/add', { domain });
      return domain;
    },
    onSuccess: async domain => {
      success(t('common.success'), t('dashboard.notification.domainAllowed', { domain }));
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (_error: Error, domain: string) => {
      error(t('common.error'), t('dashboard.notification.domainAllowFailed'), domain);
    },
  });

  const blockingMutation = useMutation({
    mutationFn: async (action: { enabled?: boolean; minutes?: number }) => {
      const response =
        action.minutes === undefined
          ? await apiClient.post('/settings/set', { enableBlocking: action.enabled })
          : await apiClient.post(
              `/settings/temporaryDisableBlocking?minutes=${action.minutes}`,
              {}
            );
      if (response.status !== 'ok') {
        throw new Error(response.errorMessage || t('dashboard.blocking.updateFailed'));
      }
      return action;
    },
    onSuccess: async action => {
      if (action.enabled !== undefined) {
        queryClient.setQueryData(['settings', 'blocking-status'], action.enabled);
        success(
          t('common.success'),
          t(action.enabled ? 'dashboard.blocking.enabled' : 'dashboard.blocking.disabled')
        );
      } else if (action.minutes !== undefined) {
        success(t('common.success'), t('settings.tempDisabled', { minutes: action.minutes }));
      }
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (mutationError: Error) => {
      error(t('common.error'), mutationError.message || t('dashboard.blocking.updateFailed'));
    },
  });

  const setBlocking = async (enabled: boolean) => {
    if (
      !(await confirmDialog(
        t(enabled ? 'dashboard.blocking.enableConfirm' : 'dashboard.blocking.disableConfirm')
      ))
    ) {
      return;
    }
    blockingMutation.mutate({ enabled });
  };

  const temporarilyDisableBlocking = async (minutes: number) => {
    if (!(await confirmDialog(t('settings.tempDisableConfirm', { minutes })))) return;
    blockingMutation.mutate({ minutes });
  };

  const toggleSeries = (name: string) => {
    setActiveSeries(prev => {
      if (prev.includes(name)) {
        const filtered = prev.filter(s => s !== name);
        return filtered.length > 0 ? filtered : [name];
      } else {
        return [...prev, name];
      }
    });
  };

  const toggleLabel = (
    label: string,
    _current: string[],
    setFunc: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setFunc(prev => {
      if (prev.includes(label)) {
        const filtered = prev.filter(l => l !== label);
        return filtered.length > 0 ? filtered : [];
      } else {
        return [...prev, label];
      }
    });
  };

  const clearAllFilters = useCallback(() => {
    setActiveSeries(CHART_SERIES.map(s => s.name));
    setActiveResponseLabels(responseLabels);
    setActiveQueryTypeLabels(queryTypeLabels);
    setActiveProtocolLabels(protocolLabels);
  }, [responseLabels, queryTypeLabels, protocolLabels]);

  // Action handlers
  const handleShowQueryLogs = async (domain: string | null, clientIp: string | null) => {
    // Navigate to the logs page with query params
    await navigate({
      to: '/logs/query',
      search: {
        domain: domain || undefined,
        clientIp: clientIp || undefined,
      },
    });
  };

  const handleQueryDns = async (domain: string, type: string = 'A') => {
    // Navigate to the DNS client page with query params
    await navigate({
      to: '/dns-client',
      search: {
        domain,
        type,
      },
    });
  };

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => {
        setIsManualRefreshing(false);
      }, 150);
    }
  };

  const handleBlockDomain = (domain: string) => {
    blockDomainMutation.mutate(domain);
  };

  const handleAllowDomain = (domain: string) => {
    allowDomainMutation.mutate(domain);
  };

  useEffect(() => {
    setStatPeriod(search.statPeriod);
  }, [search.statPeriod]);

  useEffect(() => {
    if (dashboardData) {
      const responseLabelsArr = dashboardData.queryResponseChartData?.labels || [];
      const queryTypeLabelsArr = dashboardData.queryTypeChartData?.labels || [];
      const protocolLabelsArr = dashboardData.protocolTypeChartData?.labels || [];

      setResponseLabels(responseLabelsArr);
      setQueryTypeLabels(queryTypeLabelsArr);
      setProtocolLabels(protocolLabelsArr);
      setActiveResponseLabels(responseLabelsArr);
      setActiveQueryTypeLabels(queryTypeLabelsArr);
      setActiveProtocolLabels(protocolLabelsArr);
    }
  }, [dashboardData]);

  // Tab change - clear filters
  useEffect(() => {
    clearAllFilters();
  }, [statPeriod, clearAllFilters]);

  // 管理骨架屏显示逻辑 - 只有在加载时间超过阈值时才显示
  useEffect(() => {
    // 清除现有定时器
    if (skeletonTimerRef.current) {
      clearTimeout(skeletonTimerRef.current);
      skeletonTimerRef.current = null;
    }

    if (isLoading) {
      // 开始加载，设置延迟显示骨架屏
      skeletonTimerRef.current = setTimeout(() => {
        setShowSkeleton(true);
      }, 150);
    } else {
      // 加载完成，立即隐藏骨架屏
      setShowSkeleton(false);
    }

    return () => {
      if (skeletonTimerRef.current) {
        clearTimeout(skeletonTimerRef.current);
      }
    };
  }, [isLoading]);

  return (
    <Stack>
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Title order={2}>{t('dashboard.title')}</Title>
        <Button
          size="xs"
          leftSection={<IconRefresh size={15} />}
          onClick={handleManualRefresh}
          loading={isManualRefreshing}
        >
          {t('common.refresh')}
        </Button>
      </Group>

      <ScrollArea type="never" offsetScrollbars>
        <SegmentedControl
          fullWidth
          miw={560}
          value={statPeriod}
          onChange={value => {
            setStatPeriod(value as DashboardSearch['statPeriod']);
            navigate({
              to: '/dashboard',
              search: { statPeriod: value as DashboardSearch['statPeriod'] },
            });
          }}
          data={[
            { label: t('dashboard.lastHour'), value: 'lastHour' },
            { label: t('dashboard.lastDay'), value: 'lastDay' },
            { label: t('dashboard.lastWeek'), value: 'lastWeek' },
            { label: t('dashboard.lastMonth'), value: 'lastMonth' },
            { label: t('dashboard.lastYear'), value: 'lastYear' },
          ]}
        />
      </ScrollArea>

      <ErrorBoundary>
        {showSkeleton || isLoading ? (
          <Stack>
            <Grid>
              {Array.from({ length: 5 }).map((_, i) => (
                <Grid.Col key={i} span={{ base: 6, sm: 4, md: 4, lg: 2.4 }}>
                  <Paper shadow="sm" p="md" withBorder h="100%">
                    <Skeleton height={40} mb="sm" />
                    <Skeleton height={20} width="60%" />
                  </Paper>
                </Grid.Col>
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid.Col key={i} span={{ base: 6, sm: 4, md: 4, lg: 2 }}>
                  <Paper shadow="sm" p="md" withBorder h="100%">
                    <Skeleton height={40} mb="sm" />
                    <Skeleton height={20} width="60%" />
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
            <Grid>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid.Col key={i} span={{ base: 6, sm: 4, md: 2 }}>
                  <Paper shadow="sm" p="md" withBorder h="100%">
                    <Skeleton height={40} mb="sm" />
                    <Skeleton height={20} width="60%" />
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
            <Paper shadow="sm" p="md" withBorder>
              <Skeleton height={30} width="20%" mb="md" />
              <Skeleton height={300} />
            </Paper>
            <Grid>
              {Array.from({ length: 3 }).map((_, i) => (
                <Grid.Col key={i} span={{ base: 12, md: 4 }}>
                  <Paper shadow="sm" p="md" withBorder h="100%">
                    <Skeleton height={30} width="30%" mb="md" />
                    <Skeleton height={250} />
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
            <Grid>
              {Array.from({ length: 3 }).map((_, i) => (
                <Grid.Col key={i} span={{ base: 12, md: 4 }}>
                  <Paper shadow="sm" p="md" withBorder h="100%">
                    <Skeleton height={30} width="40%" mb="md" />
                    <Skeleton height={300} />
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        ) : stats ? (
          <Stack>
            <Grid>
              <Grid.Col span={{ base: 6, sm: 4, md: 4, lg: 2.4 }}>
                <StatCard
                  title={t('dashboard.stats.totalQueries')}
                  value={stats.totalQueries}
                  color={CHART_COLORS.TOTAL}
                  subtitle="100%"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 4, lg: 2.4 }}>
                <StatCard
                  title={t('dashboard.stats.noError')}
                  value={stats.totalNoError}
                  color={CHART_COLORS.NO_ERROR}
                  subtitle={formatPercentage(stats.totalNoError, stats.totalQueries)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 4, lg: 2.4 }}>
                <StatCard
                  title={t('dashboard.stats.serverFailure')}
                  value={stats.totalServerFailure}
                  color={CHART_COLORS.SERVER_FAILURE}
                  subtitle={formatPercentage(stats.totalServerFailure, stats.totalQueries)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 4, lg: 2.4 }}>
                <StatCard
                  title={t('dashboard.stats.nxDomain')}
                  value={stats.totalNxDomain}
                  color={CHART_COLORS.NX_DOMAIN}
                  subtitle={formatPercentage(stats.totalNxDomain, stats.totalQueries)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 4, lg: 2.4 }}>
                <StatCard
                  title={t('dashboard.stats.refused')}
                  value={stats.totalRefused}
                  color={CHART_COLORS.REFUSED}
                  subtitle={formatPercentage(stats.totalRefused, stats.totalQueries)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 4, lg: 2 }}>
                <StatCard
                  title={t('dashboard.stats.authoritative')}
                  value={stats.totalAuthoritative}
                  color={CHART_COLORS.AUTHORITATIVE}
                  subtitle={formatPercentage(stats.totalAuthoritative, stats.totalQueries)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 4, lg: 2 }}>
                <StatCard
                  title={t('dashboard.stats.recursive')}
                  value={stats.totalRecursive}
                  color={CHART_COLORS.RECURSIVE}
                  subtitle={formatPercentage(stats.totalRecursive, stats.totalQueries)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 4, lg: 2 }}>
                <StatCard
                  title={t('dashboard.stats.cached')}
                  value={stats.totalCached}
                  color={CHART_COLORS.CACHED}
                  subtitle={formatPercentage(stats.totalCached, stats.totalQueries)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 4, lg: 2 }}>
                <StatCard
                  title={t('dashboard.stats.blocked')}
                  value={stats.totalBlocked}
                  color={CHART_COLORS.BLOCKED}
                  subtitle={formatPercentage(stats.totalBlocked, stats.totalQueries)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 4, lg: 2 }}>
                <StatCard
                  title={t('dashboard.stats.dropped')}
                  value={stats.totalDropped}
                  color={CHART_COLORS.DROPPED}
                  subtitle={formatPercentage(stats.totalDropped, stats.totalQueries)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 4, lg: 2 }}>
                <StatCard
                  title={t('dashboard.stats.clients')}
                  value={stats.totalClients}
                  color={CHART_COLORS.CLIENTS}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
                <ServerStatCard
                  title={t('dashboard.stats.zones')}
                  value={stats.zones}
                  color="blue"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
                <ServerStatCard
                  title={t('dashboard.stats.cachedEntries')}
                  value={stats.cachedEntries}
                  color="violet"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
                <ServerStatCard
                  title={t('dashboard.stats.allowedZones')}
                  value={stats.allowedZones}
                  color="green"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
                <ServerStatCard
                  title={t('dashboard.stats.blockedZones')}
                  value={stats.blockedZones}
                  color="orange"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
                <ServerStatCard
                  title={t('dashboard.stats.allowListZones')}
                  value={stats.allowListZones}
                  color="teal"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
                <ServerStatCard
                  title={t('dashboard.stats.blockListZones')}
                  value={stats.blockListZones}
                  color="red"
                />
              </Grid.Col>
            </Grid>

            <ChartCard
              title={t('dashboard.charts.queryStats')}
              data={mainChartData}
              dataKey="label"
              series={CHART_SERIES}
              activeSeries={activeSeries.length > 0 ? activeSeries : CHART_SERIES.map(s => s.name)}
              onSeriesChange={toggleSeries}
            />

            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <DonutChartCard
                  title={t('dashboard.charts.responseType')}
                  data={queryResponseData!}
                  activeLabels={activeResponseLabels}
                  onLabelClick={label =>
                    toggleLabel(label, activeResponseLabels, setActiveResponseLabels)
                  }
                  colorMap={RESPONSE_TYPE_COLORS}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <DonutChartCard
                  title={t('dashboard.charts.queryType')}
                  data={queryTypeData!}
                  activeLabels={activeQueryTypeLabels}
                  onLabelClick={label =>
                    toggleLabel(label, activeQueryTypeLabels, setActiveQueryTypeLabels)
                  }
                  colorMap={QUERY_TYPE_COLORS}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <DonutChartCard
                  title={t('dashboard.charts.protocolType')}
                  data={protocolData!}
                  activeLabels={activeProtocolLabels}
                  onLabelClick={label =>
                    toggleLabel(label, activeProtocolLabels, setActiveProtocolLabels)
                  }
                  colorMap={PROTOCOL_TYPE_COLORS}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TopTable
                  title={t('dashboard.tables.clientRank')}
                  data={topClients}
                  tableType="clients"
                  onShowQueryLogs={handleShowQueryLogs}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TopTable
                  title={t('dashboard.tables.domainRank')}
                  data={topDomains}
                  tableType="domains"
                  onShowQueryLogs={handleShowQueryLogs}
                  onQueryDns={handleQueryDns}
                  onBlockDomain={handleBlockDomain}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TopTable
                  title={t('dashboard.tables.blockedDomainRank')}
                  data={topBlockedDomains}
                  tableType="blockedDomains"
                  onShowQueryLogs={handleShowQueryLogs}
                  onQueryDns={handleQueryDns}
                  onAllowDomain={handleAllowDomain}
                  headerAction={
                    <Menu position="bottom-end" shadow="md" width={220}>
                      <Menu.Target>
                        <Button
                          size="compact-xs"
                          variant="default"
                          leftSection={
                            blockingEnabled ? (
                              <IconShieldCheck size={14} />
                            ) : (
                              <IconShieldOff size={14} />
                            )
                          }
                          loading={blockingMutation.isPending}
                          disabled={blockingEnabled === undefined}
                        >
                          {t('dashboard.blocking.title')}
                        </Button>
                      </Menu.Target>
                      <Menu.Dropdown>
                        {blockingEnabled ? (
                          <Menu.Item
                            color="red"
                            leftSection={<IconShieldOff size={14} />}
                            onClick={() => setBlocking(false)}
                          >
                            {t('dashboard.blocking.disable')}
                          </Menu.Item>
                        ) : (
                          <Menu.Item
                            color="green"
                            leftSection={<IconShieldCheck size={14} />}
                            onClick={() => setBlocking(true)}
                          >
                            {t('dashboard.blocking.enable')}
                          </Menu.Item>
                        )}
                        {blockingEnabled && (
                          <>
                            <Menu.Divider />
                            <Menu.Label>{t('dashboard.blocking.temporary')}</Menu.Label>
                            {[1, 2, 5, 10, 15, 30, 60, 180].map(minutes => (
                              <Menu.Item
                                key={minutes}
                                leftSection={<IconClockPause size={14} />}
                                onClick={() => temporarilyDisableBlocking(minutes)}
                              >
                                {t('dashboard.blocking.disableForMinutes', { minutes })}
                              </Menu.Item>
                            ))}
                          </>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  }
                />
              </Grid.Col>
            </Grid>
          </Stack>
        ) : (
          <Paper shadow="sm" p="md" withBorder>
            <Stack align="center" py="xl">
              <Text>{t('dashboard.loadFailed')}</Text>
            </Stack>
          </Paper>
        )}
      </ErrorBoundary>
    </Stack>
  );
}
