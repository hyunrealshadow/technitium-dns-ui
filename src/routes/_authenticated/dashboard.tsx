import { createFileRoute } from '@tanstack/react-router';

import { DashboardPage } from '../../pages/Dashboard';
import { DashboardSearchSchema } from '../../pages/Dashboard/schema.ts';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
  validateSearch: DashboardSearchSchema,
});
