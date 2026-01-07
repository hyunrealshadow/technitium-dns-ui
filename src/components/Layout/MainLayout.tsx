import {AppShell, Avatar, Burger, Group, Menu, Text, Title} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {useAtom} from 'jotai';
import {useTranslation} from 'react-i18next';
import {sessionAtom} from '../../store/auth';
import {useNavigate} from '@tanstack/react-router';
import {apiClient} from '../../api/client';
import {NavLinks} from './NavLinks';
import {AppearanceModal} from '../AppearanceModal.tsx';
import {IconPalette} from '@tabler/icons-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { t } = useTranslation();
  const [opened, { toggle }] = useDisclosure();
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [session, setSession] = useAtom(sessionAtom);
  const navigate = useNavigate();

  const handleLogout = () => {
    setSession(null);
    apiClient.setToken(null);
    navigate({ to: '/login' });
  };

  return (
    <>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 250,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <Title order={3}>{t('layout.title')}</Title>
            </Group>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Group style={{ cursor: 'pointer' }}>
                  <Avatar size="sm" radius="xl" />
                  <Text size="sm">{session?.displayName || session?.username}</Text>
                </Group>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>{t('layout.account')}</Menu.Label>
                <Menu.Item leftSection={<IconPalette size={14} />} onClick={openSettings}>
                  {t('layout.appearance')}
                </Menu.Item>
                <Menu.Item>{t('layout.myProfile')}</Menu.Item>
                <Menu.Item>{t('layout.createApiToken')}</Menu.Item>
                <Menu.Item>{t('layout.changePassword')}</Menu.Item>
                <Menu.Item>{t('layout.configure2FA')}</Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" onClick={handleLogout}>
                  {t('layout.logout')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <NavLinks />
        </AppShell.Navbar>

        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>

      <AppearanceModal opened={settingsOpened} onClose={closeSettings} />
    </>
  );
}
