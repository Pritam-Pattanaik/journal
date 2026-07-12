import { prisma } from './db';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function seedAdmin() {
  const email = 'superadmin@tradevault.com';
  const password = 'SuperAdmin123!';
  const fullName = 'System Super Admin';

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    
    if (existing) {
      console.log('Super admin already exists. Updating role to SUPER_ADMIN...');
      await prisma.user.update({
        where: { email },
        data: { role: 'SUPER_ADMIN' },
      });
    } else {
      console.log('Creating new Super Admin user...');
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          role: 'SUPER_ADMIN',
        },
      });
      console.log('Super admin created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
    }
  } catch (error) {
    console.error('Failed to seed admin:', error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
