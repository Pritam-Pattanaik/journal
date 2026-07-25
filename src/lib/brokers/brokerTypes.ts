import React from 'react';

export type AuthModel = 
  | 'OAUTH2' 
  | 'API_KEY_SECRET' 
  | 'CLIENT_ID_SECRET_TOTP' 
  | 'DAILY_SESSION_TOKEN' 
  | 'JWT' 
  | 'MANUAL_IMPORT_ONLY';

export type BrokerCapability = 
  | 'AUTO_SYNC' 
  | 'PORTFOLIO' 
  | 'HOLDINGS' 
  | 'POSITIONS' 
  | 'ORDERS' 
  | 'MARGIN' 
  | 'PNL' 
  | 'LIVE_QUOTES' 
  | 'WEBSOCKET_STREAM' 
  | 'HISTORICAL_DATA' 
  | 'MULTI_ACCOUNT' 
  | 'OPTIONS' 
  | 'FNO' 
  | 'MUTUAL_FUNDS';

export interface BrokerFormField {
  id: string; // e.g. 'apiKey', 'apiSecret', 'totpSecret', 'clientId', 'accessToken'
  label: string;
  placeholder: string;
  type: 'text' | 'password' | 'number' | 'url';
  required: boolean;
  isSecret: boolean; // Governs memory sanitization and password field rendering
  regexValidation?: string;
  validationErrorMessage?: string;
  helperText?: string;
}

export interface BrokerProviderDefinition {
  providerId: string; // e.g., 'dhan', 'zerodha', 'angelone', 'groww', 'upstox', '5paisa', 'bullforce'
  name: string;
  tagline: string;
  logoText: string;
  themeColor: string; // Tailwind or Hex color accent for card identity
  region: 'INDIA' | 'USA' | 'GLOBAL';
  authModel: AuthModel;
  tokenLifecycle: {
    expiresDaily: boolean;
    expiryTimeLocal?: string; // e.g., '06:00' or '23:59' IST
    maxLifetimeHours?: number;
    refreshStrategy: 'NONE_MANDATORY_REAUTH' | 'REFRESH_TOKEN_AUTOMATIC' | 'OAUTH_SILENT_GRANT';
  };
  fields: BrokerFormField[];
  capabilities: BrokerCapability[];
  documentation: {
    setupGuideUrl: string;
    apiDocsUrl: string;
    officialPortalUrl: string;
    troubleshootingUrl?: string;
  };
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  recordsImported: number;
  durationMs: number;
  reason?: string;
}

export type BrokerHealthStatus = 'ONLINE' | 'WARNING' | 'EXPIRED' | 'DISCONNECTED';

export interface BrokerAccountConnection {
  id: string; // Unique account instance UUID (Multi-account support)
  providerId: string; // Ref to BrokerProviderDefinition
  accountAlias?: string; // e.g., 'Personal', 'Business F&O', 'Family Vault'
  clientId?: string;
  isActive: boolean;
  healthStatus: BrokerHealthStatus;
  tokenExpiresAt?: string;
  lastSyncedAt?: string;
  lastSyncDurationMs?: number;
  todaySyncCount: number;
  totalRecordsImported: number;
  lastSyncError?: string | null;
  syncHistory: SyncLogEntry[];
  createdAt: string;
}
