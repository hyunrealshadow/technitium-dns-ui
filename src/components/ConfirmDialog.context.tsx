import { useCallback, type ReactNode } from 'react';
import { Text, type MantineColor } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useTranslation } from 'react-i18next';

export interface ConfirmDialogOptions {
  title?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  color?: MantineColor;
}

export type ConfirmDialog = (
  message: ReactNode,
  options?: ConfirmDialogOptions
) => Promise<boolean>;

export function useConfirmDialog(): ConfirmDialog {
  const { t } = useTranslation();

  return useCallback(
    (message, options = {}) =>
      new Promise<boolean>(resolve => {
        let settled = false;
        const settle = (confirmed: boolean) => {
          if (settled) return;
          settled = true;
          resolve(confirmed);
        };

        modals.openConfirmModal({
          title: options.title ?? t('common.confirm'),
          centered: true,
          children: (
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {message}
            </Text>
          ),
          labels: {
            confirm: options.confirmLabel ?? t('common.confirm'),
            cancel: options.cancelLabel ?? t('common.cancel'),
          },
          confirmProps: { color: options.color ?? 'blue' },
          onCancel: () => settle(false),
          onConfirm: () => settle(true),
          onClose: () => settle(false),
        });
      }),
    [t]
  );
}
