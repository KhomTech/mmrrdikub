'use client';
/*
  AIInsights.tsx - ระบบ AI วิเคราะห์พฤติกรรมการเทรด
  แจ้งเตือน Bad Habits และแนะนำจุดอ่อน
*/

import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import {
    AlertTriangle,
    TrendingDown,
    Clock,
    Target,
    Lightbulb,
    ShieldAlert
} from 'lucide-react';

// Mock Data สำหรับ AI Insights
const MOCK_INSIGHTS = [
    // 1. เรื่องการสวนเทรนด์
    {
        id: 1,
        type: 'warning',
        icon: AlertTriangle,
        title: 'อย่าเพิ่งขวางเชี่ยว!',
        message: 'กราฟกำลังวิ่งแรง อย่าเพิ่งรีบเปิดสวนเพียงเพราะคิดว่า "สูงเกินไปแล้ว" รอสัญญาณกลับตัว (Reversal) ที่ชัดเจนก่อนดีกว่า',
        severity: 'high',
    },
    // 2. เรื่องการแก้แค้นตลาด (Revenge Trading) - สำคัญมาก
    {
        id: 2,
        type: 'danger',
        icon: ShieldAlert,
        title: 'หยุด! อย่าเพิ่งเอาคืน',
        message: 'คุณเพิ่งโดน Stop Loss มา อารมณ์กำลังไม่นิ่ง "แพ้ให้แพ้ตามแผน" ปิดจอพักสักนิด อย่ารีบเปิดไม้ใหญ่เพื่อหวังคืนทุนทันที',
        severity: 'high',
    },
    // 3. เรื่อง Risk Management
    {
        id: 3,
        type: 'danger',
        icon: ShieldAlert,
        title: 'Risk สูงเกินลิมิต',
        message: 'ไม้ล่าสุดคุณใส่ Leverage หรือ Margin เยอะเกินแผน (Risk > 2%) ถ้าพลาดไม้นี้พอร์ตจะเสียหายหนัก ลด Size ลงหน่อยไหม?',
        severity: 'high',
    },
    // 4. เรื่องขายหมู (R:R ไม่คุ้ม)
    {
        id: 4,
        type: 'warning',
        icon: Clock,
        title: 'ทนรวยให้เป็น',
        message: 'คุณมักปิดออเดอร์ก่อนถึง TP เพราะกลัวกำไรหาย ลองใช้ Trailing Stop ล็อกกำไรแทน แล้วปล่อยให้กำไรไหลไป (Let Profit Run)',
        severity: 'medium',
    },
    // 5. เรื่อง FOMO (กลัวตกรถ)
    {
        id: 5,
        type: 'warning',
        icon: AlertTriangle,
        title: 'รถออกไปแล้ว อย่าวิ่งตาม',
        message: 'ราคาวิ่งไปไกลจากจุดเข้าที่ได้เปรียบแล้ว การเข้าตอนนี้ Risk/Reward ไม่คุ้ม เสี่ยงดอยสูง รอจังหวะย่อตัว (Pullback) ดีกว่า',
        severity: 'medium',
    },
    // 6. เรื่องวินัย Stop Loss
    {
        id: 6,
        type: 'danger',
        icon: ShieldAlert,
        title: 'ห้ามขยับ SL หนี!',
        message: 'สถิติบอกว่าการเลื่อน Stop Loss หนีเพื่อให้ไม่โดนตัด มักจบด้วยการล้างพอร์ต ยอมเจ็บเล็กน้อยตามแผน เพื่อรักษาเงินต้นส่วนใหญ่ไว้',
        severity: 'high',
    },
    // 7. เรื่อง Overtrade (เทรดถี่เกินไป)
    {
        id: 7,
        type: 'tip',
        icon: Lightbulb,
        title: 'พักสายตาบ้าง',
        message: 'วันนี้คุณเข้าออกออเดอร์ถี่มาก สมองเริ่มล้าอาจทำให้ตัดสินใจพลาด "การนั่งทับมือเฉยๆ" ก็ถือเป็นกลยุทธ์การเทรดที่ดีนะ',
        severity: 'low',
    },
    // 8. เรื่อง Boredom Trading (เทรดแก้เบื่อ)
    {
        id: 8,
        type: 'tip',
        icon: Lightbulb,
        title: 'เข้าเพราะ Setup หรือเพราะว่าง?',
        message: 'ถามตัวเองก่อนกด: กราฟเข้าเงื่อนไขระบบเทรดจริงๆ หรือแค่ "คันมือ" อยากมีออเดอร์? ถ้าไม่ชัดเจน ให้ข้ามไปก่อน',
        severity: 'low',
    },
    // 9. เรื่อง Bias (อคติ)
    {
        id: 9,
        type: 'tip',
        icon: Lightbulb,
        title: 'เช็ค Timeframe ใหญ่หรือยัง?',
        message: 'อย่าจ้องแต่กราฟรายนาที จนลืมดูภาพใหญ่ ระวัง Bias หน้าเดียว ลองซูมออกไปดูแนวโน้มหลัก (Trend) ก่อนตัดสินใจ',
        severity: 'low',
    },
    // 10. เรื่องสภาพตลาด (Volatility)
    {
        id: 10,
        type: 'warning',
        icon: AlertTriangle,
        title: 'ตลาดผันผวนสูง',
        message: 'ช่วงนี้กราฟเหวี่ยงแรง (High Volatility) อาจโดนกิน Stop Loss ฟรีได้ง่าย แนะนำให้ลด Position Size หรือเผื่อระยะ SL ให้กว้างขึ้น',
        severity: 'medium',
    },
];

export default function AIInsights() {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-bold">AI Insights</h3>
                <span className="px-2 py-0.5 text-xs bg-accent/20 text-accent rounded-full">Beta</span>
            </div>

            {/* Insight Cards */}
            {MOCK_INSIGHTS.map((insight, index) => {
                const IconComponent = insight.icon;

                return (
                    <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className={cn(
                            "glass rounded-xl p-4 border-l-4 transition-all cursor-pointer",
                            "hover:scale-[1.02]",
                            // สีขอบซ้ายตาม severity
                            insight.severity === 'high' && "border-l-loss",
                            insight.severity === 'medium' && "border-l-yellow-500",
                            insight.severity === 'low' && "border-l-accent",
                        )}
                    >
                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={cn(
                                "p-2 rounded-lg shrink-0",
                                insight.type === 'warning' && "bg-yellow-500/20",
                                insight.type === 'danger' && "bg-loss/20",
                                insight.type === 'tip' && "bg-accent/20",
                            )}>
                                <IconComponent className={cn(
                                    "w-5 h-5",
                                    insight.type === 'warning' && "text-yellow-500",
                                    insight.type === 'danger' && "text-loss",
                                    insight.type === 'tip' && "text-accent",
                                )} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold mb-1">{insight.title}</h4>
                                <p className="text-sm text-muted leading-relaxed">
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
