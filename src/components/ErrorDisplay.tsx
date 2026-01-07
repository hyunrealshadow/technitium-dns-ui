import { Paper, Stack, Text, Accordion, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface ErrorDisplayProps {
  message: string;
  details: string | null | undefined;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, details, onRetry }: ErrorDisplayProps) {
  const { t } = useTranslation();

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Stack align="center" py="xl">
        <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
        <Text c="red" size="lg" fw={500}>
          {message}
        </Text>
        {details && (
          <Accordion variant="contained" w="100%" maw={600}>
            <Accordion.Item value="details">
              <Accordion.Control icon={<IconAlertCircle size={16} />}>
                {t('error.details')}
              </Accordion.Control>
              <Accordion.Panel>
                <Text
                  size="sm"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                  }}
                >
                  {details}
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        )}
        {onRetry && (
          <Button onClick={onRetry} mt="md">
            {t('error.retry')}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
