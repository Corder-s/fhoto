import React from 'react';
import { PhotographerLayoutClient } from '../../../components/photographer/PhotographerLayoutClient';

export const metadata = {
  title: 'Creator Studio & Workspace | REEPY',
  description: 'Manage photographer bookings, venue OTP verification, service packages, and instant payouts.',
};

export default function PhotographerLayout({ children }: { children: React.ReactNode }) {
  return <PhotographerLayoutClient>{children}</PhotographerLayoutClient>;
}
