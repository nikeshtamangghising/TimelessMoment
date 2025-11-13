import { db } from './db'
import { addresses } from './db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { CreateAddressInput, UpdateAddressInput } from './validations'
import type { Address } from '@/types'

export class AddressRepository {
  async create(data: CreateAddressInput & { userId: string }): Promise<Address> {
    const insertResult = await db.insert(addresses)
      .values({
        userId: data.userId,
        type: (data as any).type,
        firstName: data.fullName.split(' ')[0] || data.fullName,
        lastName: data.fullName.split(' ').slice(1).join(' ') || '',
        phone: data.phone,
        addressLine1: data.address,
        city: data.city,
        state: (data as any).state || '',
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault || false,
      } as any)
      .returning();
    
    return insertResult[0] as Address;
  }

  async findById(id: string): Promise<Address | null> {
    const result = await db.select()
      .from(addresses)
      .where(eq(addresses.id, id))
      .limit(1);
    
    return (result[0] as Address) || null;
  }

  async findByUserId(userId: string): Promise<Address[]> {
    return await db.select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt)) as Address[];
  }

  async findDefaultAddress(userId: string, type: 'SHIPPING' | 'BILLING' = 'SHIPPING'): Promise<Address | null> {
    const result = await db.select()
      .from(addresses)
      .where(and(
        eq(addresses.userId, userId),
        eq(addresses.type, type),
        eq(addresses.isDefault, true)
      ))
      .limit(1);
    
    return (result[0] as Address) || null;
  }

  async update(id: string, data: UpdateAddressInput): Promise<Address> {
    // If setting as default, clear other defaults first
    if (data.isDefault) {
      const addressResult = await db.select({ userId: addresses.userId, type: addresses.type })
        .from(addresses)
        .where(eq(addresses.id, id))
        .limit(1);

      if (addressResult[0]) {
        await this.clearDefaultAddresses(addressResult[0].userId, addressResult[0].type as 'SHIPPING' | 'BILLING');
      }
    }

    const updateResult = await db.update(addresses)
      .set(data as any)
      .where(eq(addresses.id, id))
      .returning();
    
    return updateResult[0] as Address;
  }

  async delete(id: string): Promise<void> {
    await db.delete(addresses)
      .where(eq(addresses.id, id));
  }

  async clearDefaultAddresses(userId: string, type: 'SHIPPING' | 'BILLING'): Promise<void> {
    await db.update(addresses)
      .set({ isDefault: false })
      .where(and(
        eq(addresses.userId, userId),
        eq(addresses.type, type),
        eq(addresses.isDefault, true)
      ));
  }

  async setDefaultAddress(id: string): Promise<Address> {
    const addressResult = await db.select({ userId: addresses.userId, type: addresses.type })
      .from(addresses)
      .where(eq(addresses.id, id))
      .limit(1);

    if (!addressResult[0]) {
      throw new Error('Address not found');
    }

    // Clear other defaults for this user and type
    await this.clearDefaultAddresses(addressResult[0].userId, addressResult[0].type as 'SHIPPING' | 'BILLING');

    // Set this address as default
    const updateResult = await db.update(addresses)
      .set({ isDefault: true })
      .where(eq(addresses.id, id))
      .returning();
    
    return updateResult[0] as Address;
  }
}

export const addressRepository = new AddressRepository()
