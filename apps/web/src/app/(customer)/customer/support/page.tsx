import React from 'react';
import { UnifiedHelpCenter } from '../../../../components/support/UnifiedHelpCenter';

export const metadata = {
  title: 'Help Center & Concierge Support | REEPY Client Portal',
  description: 'Fast answers, searchable FAQs, and 24/7 concierge support for your photography shoots, OTP arrival, and escrow payments.',
};

export default function CustomerSupportPage() {
  return <UnifiedHelpCenter variant="customer" />;
}
