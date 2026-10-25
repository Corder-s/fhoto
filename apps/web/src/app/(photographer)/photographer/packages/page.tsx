'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PhotographerPackagesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/photographer/services');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
