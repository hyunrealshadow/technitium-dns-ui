import {createFileRoute} from '@tanstack/react-router';
import {ZonesPage} from '../../pages/Zones';
import {ZonesSearchSchema} from '../../pages/Zones/schema.ts';

export const Route = createFileRoute('/_authenticated/zones')({
  component: ZonesPage,
  validateSearch: ZonesSearchSchema,
});
