import React from 'react';
import { CustomerLayoutClient } from '../../../components/customer/CustomerLayoutClient';

export const metadata = {
  title: 'Client Portal | SnapShoot',
  description: 'Manage photographer bookings, track shoot arrivals, verify OTPs, and access delivered photo galleries.',
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerLayoutClient>{children}</CustomerLayoutClient>;
}
