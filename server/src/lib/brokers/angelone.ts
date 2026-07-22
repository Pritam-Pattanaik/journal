import { TOTP } from 'totp-generator';

const ANGELONE_API_BASE = 'https://apiconnect.angelbroking.com/rest';

export async function loginAngelOne(clientCode: string, password: string, totpSecret: string, apiKey: string) {
  try {
    // TOTP.generate() returns a Promise — must be awaited
    const { otp } = await TOTP.generate(totpSecret);

    const response = await fetch(
      `${ANGELONE_API_BASE}/auth/angelbroking/user/v1/loginByPassword`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '127.0.0.1',
          'X-ClientPublicIP': '127.0.0.1',
          'X-MACAddress': '00:00:00:00:00:00',
          'X-PrivateKey': apiKey,
        },
        body: JSON.stringify({
          clientcode: clientCode,
          password: password,
          totp: otp,
        }),
      }
    );

    const data = await response.json();

    if (data.status && data.data) {
      return {
        jwtToken: data.data.jwtToken as string,
        refreshToken: data.data.refreshToken as string,
        feedToken: data.data.feedToken as string,
      };
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error: any) {
    console.error('Angel One Login Error:', error.message);
    throw new Error(error.message || 'Failed to authenticate with Angel One');
  }
}

export async function syncAngelOneTrades(
  clientCode: string,
  jwtToken: string,
  apiKey: string,
  userId: string,
  _existingOpenTrades: any[] = [],
  _lastSyncedAt: Date | null = null
) {
  // Angel One's tradebook API gets today's trades.
  // Endpoint: /rest/secure/angelbroking/order/v1/getTradeBook
  try {
    const response = await fetch(
      `${ANGELONE_API_BASE}/secure/angelbroking/order/v1/getTradeBook`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '127.0.0.1',
          'X-ClientPublicIP': '127.0.0.1',
          'X-MACAddress': '00:00:00:00:00:00',
          'X-PrivateKey': apiKey,
        },
      }
    );

    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }

    const data = await response.json();

    if (!data.status) {
      if (data.message === 'Invalid Token') {
        throw new Error('TOKEN_EXPIRED'); // caught in index.ts to trigger auto-login
      }
      throw new Error(data.message || 'Failed to fetch tradebook');
    }

    const tradesData = data.data || [];

    // Trade parsing to be implemented once Angel One schema is confirmed.
    console.log('Fetched Angel One trades:', tradesData.length);

    return { tradesToInsert: [], tradesToUpdate: [], latestTradeTime: new Date() };

  } catch (error: any) {
    if (error.message === 'TOKEN_EXPIRED') {
      throw new Error('TOKEN_EXPIRED');
    }
    console.error('Angel One Sync Error:', error.message);
    throw error;
  }
}
