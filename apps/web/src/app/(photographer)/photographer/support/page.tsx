import React from 'react';
import { UnifiedHelpCenter } from '../../../../components/support/UnifiedHelpCenter';

export const metadata = {
  title: 'Creator Help Center & Studio Support | REEPY Creator Studio',
  description: 'Verified creator assistance for portfolio uploads, custom pricing, Shoot OTP check-ins, earnings, and escrow payouts.',
};

export default function PhotographerSupportPage() {
  return (
    <div className="py-2">
      <UnifiedHelpCenter variant="creator" />
    </div>
  );
}
