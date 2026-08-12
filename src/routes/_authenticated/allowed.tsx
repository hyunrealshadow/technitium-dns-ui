import { createFileRoute } from '@tanstack/react-router';
import { ZoneBrowser, ZoneBrowserSearchSchema } from '../../components/ZoneBrowser';

function AllowedPage() {
  return <ZoneBrowser apiBase="allowed" />;
}

export const Route = createFileRoute('/_authenticated/allowed')({
  component: AllowedPage,
  validateSearch: ZoneBrowserSearchSchema,
});
