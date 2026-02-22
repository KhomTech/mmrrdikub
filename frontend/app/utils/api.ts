/**
 * api.ts - Axios Instance สำหรับเชื่อมต่อ Backend
 * 🔥 UPGRADED: รองรับ fields ใหม่ทั้งหมดสำหรับ Professional Trading Journal
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ============================================
// Types
// ============================================
export interface CreateTradeData {
    pair: string;
    side: string;
    entry_price: number;
    stop_loss?: number;
    take_profit?: number;
    position_size: number;
    quantity?: number;
    leverage?: number;
    // 🔥 NEW Fields
    risk_percent?: number;
    max_win?: number;
    max_loss?: number;
    risk_reward_ratio?: number;
    fee?: number;
    entry_reason?: string;
    setup_score?: number;
    notes?: string;
    tags?: string;
    entry_time?: string;
}

export interface UpdateTradeData {
    exit_price?: number;
    pnl?: number;
    pnl_percent?: number;
    status?: string; // OPEN, WIN, LOSS, BREAK_EVEN
    notes?: string;
    exit_time?: string;
    closed_at?: string;
}

export interface TradeFilter {
    status?: string;
    pair?: string;
    side?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_dir?: string;
}

export interface Trade {
    id: number;
    user_id: number;
    pair: string;
    side: string;
    entry_price: number;
    exit_price: number;
    stop_loss: number;
    take_profit: number;
    position_size: number;
    quantity: number;
    leverage: number;
    risk_percent: number;
    max_win: number;
    max_loss: number;
    risk_reward_ratio: number;
    fee: number;
    entry_reason: string;
    setup_score: number;
    pnl: number;
    pnl_percent: number;
    status: string;
    notes: string;
    tags: string;
    entry_time: string;
    exit_time: string;
    opened_at: string;
    closed_at: string;
    created_at: string;
    updated_at: string;
}

export interface TradeStats {
    total_pnl: number;
    win_count: number;
    loss_count: number;
    open_count: number;
    avg_rr: number;
}

// ============================================
// Axios Instance
// ============================================
// 🔥 ใช้ Environment Variable สำหรับ Production
const normalizeApiBaseUrl = (raw: string): string => {
    const trimmed = raw.trim().replace(/\/+$/, '');
    if (trimmed === '') {
        return 'http://localhost:8080/api';
    }

    // รองรับทั้งแบบใส่ /api มาแล้ว และแบบใส่แค่ host
    if (trimmed.endsWith('/api')) {
        return trimmed;
    }

    return `${trimmed}/api`;
};

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,  // 60 วินาที (AI อาจใช้เวลา 15-30 วิ ถ้าโดน retry)
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// ============================================
// Request Interceptor
// ============================================
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);

        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// ============================================
// Response Interceptor
// ============================================
api.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error: AxiosError) => {
        if (!error.response) {
            console.error('🔥 NETWORK ERROR: Backend unreachable!');
            error.message = 'Network Error: ไม่สามารถเชื่อมต่อ Backend ได้';
        } else {
            const status = error.response.status;
            const data = error.response.data as { error?: string };
            console.error(`❌ API Error: ${status}`, data);

            if (status === 401) {
                console.warn('🔓 Unauthorized - clearing token');
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                }
            }
        }

        return Promise.reject(error);
    }
);

// ============================================
// Auth API
// ============================================
export const authAPI = {
    register: (data: { username: string; email: string; password: string }) => {
        console.log('📝 Registering user:', data.username, data.email);
        return api.post('/register', data);
    },

    login: (data: { username: string; password: string }) => {
        console.log('🔐 Logging in user:', data.username);
        return api.post('/login', data);
    },
};

// ============================================
// Trade API (UPGRADED)
// ============================================
export const tradeAPI = {
    // สร้าง Trade ใหม่
    create: (data: CreateTradeData) => {
        console.log('📊 Creating trade:', data.pair, data.side);
        return api.post('/trades', data);
    },

    // ดึง Trades ทั้งหมด พร้อม Filter
    getAll: (params?: TradeFilter) => {
        console.log('📋 Fetching trades with filter:', params);
        return api.get<{ trades: Trade[]; total: number; stats: TradeStats }>('/trades', { params });
    },

    // ดึง Trade เดียว
    getOne: (id: number) => api.get<Trade>(`/trades/${id}`),

    // อัพเดท Trade (ปิด Order / แก้ไข)
    update: (id: number, data: UpdateTradeData) => {
        console.log('📝 Updating trade:', id, data);
        return api.put(`/trades/${id}`, data);
    },

    // ลบ Trade
    delete: (id: number) => {
        console.log('🗑️ Deleting trade:', id);
        return api.delete(`/trades/${id}`);
    },
};

// ============================================
// AI API - ฟีเจอร์ AI Risk Analyst (ใหม่!)
// ============================================
// Interface สำหรับส่งข้อมูลไปวิเคราะห์
export interface AnalyzeTradePayload {
    coin: string;
    entry: number;
    sl: number;
    tp: number;
    side: string;
    fallback?: boolean;  // true = ข้าม Gemini ใช้ข้อมูลจริงเลย
}

// Interface สำหรับรับผลวิเคราะห์กลับมา
export interface AIAnalysisResult {
    status: string;         // 'success' | 'quota_exceeded'
    source: string;         // 'gemini' | 'fallback'
    coin: string;
    analysis: string;
    history_count: number;
    gemini_error?: string;  // ถ้า quota exceeded จะมี error message
}

export interface AIChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface AIChatResult {
    status: string;         // 'success'
    source: string;         // 'gemini' | 'fallback'
    reply: string;
}

export const aiAPI = {
    // ส่งแผนเทรดไปให้ AI วิเคราะห์
    analyze: (data: AnalyzeTradePayload) => {
        console.log('🤖 Sending to AI Analyst:', data.coin, data.side);
        return api.post<AIAnalysisResult>('/ai/analyze', data);
    },

    // คุยกับ AI Trading Assistant
    chat: (data: { messages: AIChatMessage[], language?: string }) => {
        console.log('💬 Sending chat to AI Assistant');
        return api.post<AIChatResult>('/ai/chat', data);
    },
    // ดึง AI Insights สรุปพฤติกรรม User
    getInsights: () => {
        console.log('🤖 Fetching recent trade behavior insights from AI...');
        return api.get<{ insights: import('../components/AIInsights').Insight[] }>('/ai/insights');
    },
};

// Export default instance
export default api;
