import { db } from './src/db';
import { brokerConnections } from './src/db/schema';

async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const conns = await db.select().from(brokerConnections);
  if (!conns.length) {
    console.log('no conns');
    process.exit(0);
  }
  const conn = conns[0];
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 90);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const url = `https://api.dhan.co/v2/trades/${formatDate(fromDate)}/${formatDate(toDate)}/0`;
  console.log('Fetching', url);
  const res = await fetch(url, { headers: { 'Accept': 'application/json', 'access-token': conn.accessToken as string } });
  const data = await res.json();
  console.log('Status:', res.status, 'Data:', JSON.stringify(data).substring(0,200));
  process.exit(0);
}
run();
