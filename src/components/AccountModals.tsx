import { useEffect, useState } from 'react';
import { Button, Code, Group, Image, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from './notifications';
import { apiClient } from '../api/client';
import { useAtom } from 'jotai';
import { sessionAtom } from '../store/auth';
import { useConfirmDialog } from './ConfirmDialog.context';

export function MyProfileModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [, setSession] = useAtom(sessionAtom);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState('7200');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) return;
    apiClient
      .get<{ displayName: string; username: string; sessionTimeoutSeconds: number }>(
        '/user/profile/get'
      )
      .then(response => {
        if (response.status === 'ok' && response.response) {
          setDisplayName(response.response.displayName);
          setUsername(response.response.username);
          setSessionTimeout(String(response.response.sessionTimeoutSeconds));
        }
      })
      .catch(() => error(t('common.error'), t('account.profileLoadFailed')));
  }, [opened, t]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post('/user/profile/set', {
        displayName,
        sessionTimeoutSeconds: sessionTimeout,
      });
      if (response.status === 'ok') {
        setSession(prev => (prev ? { ...prev, displayName } : prev));
        success(t('common.success'), t('account.profileSaved'));
        onClose();
      }
    } catch {
      error(t('common.error'), t('account.profileSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('layout.myProfile')} centered>
      <Stack>
        <TextInput
          label={t('common.displayName')}
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
        />
        <TextInput label={t('common.username')} value={username} disabled />
        <TextInput
          label={t('account.sessionTimeoutSec')}
          value={sessionTimeout}
          onChange={e => setSessionTimeout(e.target.value)}
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save} loading={saving}>
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function CreateApiTokenModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [token, setToken] = useState<{ username: string; tokenName: string; token: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) {
      setToken(null);
      setPassword('');
      setTotp('');
      setTokenName('');
    }
  }, [opened]);

  const create = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post<{ username: string; tokenName: string; token: string }>(
        '/user/createToken',
        { user: username, pass: password, totp, tokenName }
      );
      if (response.status === 'ok' && response.response) {
        setToken(response.response);
      } else {
        throw new Error(response.errorMessage || 'Failed');
      }
    } catch {
      error(t('common.error'), t('account.createTokenFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('layout.createApiToken')} centered>
      <Stack>
        {token ? (
          <>
            <Text size="sm">{t('account.tokenCreatedHint')}</Text>
            <Code block>
              {token.username}
              {'\n'}
              {token.tokenName}
              {'\n'}
              {token.token}
            </Code>
          </>
        ) : (
          <>
            <TextInput
              label={t('common.username')}
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <TextInput
              label={t('common.password')}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <TextInput
              label={t('account.otpLabel')}
              value={totp}
              onChange={e => setTotp(e.target.value)}
            />
            <TextInput
              label={t('account.tokenName')}
              value={tokenName}
              onChange={e => setTokenName(e.target.value)}
            />
            <Group justify="flex-end">
              <Button variant="subtle" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button onClick={create} loading={saving}>
                {t('account.create')}
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}

export function ChangePasswordModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTotp('');
    }
  }, [opened]);

  const change = async () => {
    if (!currentPassword) {
      error(t('common.error'), t('account.currentPasswordRequired'));
      return;
    }
    if (!newPassword) {
      error(t('common.error'), t('account.newPasswordRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      error(t('common.error'), t('account.passwordsMismatch'));
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.post('/user/changePassword', {
        pass: currentPassword,
        newPass: newPassword,
        totp,
      });
      if (response.status === 'ok') {
        success(t('common.success'), t('account.passwordChanged'));
        onClose();
      }
    } catch {
      error(t('common.error'), t('account.passwordChangeFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('layout.changePassword')} centered>
      <Stack>
        <TextInput
          label={t('account.currentPassword')}
          type="password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
        />
        <TextInput
          label={t('account.newPassword')}
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />
        <TextInput
          label={t('account.confirmPassword')}
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
        <TextInput
          label={t('account.otpLabel')}
          value={totp}
          onChange={e => setTotp(e.target.value)}
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={change} loading={saving}>
            {t('account.change')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function Configure2FAModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const confirmDialog = useConfirmDialog();
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [totp, setTotp] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setTotp('');
    apiClient
      .get<{ totpEnabled: boolean; secret: string; qrCodePngImage: string }>('/user/2fa/init')
      .then(response => {
        if (response.status === 'ok' && response.response) {
          setTotpEnabled(response.response.totpEnabled);
          setSecret(response.response.secret);
          setQrCode(response.response.qrCodePngImage);
        }
      })
      .catch(() => error(t('common.error'), t('account.twoFaLoadFailed')));
  }, [opened, t]);

  const enable = async () => {
    if (totp.length !== 6) {
      error(t('common.error'), t('account.otpRequired'));
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.post(
        `/user/2fa/enable?totp=${encodeURIComponent(totp)}`,
        {}
      );
      if (response.status === 'ok') {
        success(t('common.success'), t('account.twoFaEnabled'));
        onClose();
      }
    } catch {
      error(t('common.error'), t('account.twoFaEnableFailed'));
    } finally {
      setSaving(false);
    }
  };

  const disable = async () => {
    if (!(await confirmDialog(t('account.twoFaDisableConfirm'), { color: 'red' }))) return;
    setSaving(true);
    try {
      const response = await apiClient.post('/user/2fa/disable', {});
      if (response.status === 'ok') {
        success(t('common.success'), t('account.twoFaDisabled'));
        onClose();
      }
    } catch {
      error(t('common.error'), t('account.twoFaDisableFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('layout.configure2FA')} centered>
      <Stack>
        <Text>
          {t('account.twoFaStatus')}{' '}
          <Text span c={totpEnabled ? 'green' : 'gray'} fw={600}>
            {totpEnabled ? t('common.enabled') : t('common.disabled')}
          </Text>
        </Text>
        {!totpEnabled && qrCode && (
          <>
            <Image src={`data:image/png;base64,${qrCode}`} w={220} alt="QR Code" />
            <Text size="sm" c="dimmed">
              {t('account.scanQrHint')}
            </Text>
            <Code block>{secret}</Code>
            <TextInput
              label={t('account.otpLabel')}
              placeholder={t('login.totpPlaceholder')}
              value={totp}
              onChange={e => setTotp(e.target.value)}
            />
            <Group justify="flex-end">
              <Button variant="subtle" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button onClick={enable} loading={saving}>
                {t('account.enable')}
              </Button>
            </Group>
          </>
        )}
        {totpEnabled && (
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button color="red" onClick={disable} loading={saving}>
              {t('account.disable')}
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
}
