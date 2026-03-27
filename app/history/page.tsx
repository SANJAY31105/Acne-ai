"use client";

import HistoryList from "@/components/HistoryList";
import ProgressTracker from "@/components/ProgressTracker";
import Link from "next/link";
import { ArrowLeft, Activity, Sparkles, Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ScanEntry {
    id: string;
    date: string;
    severity: string;
    confidence?: number;
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
        <div className="min-h-screen bg-[#060a14] text-white antialiased selection:bg-indigo-500/30 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-[400px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 px-6 py-8 max-w-2xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/analyze" className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/15 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Your Journey</h1>
                            <p className="text-xs text-zinc-500 tracking-wide mt-0.5">{history.length} scan{history.length !== 1 ? "s" : ""} tracked</p>
                        </div>
                    </div>
                    <Link href="/treatments" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase hover:bg-indigo-500/20 transition-all">
                        <Sparkles className="w-3.5 h-3.5" />
                        Treatments
                    </Link>
                </header>

                {history.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6">
                            <Activity className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h2 className="text-xl font-black text-zinc-300 mb-2">No Scans Yet</h2>
                        <p className="text-sm text-zinc-600 max-w-xs mb-8">Start tracking your skin journey by taking your first scan. Each scan helps build your progress timeline.</p>
                        <Link href="/analyze" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold text-sm transition-all shadow-lg shadow-indigo-500/20">
                            <Camera className="w-4 h-4" />
                            Take First Scan
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Progress Tracker */}
                        <ProgressTracker history={history} />

                        {/* Recent Scans */}
                        <section>
                            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-zinc-500 mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-full" />
                                Scan History
                            </h2>
                            <HistoryList />
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
