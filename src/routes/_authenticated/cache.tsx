import { createFileRoute } from '@tanstack/react-router';
import { ZoneBrowser, ZoneBrowserSearchSchema } from '../../components/ZoneBrowser';

function CachePage() {
  return <ZoneBrowser apiBase="cache" />;
}

export const Route = createFileRoute('/_authenticated/cache')({
  component: CachePage,
  validateSearch: ZoneBrowserSearchSchema,
});
