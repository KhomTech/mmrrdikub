'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { AlertTriangle, ShieldAlert, Target, Lightbulb, Loader2 } from 'lucide-react';
import { aiAPI } from '../utils/api';

// สร้าง Interface รับข้อมูลจริง
export interface Insight {
    id: number;
    type: 'warning' | 'danger' | 'tip';
    title: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
}

export default function AIInsights() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 🚀 ยิง API ไปให้ Golang + Gemini วิเคราะห์เมื่อเปิดหน้าเว็บ
    useEffect(() => {
        const fetchRealInsights = async () => {
            try {
                const response = await aiAPI.getInsights();
                if (response.data && response.data.insights) {
                    setInsights(response.data.insights);
                }
            } catch (error) {
                console.error("Failed to load insights", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRealInsights();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32 border border-gray-800 rounded-xl bg-[#0a0a0a]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="ml-3 text-emerald-500 font-mono">AI is analyzing your trades...</span>
            </div>
        );
    }

    if (insights.length === 0) {
        return null; // ถ้าไม่มีข้อมูลเทรดเลย ก็ไม่ต้องโชว์
    }

    return (
        <div className="space-y-4 font-sans">
            {/* Header สไตล์ Hacker */}
            <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
                <Target className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">AI Behavior Insights</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full animate-pulse">LIVE</span>
            </div>

            {/* โชว์ของจริงจาก Backend */}
            {insights.map((insight, index) => {
                // เลือก Icon ตามประเภท
                const IconComponent = insight.type === 'danger' ? ShieldAlert : insight.type === 'warning' ? AlertTriangle : Lightbulb;

                return (
                    <motion.div
                        key={insight.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className={cn(
                            "bg-[#111111] rounded-xl p-4 border-l-4 transition-all cursor-pointer shadow-lg",
                            "hover:bg-[#1a1a1a] hover:scale-[1.01]",
                            // เปลี่ยนสีตามความรุนแรง
                            insight.severity === 'high' && "border-l-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
                            insight.severity === 'medium' && "border-l-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.1)]",
                            insight.severity === 'low' && "border-l-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <IconComponent className={cn("w-5 h-5 mt-0.5",
                                insight.severity === 'high' ? "text-red-500" :
                                    insight.severity === 'medium' ? "text-yellow-500" : "text-emerald-500"
                            )} />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-100 mb-1">{insight.title}</h4>
                                <p className="text-sm text-gray-400 leading-relaxed font-mono">
                                    {insight.message}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
