import { Modal, SegmentedControl, Stack, Text, Select } from '@mantine/core';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { colorModeAtom } from '../store/theme.ts';

interface AppearanceModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AppearanceModal({ opened, onClose }: AppearanceModalProps) {
  const { t, i18n } = useTranslation();
  const [colorMode, setColorMode] = useAtom(colorModeAtom);

  const handleLanguageChange = async (value: string | null) => {
    if (value) {
      await i18n.changeLanguage(value);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('layout.appearance')} centered size="sm">
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb="xs">
            {t('theme.mode')}
          </Text>
          <SegmentedControl
            value={colorMode}
            onChange={value => setColorMode(value as 'light' | 'dark' | 'auto')}
            data={[
              { label: t('theme.light'), value: 'light' },
              { label: t('theme.dark'), value: 'dark' },
              { label: t('theme.system'), value: 'auto' },
            ]}
            fullWidth
          />
        </div>

        <div>
          <Text size="sm" fw={500} mb="xs">
            {t('language.name')}
          </Text>
          <Select
            value={i18n.language}
            onChange={handleLanguageChange}
            data={[
              { value: 'en', label: 'English' },
              { value: 'zh', label: '中文' },
            ]}
            style={{ width: '100%' }}
          />
        </div>
      </Stack>
    </Modal>
  );
}
