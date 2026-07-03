import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function seedAdmin() {
  const email = 'superadmin@tradevault.com';
  const password = 'SuperAdmin123!';
  const fullName = 'System Super Admin';

  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    
    if (existing.length > 0) {
      console.log('Super admin already exists. Updating role to SUPER_ADMIN...');
      await db.update(users).set({ role: 'SUPER_ADMIN' }).where(eq(users.email, email));
    } else {
      console.log('Creating new Super Admin user...');
      const hashedPassword = await bcrypt.hash(password, 12);
      await db.insert(users).values({
        email,
        password: hashedPassword,
        fullName,
        role: 'SUPER_ADMIN',
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
