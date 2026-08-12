import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { isAuthenticatedAtom, sessionAtom } from '../store/auth';
import { apiClient } from '../api/client';
import { getFirstPermittedRoute } from '../utils/permissions';
import { IconAlertCircle } from '@tabler/icons-react';

export function LoginPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const setSession = useSetAtom(sessionAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const session = useAtomValue(sessionAtom);

  useEffect(() => {
    const cookieToken = document.cookie
      .split(';')
      .map(part => part.trim())
      .find(part => part.startsWith('token='))
      ?.slice('token='.length);

    if (cookieToken) {
      document.cookie = 'token=; Max-Age=0; path=/';
      setLoading(true);
      apiClient
        .getSessionInfo(decodeURIComponent(cookieToken))
        .then(response => {
          if (response.status !== 'ok') {
            setError(response.errorMessage || t('login.loginFailed'));
            return;
          }
          const token = response.token;
          const permissions = response.info?.permissions;
          apiClient.setToken(token);
          setSession({
            username: response.username,
            token,
            displayName: response.displayName,
            isSsoUser: response.isSsoUser,
            permissions,
          });
        })
        .catch(() => setError(t('login.loginError')))
        .finally(() => setLoading(false));
    }

    apiClient
      .getServerStatus()
      .then(response => setSsoEnabled(response.status === 'ok' && response.ssoEnabled))
      .catch(() => setSsoEnabled(false));
  }, [setSession, t]);

  // 已登录时（含刚登录成功）跳转到第一个有查看权限的页面；
  // 用整页跳转确保 apiClient 能从 localStorage 恢复 token，避免组件内请求先于 token 初始化
  useEffect(() => {
    if (isAuthenticated) {
      const target = getFirstPermittedRoute(session?.permissions) ?? '/dashboard';
      window.location.assign(target);
    }
  }, [isAuthenticated, session]);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
      totp: '',
    },
    validate: {
      username: value => (!value ? t('login.usernameRequired') : null),
      password: value => (!value ? t('login.passwordRequired') : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.login(values.username, values.password, values.totp);

      if (response.status === 'ok') {
        const token = response.token;
        const permissions = response.info?.permissions;
        apiClient.setToken(token);
        setSession({
          username: values.username,
          token,
          displayName: response.displayName,
          isSsoUser: false,
          permissions,
        });
        // 跳转到第一个有查看权限的页面；无权限数据（旧会话兼容）时回退到仪表板
        const target = getFirstPermittedRoute(permissions) ?? '/dashboard';
        window.location.assign(target);
      } else if (response.status === '2fa-required') {
        setShow2FA(true);
        setError(t('login.twoFactorRequired'));
      } else {
        setError(response.errorMessage || t('login.loginFailed'));
      }
    } catch {
      setError(t('login.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-shell">
      <Stack w={400} gap="xl" style={{ position: 'relative', zIndex: 1 }}>
        <Stack align="center" gap={4}>
          <Box className="brand-mark" w={56} h={56}>
            <img
              src="/logo.png"
              alt="logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
          <Title order={2} mt="sm" style={{ letterSpacing: '-0.01em' }}>
            {t('layout.title')}
          </Title>
          <Text c="dimmed" size="sm">
            {t('login.subtitle')}
          </Text>
        </Stack>

        <Paper withBorder shadow="xl" p={30} radius="lg">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                  {error}
                </Alert>
              )}

              <TextInput
                label={t('login.usernameLabel')}
                placeholder={t('login.usernamePlaceholder')}
                required
                {...form.getInputProps('username')}
              />

              <PasswordInput
                label={t('login.passwordLabel')}
                placeholder={t('login.passwordPlaceholder')}
                required
                {...form.getInputProps('password')}
              />

              {show2FA && (
                <TextInput
                  label={t('login.totpLabel')}
                  placeholder={t('login.totpPlaceholder')}
                  maxLength={6}
                  {...form.getInputProps('totp')}
                />
              )}

              <Button type="submit" fullWidth loading={loading} size="md" mt="xs">
                {t('login.loginButton')}
              </Button>

              {ssoEnabled && (
                <>
                  <Divider label={t('login.orContinueWith')} labelPosition="center" />
                  <Button
                    type="button"
                    fullWidth
                    variant="default"
                    onClick={() => window.location.assign('/sso/login')}
                  >
                    {t('login.openIdConnect')}
                  </Button>
                </>
              )}
            </Stack>
          </form>
        </Paper>

        <Text size="xs" c="dimmed" ta="center">
          {t('common.copyrightFull', { year: new Date().getFullYear() })}
        </Text>
      </Stack>
    </Box>
  );
}
