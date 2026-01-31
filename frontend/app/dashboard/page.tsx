'use client';
/*
  Dashboard Page - หน้าแสดงประวัติเทรด
  ต้อง Login ก่อนถึงจะเข้าถึงได้
*/

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Dashboard from '../components/Dashboard';
import { Loader2 } from 'lucide-react';

function DashboardContent() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    // เช็คว่า Login หรือยัง
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            setChecking(false);
        }
    }, [router]);

    // กำลังเช็ค Auth
    if (checking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <Dashboard />
            </main>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <ThemeProvider>
            <DashboardContent />
        </ThemeProvider>
    );
}
