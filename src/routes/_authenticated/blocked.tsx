import { createFileRoute } from '@tanstack/react-router';
import { ZoneBrowser, ZoneBrowserSearchSchema } from '../../components/ZoneBrowser';

function BlockedPage() {
  return <ZoneBrowser apiBase="blocked" />;
}

export const Route = createFileRoute('/_authenticated/blocked')({
  component: BlockedPage,
  validateSearch: ZoneBrowserSearchSchema,
});
