'use client';

import { PhotographerClientDto } from '@snapshoot/shared';

const CLIENTS_STORAGE_KEY = 'snapshoot_photographer_clients';

export const INITIAL_CLIENTS: PhotographerClientDto[] = [
  {
    id: 'cli-001',
    photographerId: 'pro-aman',
    name: 'Karan Mehta',
    email: 'karan.mehta@brandreels.in',
    phone: '+91 98201 44552',
    totalShoots: 3,
    totalSpentInr: 14500,
    lastShootDate: '10 Oct 2026',
    notes: 'Regular fashion influencer shoots. Prefers evening golden-hour lighting in Bandra.',
    status: 'ACTIVE',
    createdAt: '2026-08-12T10:00:00.000Z',
  },
  {
    id: 'cli-002',
    photographerId: 'pro-aman',
    name: 'Aman Verma',
    email: 'aman.verma@gmail.com',
    phone: '+91 98112 33441',
    totalShoots: 1,
    totalSpentInr: 12000,
    lastShootDate: '08 Oct 2026',
    notes: '5th Wedding Anniversary couple portrait shoot. Delivered 35 edited 4K JPEGs.',
    status: 'COMPLETED',
    createdAt: '2026-09-01T14:30:00.000Z',
  },
  {
    id: 'cli-003',
    photographerId: 'pro-aman',
    name: 'Simran Grover',
    email: 'simran.grover@fintech.co',
    phone: '+91 99100 88772',
    totalShoots: 4,
    totalSpentInr: 28000,
    lastShootDate: '28 Sep 2026',
    notes: 'Corporate executive headshots & lifestyle leadership profile shoots.',
    status: 'VIP',
    createdAt: '2026-06-15T09:00:00.000Z',
  },
  {
    id: 'cli-004',
    photographerId: 'pro-aman',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@studio.design',
    phone: '+91 97123 66554',
    totalShoots: 2,
    totalSpentInr: 9500,
    lastShootDate: '15 Sep 2026',
    notes: 'Interior & architectural shoot for modern boutique showroom.',
    status: 'ACTIVE',
    createdAt: '2026-07-20T11:00:00.000Z',
  },
  {
    id: 'cli-005',
    photographerId: 'pro-aman',
    name: 'Aditya Singhal',
    email: 'aditya.singhal@outlook.com',
    phone: '+91 98334 22119',
    totalShoots: 1,
    totalSpentInr: 7500,
    lastShootDate: '02 Sep 2026',
    notes: 'Pre-wedding candid outdoor photoshoot.',
    status: 'COMPLETED',
    createdAt: '2026-08-25T16:00:00.000Z',
  },
];

export function getStoredClients(): PhotographerClientDto[] {
  if (typeof window === 'undefined') return INITIAL_CLIENTS;

  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PhotographerClientDto[];
    }
  } catch (err) {
    console.error('Error reading clients state:', err);
  }

  return INITIAL_CLIENTS;
}

export function saveStoredClients(clients: PhotographerClientDto[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    window.dispatchEvent(new Event('snapshoot:clients-change'));
  } catch (err) {
    console.error('Error saving clients state:', err);
  }
}

export function addClient(newClient: Omit<PhotographerClientDto, 'id' | 'createdAt'>): PhotographerClientDto {
  const current = getStoredClients();
  const created: PhotographerClientDto = {
    ...newClient,
    id: `cli-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [created, ...current];
  saveStoredClients(updated);
  return created;
}

export function updateClient(id: string, updates: Partial<PhotographerClientDto>): PhotographerClientDto[] {
  const current = getStoredClients();
  const updated = current.map((c) => (c.id === id ? { ...c, ...updates } : c));
  saveStoredClients(updated);
  return updated;
}

export function deleteClient(id: string): PhotographerClientDto[] {
  const current = getStoredClients();
  const updated = current.filter((c) => c.id !== id);
  saveStoredClients(updated);
  return updated;
}
