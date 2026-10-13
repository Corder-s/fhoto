'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customer/settings');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#FF6E00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
