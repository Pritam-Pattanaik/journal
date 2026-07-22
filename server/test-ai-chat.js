const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No users found in DB.');
    process.exit(1);
  }
  
  console.log('Found user:', user.email);
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'super_secret_jwt_key_12345', { expiresIn: '1h' });

  // Create a conversation for the test
  const conv = await prisma.aiConversation.create({
    data: {
      userId: user.id,
      title: 'Debug Test Chat'
    }
  });

  console.log('Created conversation:', conv.id);

  // Now make the request to the local API
  const url = 'http://localhost:3000/api/ai/chat';
  const reqOpts = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      conversationId: conv.id,
      message: 'Test message for debugging.'
    })
  };

  console.log('Sending request to', url);
  const res = await fetch(url, reqOpts);
  
  console.log('Status:', res.status, res.statusText);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    const text = await res.text();
    console.error('Error response:', text);
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let done = false;

  console.log('--- STREAM START ---');
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (readerDone) {
      done = true;
      break;
    }
    const chunkString = decoder.decode(value, { stream: true });
    console.log(chunkString);
  }
  console.log('--- STREAM END ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
