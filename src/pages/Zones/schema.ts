import { z } from 'zod';

export const ZonesSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  zone: z.string().optional(),
  filterName: z.string().optional(),
  filterType: z.string().optional(),
  recordsPage: z.coerce.number().min(1).default(1),
});

export type ZonesSearch = z.infer<typeof ZonesSearchSchema>;
