import { createFileRoute } from '@tanstack/react-router';
import { ZoneBrowser } from '../../components/ZoneBrowser';
import { ZoneBrowserSearchSchema } from '../../components/ZoneBrowser.schema';

function AllowedPage() {
  return <ZoneBrowser apiBase="allowed" />;
}

export const Route = createFileRoute('/_authenticated/allowed')({
  component: AllowedPage,
  validateSearch: ZoneBrowserSearchSchema,
});
