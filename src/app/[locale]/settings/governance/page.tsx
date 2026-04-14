import { redirect } from 'next/navigation';

import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';

export default function GovernanceSettingsAliasPage() {
  redirect(ROUTE_HREFS.governanceSettings);
}
