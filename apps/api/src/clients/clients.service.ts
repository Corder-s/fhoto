import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PhotographerClientDto } from '@snapshoot/shared';

@Injectable()
export class ClientsService {
  // Store keyed by photographerId (Tenant Partition)
  private clientsStore: Map<string, PhotographerClientDto[]> = new Map([
    [
      'pro-aman',
      [
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
      ],
    ],
  ]);

  constructor(private readonly prisma: PrismaService) {}

  // List my clients (Strictly scoped by photographerId)
  async getMyClients(photographerId: string): Promise<PhotographerClientDto[]> {
    if (!photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.clientsStore.get(photographerId) || [];
  }

  // Get single client (Verifies ownership, rejects cross-tenant access)
  async getClientById(photographerId: string, clientId: string): Promise<PhotographerClientDto> {
    const list = this.clientsStore.get(photographerId) || [];
    const client = list.find((c) => c.id === clientId);

    if (!client) {
      // Check if client exists under another photographer to verify cross-tenant rejection
      for (const [otherTenantId, otherClients] of this.clientsStore.entries()) {
        if (otherTenantId !== photographerId && otherClients.some((c) => c.id === clientId)) {
          throw new ForbiddenException(
            'Cross-tenant access rejected: You are not authorized to view this client record.',
          );
        }
      }
      throw new NotFoundException(`Client '${clientId}' not found in your directory.`);
    }

    return client;
  }

  // Create new client (Enforces photographerId ownership)
  async createClient(
    photographerId: string,
    data: Omit<PhotographerClientDto, 'id' | 'createdAt' | 'photographerId'>,
  ): Promise<PhotographerClientDto> {
    if (!data.name || !data.phone) {
      throw new BadRequestException('Client requires valid name and phone number.');
    }

    const current = this.clientsStore.get(photographerId) || [];

    // Check unique constraint per photographer: @@unique([photographerId, phone])
    const duplicate = current.find((c) => c.phone === data.phone);
    if (duplicate) {
      throw new BadRequestException(`Client with phone ${data.phone} already exists in your directory.`);
    }

    const created: PhotographerClientDto = {
      ...data,
      id: `cli-${Date.now().toString().slice(-6)}`,
      photographerId, // Immutable tenant ownership
      createdAt: new Date().toISOString(),
    };

    this.clientsStore.set(photographerId, [created, ...current]);
    return created;
  }

  // Update client (Enforces ownership, rejects cross-tenant edits)
  async updateClient(
    photographerId: string,
    clientId: string,
    updates: Partial<PhotographerClientDto>,
  ): Promise<PhotographerClientDto> {
    const current = this.clientsStore.get(photographerId) || [];
    const target = current.find((c) => c.id === clientId);

    if (!target) {
      for (const [otherTenantId, otherClients] of this.clientsStore.entries()) {
        if (otherTenantId !== photographerId && otherClients.some((c) => c.id === clientId)) {
          throw new ForbiddenException(
            'Cross-tenant modification rejected: You cannot edit another photographer\'s client.',
          );
        }
      }
      throw new NotFoundException(`Client '${clientId}' not found in your directory.`);
    }

    const updated: PhotographerClientDto = {
      ...target,
      ...updates,
      id: clientId,
      photographerId, // Prevents tenant reassignment
    };

    const nextList = current.map((c) => (c.id === clientId ? updated : c));
    this.clientsStore.set(photographerId, nextList);

    return updated;
  }

  // Delete client (Enforces ownership, rejects cross-tenant deletions)
  async deleteClient(photographerId: string, clientId: string): Promise<{ success: boolean }> {
    const current = this.clientsStore.get(photographerId) || [];
    const exists = current.some((c) => c.id === clientId);

    if (!exists) {
      for (const [otherTenantId, otherClients] of this.clientsStore.entries()) {
        if (otherTenantId !== photographerId && otherClients.some((c) => c.id === clientId)) {
          throw new ForbiddenException(
            'Cross-tenant deletion rejected: You cannot delete another photographer\'s client.',
          );
        }
      }
      throw new NotFoundException(`Client '${clientId}' not found in your directory.`);
    }

    const filtered = current.filter((c) => c.id !== clientId);
    this.clientsStore.set(photographerId, filtered);
    return { success: true };
  }
}
