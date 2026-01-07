import { Modal, Stack, Text, Button } from '@mantine/core';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { errorAtom, clearErrorAtom } from '../../store/error';

export function ErrorModal() {
  const { t } = useTranslation();
  const [error] = useAtom(errorAtom);
  const [, clearError] = useAtom(clearErrorAtom);

  const handleClose = () => {
    clearError();
  };

  return (
    <Modal
      opened={!!error}
      onClose={handleClose}
      title={t('error.title')}
      centered
    >
      {error && (
        <Stack>
          <Text c="red">{error.message}</Text>
          {error.details && (
            <Text size="sm" c="dimmed">
              {error.details}
            </Text>
          )}
          <Button onClick={handleClose} mt="sm">
            {t('common.ok')}
          </Button>
        </Stack>
      )}
    </Modal>
  );
}
