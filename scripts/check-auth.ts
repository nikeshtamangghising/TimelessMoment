import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkAuth() {
  try {
    console.log('🔍 Checking authentication setup...')
    
    // Check all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, password: true }
    })
    
    console.log(`\n📊 Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Password: ${user.password ? 'Hashed' : 'None'}`)
    })
    
    // Test admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })
    
    if (adminUser) {
      console.log('\n✅ Admin user found:')
      console.log(`- Email: ${adminUser.email}`)
      console.log(`- Name: ${adminUser.name}`)
      console.log(`- Role: ${adminUser.role}`)
      console.log(`- Password: ${adminUser.password ? 'Hashed' : 'None'}`)
      
      // Test password validation
      if (adminUser.password) {
        const isValid = await bcrypt.compare('password', adminUser.password)
        console.log(`- Password 'password' valid: ${isValid}`)
      } else {
        console.log('- No password set (will use plain text comparison)')
      }
    } else {
      console.log('\n❌ Admin user not found')
    }
    
    // Test customer user
    const customerUser = await prisma.user.findUnique({
      where: { email: 'customer@example.com' }
    })
    
    if (customerUser) {
      console.log('\n✅ Customer user found:')
      console.log(`- Email: ${customerUser.email}`)
      console.log(`- Name: ${customerUser.name}`)
      console.log(`- Role: ${customerUser.role}`)
      console.log(`- Password: ${customerUser.password ? 'Hashed' : 'None'}`)
    } else {
      console.log('\n❌ Customer user not found')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAuth()
