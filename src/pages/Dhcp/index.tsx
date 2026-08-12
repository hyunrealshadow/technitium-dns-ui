import { LeasesTab } from './tabs/LeasesTab';
import { ScopesTab } from './tabs/ScopesTab';

export function DhcpPage({ tab = 'leases' }: { tab?: 'leases' | 'scopes' }) {
  return tab === 'scopes' ? <ScopesTab /> : <LeasesTab />;
}
