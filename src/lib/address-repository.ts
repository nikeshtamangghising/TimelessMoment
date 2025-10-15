import { prisma } from './db'
import { CreateAddressInput, UpdateAddressInput } from './validations'
import type { Address } from '@/types'

export class AddressRepository {
  async create(data: CreateAddressInput & { userId: string }): Promise<Address> {
    return prisma.address.create({
      data: {
        userId: data.userId,
        type: (data as any).type,
        fullName: data.fullName,
        email: (data as any).email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault,
      },
    })
  }

  async findById(id: string): Promise<Address | null> {
    return prisma.address.findUnique({
      where: { id },
    })
  }

  async findByUserId(userId: string): Promise<Address[]> {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
    })
  }

  async findDefaultAddress(userId: string, type: 'SHIPPING' | 'BILLING' = 'SHIPPING'): Promise<Address | null> {
    return prisma.address.findFirst({
      where: {
        userId,
        type,
        isDefault: true,
      },
    })
  }

  async update(id: string, data: UpdateAddressInput): Promise<Address> {
    // If setting as default, clear other defaults first
    if (data.isDefault) {
      const address = await prisma.address.findUnique({
        where: { id },
        select: { userId: true, type: true },
      })

      if (address) {
        await this.clearDefaultAddresses(address.userId, address.type)
      }
    }

    return prisma.address.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.address.delete({
      where: { id },
    })
  }

  async clearDefaultAddresses(userId: string, type: 'SHIPPING' | 'BILLING'): Promise<void> {
    await prisma.address.updateMany({
      where: {
        userId,
        type,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    })
  }

  async setDefaultAddress(id: string): Promise<Address> {
    const address = await prisma.address.findUnique({
      where: { id },
      select: { userId: true, type: true },
    })

    if (!address) {
      throw new Error('Address not found')
    }

    // Clear other defaults for this user and type
    await this.clearDefaultAddresses(address.userId, address.type)

    // Set this address as default
    return prisma.address.update({
      where: { id },
      data: { isDefault: true },
    })
  }
}

export const addressRepository = new AddressRepository()
