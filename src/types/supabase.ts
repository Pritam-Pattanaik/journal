export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          timezone: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      broker_connections: {
        Row: {
          id: string
          user_id: string
          broker: 'zerodha' | 'angelone'
          api_key: string | null
          access_token: string | null
          refresh_token: string | null
          token_expiry: string | null
          client_id: string | null
          is_active: boolean | null
          last_synced_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          broker: 'zerodha' | 'angelone'
          api_key?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          client_id?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          broker?: 'zerodha' | 'angelone'
          api_key?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          client_id?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
          created_at?: string | null
        }
      }
      strategies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          rules: string | null
          market: string[] | null
          timeframe: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          rules?: string | null
          market?: string[] | null
          timeframe?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          rules?: string | null
          market?: string[] | null
          timeframe?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          broker: string
          broker_trade_id: string | null
          date: string
          symbol: string
          market: 'NSE' | 'BSE' | 'F&O' | 'Crypto'
          instrument_type: 'EQ' | 'CE' | 'PE' | 'FUT' | 'CRYPTO'
          direction: 'LONG' | 'SHORT' | null
          entry_price: number | null
          exit_price: number | null
          quantity: number | null
          pnl: number | null
          charges: number | null
          net_pnl: number | null
          status: 'WIN' | 'LOSS' | 'BREAKEVEN' | null
          strategy_id: string | null
          setup_description: string | null
          mindset: string | null
          decision_notes: string | null
          learnings: string | null
          discipline_score: number | null
          tags: string[] | null
          source: 'broker_sync' | 'manual' | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          broker: string
          broker_trade_id?: string | null
          date: string
          symbol: string
          market: 'NSE' | 'BSE' | 'F&O' | 'Crypto'
          instrument_type: 'EQ' | 'CE' | 'PE' | 'FUT' | 'CRYPTO'
          direction?: 'LONG' | 'SHORT' | null
          entry_price?: number | null
          exit_price?: number | null
          quantity?: number | null
          pnl?: number | null
          charges?: number | null
          net_pnl?: number | null
          status?: 'WIN' | 'LOSS' | 'BREAKEVEN' | null
          strategy_id?: string | null
          setup_description?: string | null
          mindset?: string | null
          decision_notes?: string | null
          learnings?: string | null
          discipline_score?: number | null
          tags?: string[] | null
          source?: 'broker_sync' | 'manual' | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          broker?: string
          broker_trade_id?: string | null
          date?: string
          symbol?: string
          market?: 'NSE' | 'BSE' | 'F&O' | 'Crypto'
          instrument_type?: 'EQ' | 'CE' | 'PE' | 'FUT' | 'CRYPTO'
          direction?: 'LONG' | 'SHORT' | null
          entry_price?: number | null
          exit_price?: number | null
          quantity?: number | null
          pnl?: number | null
          charges?: number | null
          net_pnl?: number | null
          status?: 'WIN' | 'LOSS' | 'BREAKEVEN' | null
          strategy_id?: string | null
          setup_description?: string | null
          mindset?: string | null
          decision_notes?: string | null
          learnings?: string | null
          discipline_score?: number | null
          tags?: string[] | null
          source?: 'broker_sync' | 'manual' | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          market_bias: string | null
          key_levels: string | null
          watchlist: string | null
          news_notes: string | null
          reflection: string | null
          what_went_well: string | null
          what_to_improve: string | null
          mood: string | null
          overall_discipline: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          market_bias?: string | null
          key_levels?: string | null
          watchlist?: string | null
          news_notes?: string | null
          reflection?: string | null
          what_went_well?: string | null
          what_to_improve?: string | null
          mood?: string | null
          overall_discipline?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          market_bias?: string | null
          key_levels?: string | null
          watchlist?: string | null
          news_notes?: string | null
          reflection?: string | null
          what_went_well?: string | null
          what_to_improve?: string | null
          mood?: string | null
          overall_discipline?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          type: 'deep_analysis' | 'weekly_digest' | 'trade_feedback' | null
          trade_id: string | null
          content: string
          trades_analyzed_count: number | null
          date_range_start: string | null
          date_range_end: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type?: 'deep_analysis' | 'weekly_digest' | 'trade_feedback' | null
          trade_id?: string | null
          content: string
          trades_analyzed_count?: number | null
          date_range_start?: string | null
          date_range_end?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'deep_analysis' | 'weekly_digest' | 'trade_feedback' | null
          trade_id?: string | null
          content?: string
          trades_analyzed_count?: number | null
          date_range_start?: string | null
          date_range_end?: string | null
          created_at?: string | null
        }
      }
    }
  }
}
