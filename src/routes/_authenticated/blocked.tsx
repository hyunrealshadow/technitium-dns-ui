import { createFileRoute } from '@tanstack/react-router';
import { ZoneBrowser } from '../../components/ZoneBrowser';
import { ZoneBrowserSearchSchema } from '../../components/ZoneBrowser.schema';

function BlockedPage() {
  return <ZoneBrowser apiBase="blocked" />;
}

export const Route = createFileRoute('/_authenticated/blocked')({
  component: BlockedPage,
  validateSearch: ZoneBrowserSearchSchema,
});
