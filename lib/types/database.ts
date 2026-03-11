export type UserRole = 'user' | 'admin';
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'vip' | 'vvip';
export type SignalType = 'buy' | 'sell';
export type SignalStatus = 'active' | 'hit_tp' | 'hit_sl' | 'expired';
export type TradeStatus = 'open' | 'closed' | 'cancelled';
export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type LessonType = 'text' | 'youtube' | 'pdf' | 'audio' | 'quiz';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  subscription_tier: SubscriptionTier;
  binance_api_key?: string;
  binance_api_secret?: string;
  virtual_balance: number;
  is_banned: boolean;
  ban_reason?: string;
  kyc_status: KycStatus;
  copy_trading_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  lesson_type: LessonType;
  youtube_embed_id?: string;
  pdf_url?: string;
  audio_url?: string;
  is_free: boolean;
  duration_minutes: number;
  order_index: number;
  created_at: string;
}

export interface TradingSignal {
  id: string;
  pair: string;
  signal_type: SignalType;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  status: SignalStatus;
  confidence_level: 'low' | 'medium' | 'high';
  notes?: string;
  created_by?: string;
  created_at: string;
  expires_at?: string;
}

export interface UserTrade {
  id: string;
  user_id: string;
  signal_id?: string;
  pair: string;
  trade_type: SignalType;
  entry_price: number;
  exit_price?: number;
  quantity: number;
  profit_loss: number;
  status: TradeStatus;
  opened_at: string;
  closed_at?: string;
}

export interface DemoTrade {
  id: string;
  user_id: string;
  pair: string;
  trade_type: SignalType;
  entry_price: number;
  exit_price?: number;
  quantity: number;
  profit_loss: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'signal' | 'course' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface KycSubmission {
  id: string;
  user_id: string;
  status: KycStatus;
  full_name?: string;
  date_of_birth?: string;
  country?: string;
  id_front_url?: string;
  id_back_url?: string;
  selfie_url?: string;
  reviewer_notes?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
  order_index: number;
}

export interface QuizScore {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  total: number;
  completed_at: string;
}
