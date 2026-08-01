import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { isAuthenticatedAtom, sessionAtom } from '../store/auth';
import { apiClient } from '../api/client';
import { useNavigate } from '@tanstack/react-router';
import { IconAlertCircle } from '@tabler/icons-react';

export function LoginPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show2FA, setShow2FA] = useState(false);
  const setSession = useSetAtom(sessionAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const navigate = useNavigate();

  // 如果已登录，自动跳转到 dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, navigate]);

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
        apiClient.setToken(token);
        setSession({
          username: values.username,
          token,
          displayName: response.displayName,
        });
        navigate({ to: '/dashboard' });
      } else if (response.status === '2fa-required') {
        setShow2FA(true);
        setError(t('login.twoFactorRequired'));
      } else {
        setError(response.errorMessage || t('login.loginFailed'));
      }
    } catch (err) {
      setError(t('login.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={100}>
      <Title ta="center" mb="md">
        {t('login.title')}
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
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

            <Button type="submit" fullWidth loading={loading}>
              {t('login.loginButton')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
