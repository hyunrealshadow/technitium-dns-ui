import {
  Anchor,
  AppShell,
  Avatar,
  Box,
  Burger,
  Button,
  Group,
  Menu,
  Modal,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { sessionAtom } from '../../store/auth';
import { useNavigate } from '@tanstack/react-router';
import { apiClient } from '../../api/client';
import { NavLinks } from './NavLinks';
import { AppearanceModal } from '../AppearanceModal.tsx';
import {
  MyProfileModal,
  CreateApiTokenModal,
  ChangePasswordModal,
  Configure2FAModal,
} from '../AccountModals.tsx';
import {
  IconBell,
  IconBellOff,
  IconChevronDown,
  IconKey,
  IconLockPassword,
  IconLogout,
  IconPalette,
  IconShieldLock,
  IconUserCircle,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface UpdateInfo {
  updateAvailable: boolean;
  updateVersion?: string;
  currentVersion?: string;
  updateTitle?: string;
  updateMessage?: string;
  downloadLink?: string;
  instructionsLink?: string;
  changeLogLink?: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { t } = useTranslation();
  const [opened, { toggle }] = useDisclosure();
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [profileOpened, { open: openProfile, close: closeProfile }] = useDisclosure(false);
  const [tokenOpened, { open: openToken, close: closeToken }] = useDisclosure(false);
  const [passwordOpened, { open: openPassword, close: closePassword }] = useDisclosure(false);
  const [twoFaOpened, { open: openTwoFa, close: closeTwoFa }] = useDisclosure(false);
  const [updateOpened, { open: openUpdate, close: closeUpdate }] = useDisclosure(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateNotificationsDisabled, setUpdateNotificationsDisabled] = useState(
    () => localStorage.getItem('disableUpdateNotification') === 'true'
  );
  const [session, setSession] = useAtom(sessionAtom);
  const navigate = useNavigate();

  useEffect(() => {
    if (updateNotificationsDisabled) return;
    apiClient
      .get<UpdateInfo>('/user/checkForUpdate')
      .then(response => {
        if (response.status === 'ok' && response.response?.updateAvailable) {
          setUpdateInfo(response.response);
        }
      })
      .catch(() => undefined);
  }, [updateNotificationsDisabled]);

  const toggleUpdateNotifications = () => {
    const disabled = !updateNotificationsDisabled;
    localStorage.setItem('disableUpdateNotification', String(disabled));
    if (disabled) setUpdateInfo(null);
    setUpdateNotificationsDisabled(disabled);
  };

  const handleLogout = () => {
    setSession(null);
    apiClient.setToken(null);
    navigate({ to: '/login' });
  };

  const accountName = session?.displayName || session?.username || '?';
  const accountInitial = accountName.charAt(0).toUpperCase();

  return (
    <>
      <AppShell
        header={{ height: 64 }}
        navbar={{
          width: { md: 240, xl: 264 },
          breakpoint: 'md',
          collapsed: { mobile: !opened },
        }}
        padding={{ base: 'sm', md: 'md', xl: 'lg' }}
      >
        <AppShell.Header className="app-header">
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
              <Box className="brand-mark" w={34} h={34}>
                <img
                  src="/logo.png"
                  alt="logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </Box>
              <Text fw={700} fz="lg" visibleFrom="xs" style={{ letterSpacing: '-0.01em' }}>
                {t('layout.title')}
              </Text>
            </Group>

            <Group gap="xs" wrap="nowrap">
              {updateInfo && (
                <Button size="xs" variant="light" color="red" onClick={openUpdate}>
                  {t('layout.updateAvailable', { version: updateInfo.updateVersion })}
                </Button>
              )}
              <Menu shadow="md" width={240} position="bottom-end">
                <Menu.Target>
                  <UnstyledButton className="user-menu-btn">
                    <Group gap="xs" wrap="nowrap">
                      <Avatar size="sm" radius="xl" color="brand">
                        {accountInitial}
                      </Avatar>
                      <Text size="sm" fw={500}>
                        {accountName}
                      </Text>
                      <IconChevronDown size={14} style={{ opacity: 0.6 }} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>{t('layout.account')}</Menu.Label>
                  <Menu.Item leftSection={<IconPalette size={14} />} onClick={openSettings}>
                    {t('layout.appearance')}
                  </Menu.Item>
                  <Menu.Item leftSection={<IconUserCircle size={14} />} onClick={openProfile}>
                    {t('layout.myProfile')}
                  </Menu.Item>
                  <Menu.Item leftSection={<IconKey size={14} />} onClick={openToken}>
                    {t('layout.createApiToken')}
                  </Menu.Item>
                  {!session?.isSsoUser && (
                    <>
                      <Menu.Item
                        leftSection={<IconLockPassword size={14} />}
                        onClick={openPassword}
                      >
                        {t('layout.changePassword')}
                      </Menu.Item>
                      <Menu.Item leftSection={<IconShieldLock size={14} />} onClick={openTwoFa}>
                        {t('layout.configure2FA')}
                      </Menu.Item>
                    </>
                  )}
                  <Menu.Item
                    leftSection={
                      updateNotificationsDisabled ? (
                        <IconBell size={14} />
                      ) : (
                        <IconBellOff size={14} />
                      )
                    }
                    onClick={toggleUpdateNotifications}
                  >
                    {updateNotificationsDisabled
                      ? t('layout.enableUpdateNotifications')
                      : t('layout.disableUpdateNotifications')}
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={14} />}
                    onClick={handleLogout}
                  >
                    {t('layout.logout')}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md" className="app-navbar">
          <NavLinks />
        </AppShell.Navbar>

        <AppShell.Main className="app-main">{children}</AppShell.Main>
      </AppShell>

      <AppearanceModal opened={settingsOpened} onClose={closeSettings} />
      <MyProfileModal opened={profileOpened} onClose={closeProfile} />
      <CreateApiTokenModal opened={tokenOpened} onClose={closeToken} />
      <ChangePasswordModal opened={passwordOpened} onClose={closePassword} />
      <Configure2FAModal opened={twoFaOpened} onClose={closeTwoFa} />
      <Modal opened={updateOpened} onClose={closeUpdate} title={updateInfo?.updateTitle} centered>
        {updateInfo && (
          <Stack>
            <Text size="sm">{updateInfo.updateMessage}</Text>
            <Text size="sm" c="dimmed">
              {t('layout.versionUpgrade', {
                current: updateInfo.currentVersion,
                next: updateInfo.updateVersion,
              })}
            </Text>
            <Group>
              {updateInfo.downloadLink && (
                <Anchor href={updateInfo.downloadLink} target="_blank" rel="noreferrer">
                  {t('layout.downloadUpdate')}
                </Anchor>
              )}
              {updateInfo.instructionsLink && (
                <Anchor href={updateInfo.instructionsLink} target="_blank" rel="noreferrer">
                  {t('layout.updateInstructions')}
                </Anchor>
              )}
              {updateInfo.changeLogLink && (
                <Anchor href={updateInfo.changeLogLink} target="_blank" rel="noreferrer">
                  {t('layout.changeLog')}
                </Anchor>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
