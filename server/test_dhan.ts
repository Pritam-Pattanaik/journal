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
  fromDate.setDate(fromDate.getDate() - 30);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const url = `https://api.dhan.co/v2/trades/${formatDate(fromDate)}/${formatDate(toDate)}/0`;
  console.log('Fetching', url);
  const res = await fetch(url, { headers: { 'Accept': 'application/json', 'access-token': conn.accessToken as string } });
  const data = await res.json();
  const trades = data.data || data;
  if (Array.isArray(trades) && trades.length > 0) {
      console.log('First trade keys:', Object.keys(trades[0]));
      console.log('First trade:', JSON.stringify(trades[0], null, 2));
      console.log('Total trades:', trades.length);
  } else {
      console.log('No trades returned:', JSON.stringify(data));
  }
  process.exit(0);
}
run();
