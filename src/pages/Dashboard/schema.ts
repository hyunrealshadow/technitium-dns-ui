import { z } from 'zod';

export const DashboardSearchSchema = z.object({
  statPeriod: z
    .enum(['lastHour', 'lastDay', 'lastWeek', 'lastMonth', 'lastYear'])
    .optional()
    .default('lastHour'),
});

export type DashboardSearch = z.infer<typeof DashboardSearchSchema>;
