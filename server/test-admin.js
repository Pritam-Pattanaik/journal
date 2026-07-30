const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-dev-only-change-in-prod';

async function run() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) {
    console.log('No SUPER_ADMIN found');
    process.exit(1);
  }
  
  const token = jwt.sign({ userId: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '1h' });
  console.log('Token generated');
  
  try {
    const fetch = (await import('node-fetch')).default;

    const res = await fetch('http://localhost:3000/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Stats status:', res.status);
    console.log(await res.text());
    
    const res2 = await fetch('http://localhost:3000/api/admin/stats/activity', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Activity status:', res2.status);
    console.log(await res2.text());
    
    const res3 = await fetch('http://localhost:3000/api/admin/stats/charts?period=daily', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Charts status:', res3.status);
    console.log(await res3.text());
    
  } catch (err) {
    console.log('Error hitting API', err);
  }
  
  await prisma.$disconnect();
}
run();
