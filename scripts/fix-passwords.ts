import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function fixPasswords() {
  try {
    console.log('🔧 Fixing passwords...')
    
    // Update admin password to 'password' for demo
    const adminHashedPassword = await bcrypt.hash('password', 12)
    await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: { password: adminHashedPassword }
    })
    console.log('✅ Admin password updated to "password"')
    
    // Update customer passwords to 'password123' for demo
    const customerHashedPassword = await bcrypt.hash('password123', 12)
    await prisma.user.updateMany({
      where: { 
        role: 'CUSTOMER',
        email: { in: ['john.doe@example.com', 'jane.smith@example.com', 'mike.johnson@example.com'] }
      },
      data: { password: customerHashedPassword }
    })
    console.log('✅ Customer passwords updated to "password123"')
    
    // Verify the changes
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })
    
    if (adminUser) {
      const isValid = await bcrypt.compare('password', adminUser.password!)
      console.log(`✅ Admin password 'password' valid: ${isValid}`)
    }
    
    const customerUser = await prisma.user.findUnique({
      where: { email: 'john.doe@example.com' }
    })
    
    if (customerUser) {
      const isValid = await bcrypt.compare('password123', customerUser.password!)
      console.log(`✅ Customer password 'password123' valid: ${isValid}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPasswords()
