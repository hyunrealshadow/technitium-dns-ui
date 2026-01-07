import {useEffect, useState} from 'react';
import {Accordion, Badge, Button, Card, Grid, Group, Loader, Paper, Stack, Text, Title,} from '@mantine/core';
import {IconDownload, IconPlus, IconTrash} from '@tabler/icons-react';
import {apiClient} from '../api/client';
import {notifications} from '@mantine/notifications';

interface DnsApp {
  classPath: string;
  description: string;
  isAppRecordRequestHandler: boolean;
  isRequestController: boolean;
  isAuthoritativeRequestHandler: boolean;
  isRequestBlockingHandler: boolean;
  isQueryLogger: boolean;
  isQueryLogs: boolean;
  isPostProcessor: boolean;
}

interface App {
  name: string;
  version: string;
  updateVersion?: string;
  updateAvailable: boolean;
  dnsApps: DnsApp[];
}

export function AppsPage() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<App[]>([]);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ apps: App[] }>('/apps/list');

      if (response.status === 'ok' && response.response) {
        setApps(response.response.apps || []);
      } else if (response.status === 'invalid-token') {
        notifications.show({
          title: '认证失败',
          message: '请重新登录',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: '错误',
        message: '加载应用列表失败',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const getAppTypeLabels = (dnsApp: DnsApp) => {
    const labels = [];
    if (dnsApp.isAppRecordRequestHandler) labels.push({ label: 'APP 记录', color: 'blue' });
    if (dnsApp.isRequestController) labels.push({ label: '访问控制', color: 'grape' });
    if (dnsApp.isAuthoritativeRequestHandler) labels.push({ label: '权威', color: 'cyan' });
    if (dnsApp.isRequestBlockingHandler) labels.push({ label: '阻止', color: 'orange' });
    if (dnsApp.isQueryLogger) labels.push({ label: '查询记录器', color: 'teal' });
    if (dnsApp.isQueryLogs) labels.push({ label: '查询日志', color: 'lime' });
    if (dnsApp.isPostProcessor) labels.push({ label: '后处理器', color: 'pink' });
    return labels;
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Loader size="lg" />
        <Text>加载中...</Text>
      </Stack>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>应用管理</Title>
        <Button leftSection={<IconPlus size={16} />}>安装应用</Button>
      </Group>

      {apps.length === 0 ? (
        <Paper shadow="sm" p="xl" withBorder>
          <Text c="dimmed" ta="center">
            暂无已安装的应用
          </Text>
        </Paper>
      ) : (
        <Grid>
          {apps.map(app => (
            <Grid.Col key={app.name} span={{ base: 12, md: 6, lg: 4 }}>
              <Card shadow="sm" padding="lg" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600} size="lg">
                        {app.name}
                      </Text>
                      <Text size="sm" c="dimmed">
                        版本 {app.version}
                      </Text>
                    </div>
                    {app.updateAvailable && (
                      <Badge color="red" variant="filled">
                        有更新
                      </Badge>
                    )}
                  </Group>

                  {app.dnsApps.length > 0 && (
                    <Accordion variant="contained">
                      <Accordion.Item value="dnsApps">
                        <Accordion.Control>DNS 应用 ({app.dnsApps.length})</Accordion.Control>
                        <Accordion.Panel>
                          <Stack gap="xs">
                            {app.dnsApps.map((dnsApp, idx) => (
                              <Paper key={idx} p="xs" withBorder>
                                <Text size="xs" fw={500} mb={4}>
                                  {dnsApp.classPath}
                                </Text>
                                <Group gap={4}>
                                  {getAppTypeLabels(dnsApp).map(label => (
                                    <Badge key={label.label} size="xs" color={label.color}>
                                      {label.label}
                                    </Badge>
                                  ))}
                                </Group>
                                {dnsApp.description && (
                                  <Text size="xs" c="dimmed" mt={4}>
                                    {dnsApp.description}
                                  </Text>
                                )}
                              </Paper>
                            ))}
                          </Stack>
                        </Accordion.Panel>
                      </Accordion.Item>
                    </Accordion>
                  )}

                  <Group gap="xs" grow>
                    {app.updateAvailable && (
                      <Button
                        size="xs"
                        variant="light"
                        color="green"
                        leftSection={<IconDownload size={14} />}
                      >
                        更新
                      </Button>
                    )}
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      leftSection={<IconTrash size={14} />}
                    >
                      卸载
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
