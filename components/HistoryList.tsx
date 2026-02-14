"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Clock, Calendar, CheckCircle, AlertTriangle, AlertOctagon } from "lucide-react";

interface HistoryItem {
    id: string;
    date: string;
    image: string; // base64
    diagnosis: {
        acne_type: string;
        confidence: number;
    };
    severity: string;
}

export default function HistoryList() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("acne_scan_history");
        if (stored) {
            try {
                setHistory(JSON.parse(stored).reverse()); // Newest first
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    if (history.length === 0) {
        return (
            <div className="text-center py-12 opacity-60">
                <Clock className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p>No past scans found.</p>
            </div>
        );
    }

    const severityColor = (s: string) => {
        switch (s) {
            case "Severe": return "text-red-400 border-red-400/30 bg-red-400/10";
            case "Moderate": return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
            default: return "text-green-400 border-green-400/30 bg-green-400/10";
        }
    };

    const clearHistory = () => {
        if (confirm("Are you sure you want to delete all history? This cannot be undone.")) {
            localStorage.removeItem("acne_scan_history");
            setHistory([]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={clearHistory}
                    className="text-xs text-red-400 hover:text-red-300 transition underline underline-offset-4"
                >
                    Clear History
                </button>
            </div>
            {history.map((item, index) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-800/50 rounded-xl p-4 border border-white/5 flex gap-4 items-center transition hover:bg-slate-800/80"
                >
                    <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-white/10">
                        <Image src={item.image} alt="Scan thumbnail" fill className="object-cover" />
                    </div>

                    <div className="grow min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h3 className="font-semibold text-white/90 truncate">{item.diagnosis.acne_type}</h3>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(item.date).toLocaleDateString()}
                                    <span className="opacity-50">|</span>
                                    {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${severityColor(item.severity)}`}>
                                {item.severity}
                            </span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
