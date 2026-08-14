import { createFileRoute } from '@tanstack/react-router';
import { ZoneBrowser } from '../../components/ZoneBrowser';
import { ZoneBrowserSearchSchema } from '../../components/ZoneBrowser.schema';

function CachePage() {
  return <ZoneBrowser apiBase="cache" />;
}

export const Route = createFileRoute('/_authenticated/cache')({
  component: CachePage,
  validateSearch: ZoneBrowserSearchSchema,
});
