"use client";

import HistoryList from "@/components/HistoryList";
import ProgressTracker from "@/components/ProgressTracker";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ScanEntry {
    id: string;
    date: string;
    image: string;
    severity: string;
    confidence?: number;
    diagnosis?: any;
}

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<ScanEntry[]>([]);

    useEffect(() => {
        const user = localStorage.getItem("acne_user");
        if (!user) {
            router.push("/login");
            return;
        }

        const stored = localStorage.getItem("acne_scan_history");
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, [router]);

    return (
        <main className="min-h-screen bg-slate-950 text-white p-6 max-w-md mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />

            <div className="relative z-10">
                <header className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
                        Your Journey
                    </h1>
                </header>

                {/* Progress Tracker (timeline chart) */}
                <ProgressTracker history={history} />

                <section>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        Recent Scans
                    </h2>
                    <HistoryList />
                </section>
            </div>
        </main>
    );
}
