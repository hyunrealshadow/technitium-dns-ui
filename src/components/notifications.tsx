import { IconX, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

export function success(title: string, message: string) {
  notifications.show({
    title,
    message,
    color: 'teal',
    autoClose: 5000,
    position: 'top-center',
    icon: <IconCheck size={20} />,
  });
}

export function error(title: string, message: string, domain?: string) {
  notifications.show({
    title,
    message: domain ? `${domain}: ${message}` : message,
    color: 'red',
    autoClose: 5000,
    position: 'top-center',
    icon: <IconX size={20} />,
  });
}
