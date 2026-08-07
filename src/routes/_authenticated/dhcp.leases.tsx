import { createFileRoute } from '@tanstack/react-router';
import { DhcpPage } from '../../pages/Dhcp';

export const Route = createFileRoute('/_authenticated/dhcp/leases')({
  component: () => <DhcpPage tab="leases" />,
});
