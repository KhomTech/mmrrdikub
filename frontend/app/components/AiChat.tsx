'use client';

import { useState, useRef, useEffect } from 'react';
import { aiAPI, AIChatMessage } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { Brain, Send, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiChat() {
    const { lang, t } = useLanguage();

    // ดึงคำทักทายแรกสุดหรูหราจากไฟล์แปลภาษา
    const getGreeting = () => {
        return typeof t === 'function' && t('aiGreeting') ? t('aiGreeting') : 'สวัสดีครับยอดนักเทรด! 👋 ผมคือ AI Trading Assistant อยากให้ผมช่วยวิเคราะห์ตลาดวันนี้ หรือปรึกษาแผนการเทรด พิมพ์ถามมาได้เลยครับ!';
    };

    const [messages, setMessages] = useState<AIChatMessage[]>([
        { role: 'assistant', content: getGreeting() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e?: React.FormEvent, forcedText?: string) => {
        e?.preventDefault();
        const textToSend = forcedText || input;

        if (!textToSend.trim() || isLoading) return;

        const userMsg: AIChatMessage = { role: 'user', content: textToSend.trim() };
        const newMessages = [...messages, userMsg];

        setMessages(newMessages);
        if (!forcedText) setInput('');
        else setInput('');
        setIsLoading(true);

        try {
            const res = await aiAPI.chat({ messages: newMessages, language: lang });

            if (res.data?.status === 'success') {
                const aiReply: AIChatMessage = {
                    role: 'assistant',
                    content: res.data.reply
                };
                setMessages(prev => [...prev, aiReply]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: '⚠️ ขออภัยครับ ระบบเซิร์ฟเวอร์ AI ขัดข้องชั่วคราว ลองใหม่อีกครั้งนะครับ'
                }]);
            }
        } catch (error: any) {
            console.error('Chat Error:', error);
            let errMsg = '⚠️ ไม่สามารถเชื่อมต่อ AI ได้ (เซิร์ฟเวอร์อาจจะกำลังประมวลผลหนัก)';
            if (error.response?.status === 401) {
                errMsg = '🔒 กรุณา Login ก่อนแชทครับพี่';
            }
            setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handleSendToChat = (e: Event) => {
            const customEvent = e as CustomEvent;
            const msg = customEvent.detail;

            document.getElementById('ai-chat-section')?.scrollIntoView({ behavior: 'smooth' });
            handleSend(undefined, msg);
        };
        window.addEventListener('sendToChat', handleSendToChat);
        return () => window.removeEventListener('sendToChat', handleSendToChat);
    }, [messages, isLoading, lang]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div id="ai-chat-section" className="bg-white dark:bg-[#0d1117] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#30363d] flex flex-col h-[70vh] max-h-[700px] min-h-[500px] font-sans overflow-hidden transition-colors duration-300">
            {/* 🌟 Header Section - ส่วนหัวแชท ออกแบบโทนดำเขียวสไตล์ Hacker */}
            <div className="bg-gradient-to-r from-emerald-950 to-[#050505] p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-b border-emerald-500/20 z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* ไอคอนสมองสีเขียวสะท้อนแสง */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-emerald-50 font-bold text-lg sm:text-xl tracking-wider uppercase">
                            {t('aiTradingAnalyst')}
                        </h3>
                        <p className="text-emerald-400/80 text-[10px] sm:text-xs flex items-center gap-1.5 font-medium mt-0.5">
                            {/* ไฟกระพริบสีเขียวแสดงสถานะ Live */}
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {t('liveMarketActive')}
                        </p>
                    </div>
                </div>
            </div>

            {/* 💬 Chat Messages Area - พื้นที่แสดงข้อความแชททั้งหมด */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#0a0a0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.05),rgba(0,0,0,1))] custom-scrollbar scroll-smooth">
                {messages.map((msg, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        key={idx}
                        className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 shadow-sm border ${msg.role === 'user'
                                ? 'bg-emerald-900/40 text-emerald-50 rounded-br-sm border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' // ฝั่ง User สีเขียวดาร์ก
                                : 'bg-[#111111] text-gray-300 rounded-tl-sm border-gray-800 shadow-xl' // ฝั่ง AI สีดำเทา
                                }`}
                        >
                            <div className="whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed break-words font-mono">
                                {msg.content}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Loading State แบบใหม่ (จุดกระพริบสีเขียว) */}
                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
                        <div className="bg-[#111111] border border-emerald-500/30 rounded-2xl rounded-tl-sm p-4 shadow-[0_0_10px_rgba(16,185,129,0.1)] flex items-center gap-3">
                            <Brain className="w-5 h-5 text-emerald-500 animate-pulse" />
                            <div className="flex gap-1.5 items-center h-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* ✏️ Input Area - ส่วนพิมพ์ข้อความถาม */}
            <div className="p-3 sm:p-5 bg-[#0a0a0a] border-t border-gray-800 shrink-0 z-10">
                <form onSubmit={handleSend} className="relative flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        {/* ช่องพิมพ์ข้อความ (Textarea) */}
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="พิมพ์ถามเรื่องเหรียญ, แผนเทรด, ข่าวสารเศรษฐกิจ..."
                            className="w-full bg-[#111111] text-white rounded-xl border border-gray-800 p-3.5 sm:p-4 pr-12 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none custom-scrollbar transition-colors font-mono"
                            rows={selectedHeight(input)}
                            disabled={isLoading}
                        />
                        {/* Mobile Send Button positioned absolutely inside the textarea but hidden on Desktop */}
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className={`sm:hidden absolute right-2 bottom-2 p-2.5 rounded-lg transition-all ${!input.trim() || isLoading
                                ? 'bg-[#111111] text-gray-600 border border-gray-800 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95'
                                }`}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 translate-x-[-1px] translate-y-[1px]" />}
                        </button>
                    </div>

                    {/* Desktop Send Button - ปุ่มส่งสำหรับคอมพิวเตอร์ */}
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className={`hidden sm:flex items-center justify-center shrink-0 w-14 h-auto rounded-xl transition-all duration-300 ${!input.trim() || isLoading
                            ? 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-black font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95'
                            }`}
                        title="Click or press Enter to send"
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : <Send className="w-5 h-5 translate-x-[-1px] translate-y-[1px]" />}
                    </button>
                </form>

                {/* แถบด้านล่าง เล็กๆ บอกสถานะว่าใช้ AI แท้ */}
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-3 flex justify-between items-center px-1">
                    <span className="sm:hidden">💡 ปัดลงเพื่อดูข้อความเก่า</span>
                    <span className="flex items-center gap-1 font-medium bg-gray-900 border border-gray-800 text-emerald-500/50 px-2 py-0.5 rounded-full ml-auto">
                        Powered by Terminal AI
                    </span>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #30363d;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #94a3b8;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #8b949e;
                }
            `}</style>
        </div>
    );
}

// Helper for dynamic textarea height based on content length
function selectedHeight(str: string) {
    const lines = str.split('\n').length;
    return Math.min(Math.max(lines, 1), 4); // Min 1, Max 4 lines visible
}
