import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '../../pages/Settings';

export const Route = createFileRoute('/_authenticated/settings/optionalProtocols')({
  component: () => <SettingsPage tab="optionalProtocols" />,
});
