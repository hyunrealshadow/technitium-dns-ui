import { z } from 'zod';

// Keep route validation separate from the heavy ZoneBrowser component so route
// code splitting does not pull the editor and record UI into the entry chunk.
export const ZoneBrowserSearchSchema = z.object({
  domain: z.string().optional(),
});

export type ZoneBrowserSearch = z.infer<typeof ZoneBrowserSearchSchema>;
