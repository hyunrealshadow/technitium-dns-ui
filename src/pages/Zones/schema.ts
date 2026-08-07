import { z } from 'zod';

export const ZonesSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(500).default(10),
  zone: z.string().optional(),
  filterType: z.string().optional(),
});

export type ZonesSearch = z.infer<typeof ZonesSearchSchema>;
