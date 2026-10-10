'use client';

import React from 'react';
import { UnifiedCustomerHomepageView } from '../../../../components/customer/UnifiedCustomerHomepageView';

export default function CustomerDashboardPage() {
  return <UnifiedCustomerHomepageView layoutOrder="dashboard-first" showDiscoverySections={true} />;
}
