"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface HistoryItem {
    id: string;
    date: string;
    severity: string;
    confidence?: number;
}

const severityConfig: Record<string, { color: string; bg: string; emoji: string }> = {
    Mild: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", emoji: "🟢" },
    Moderate: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", emoji: "🟡" },
    Severe: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", emoji: "🔴" },
};

export default function HistoryList() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("acne_scan_history");
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    if (history.length === 0) {
        return (
            <div className="text-center py-8 opacity-60">
                <Clock className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                <p className="text-sm text-zinc-500">No scans yet.</p>
            </div>
        );
    }

    const clearHistory = () => {
        if (confirm("Delete all scan history? This cannot be undone.")) {
            localStorage.removeItem("acne_scan_history");
            setHistory([]);
        }
    };

    // Determine trend for each entry
    const getTrend = (index: number) => {
        if (index >= history.length - 1) return null;
        const severityVal: Record<string, number> = { Mild: 1, Moderate: 2, Severe: 3 };
        const current = severityVal[history[index].severity] || 2;
        const prev = severityVal[history[index + 1].severity] || 2;
        if (current < prev) return { icon: TrendingDown, color: "text-emerald-400", label: "Improved" };
        if (current > prev) return { icon: TrendingUp, color: "text-red-400", label: "Worsened" };
        return { icon: Minus, color: "text-zinc-500", label: "Stable" };
    };

    return (
        <div className="space-y-3">
            {history.map((item, index) => {
                const config = severityConfig[item.severity] || severityConfig.Moderate;
                const trend = getTrend(index);
                const date = new Date(item.date);

                return (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, type: "spring", damping: 20 }}
                        className="group bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all duration-300"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Severity indicator */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${config.bg}`}>
                                    <span className="text-lg">{config.emoji}</span>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-sm font-black ${config.color}`}>
                                            {item.severity}
                                        </span>
                                        {item.confidence && (
                                            <span className="text-[10px] text-zinc-500 font-mono">
                                                {Math.round(item.confidence)}%
                                            </span>
                                        )}
                                        {trend && (
                                            <div className={`flex items-center gap-0.5 ${trend.color}`}>
                                                <trend.icon className="w-3 h-3" />
                                                <span className="text-[10px] font-bold">{trend.label}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-zinc-600 flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" />
                                        {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                        <span className="text-zinc-700">•</span>
                                        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>
                            </div>

                            {/* Confidence bar */}
                            {item.confidence && (
                                <div className="hidden sm:flex flex-col items-end gap-1">
                                    <span className="text-[10px] text-zinc-600 font-bold tracking-wider">CONFIDENCE</span>
                                    <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                                            style={{ width: `${item.confidence}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}

            {/* Clear button */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={clearHistory}
                    className="flex items-center gap-2 text-xs text-zinc-600 hover:text-red-400 transition-colors py-2 px-4 rounded-lg hover:bg-red-500/5"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All History
                </button>
            </div>
        </div>
    );
}
