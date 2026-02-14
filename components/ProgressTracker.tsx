"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

interface ScanEntry {
    id: string;
    date: string;
    severity: string;
    confidence?: number;
}

interface ProgressTrackerProps {
    history: ScanEntry[];
}

const severityValue: Record<string, number> = {
    Mild: 1,
    Moderate: 2,
    Severe: 3,
    Unknown: 2,
};

const severityColor: Record<string, string> = {
    Mild: "#34d399",
    Moderate: "#fbbf24",
    Severe: "#f87171",
    Unknown: "#a1a1aa",
};

function getTrend(entries: ScanEntry[]): { label: string; color: string; icon: any } {
    if (entries.length < 2) return { label: "Not enough data", color: "text-zinc-500", icon: Minus };
    const recent = severityValue[entries[entries.length - 1].severity] || 2;
    const prev = severityValue[entries[entries.length - 2].severity] || 2;
    if (recent < prev) return { label: "Improving", color: "text-green-400", icon: TrendingDown };
    if (recent > prev) return { label: "Getting Worse", color: "text-red-400", icon: TrendingUp };
    return { label: "Stable", color: "text-yellow-400", icon: Minus };
}

export default function ProgressTracker({ history }: ProgressTrackerProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (history.length === 0) return null;

    const entries = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const trend = getTrend(entries);
    const TrendIcon = trend.icon;

    // SVG chart dimensions
    const width = 320;
    const height = 100;
    const padding = { top: 20, right: 20, bottom: 20, left: 20 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Map entries to points
    const points = entries.map((entry, i) => {
        const x = entries.length === 1
            ? chartW / 2
            : (i / (entries.length - 1)) * chartW;
        const val = severityValue[entry.severity] || 2;
        // Invert Y (1=top, 3=bottom)
        const y = ((val - 1) / 2) * chartH;
        return { x: x + padding.left, y: y + padding.top, entry };
    });

    // Build SVG path
    const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    // Gradient path (area under the line)
    const areaPath = pathData +
        ` L ${points[points.length - 1].x} ${height - padding.bottom}` +
        ` L ${points[0].x} ${height - padding.bottom} Z`;

    // Stats
    const avgSeverity = entries.reduce((sum, e) => sum + (severityValue[e.severity] || 2), 0) / entries.length;
    const avgLabel = avgSeverity < 1.5 ? "Mild" : avgSeverity < 2.5 ? "Moderate" : "Severe";

    return (
        <div className="backdrop-blur-md bg-white/[0.03] rounded-2xl border border-white/10 p-5 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-semibold text-white text-sm">Skin Progress</h3>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${trend.color}`}>
                    <TrendIcon className="w-3.5 h-3.5" />
                    {trend.label}
                </div>
            </div>

            {/* Chart */}
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto mb-4"
                style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease-out" }}
            >
                <defs>
                    <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(129, 140, 248, 0.2)" />
                        <stop offset="100%" stopColor="rgba(129, 140, 248, 0)" />
                    </linearGradient>
                </defs>

                {/* Severity zone lines */}
                {[1, 2, 3].map(val => {
                    const y = ((val - 1) / 2) * chartH + padding.top;
                    const label = val === 1 ? "Mild" : val === 2 ? "Moderate" : "Severe";
                    return (
                        <g key={val}>
                            <line
                                x1={padding.left}
                                y1={y}
                                x2={width - padding.right}
                                y2={y}
                                stroke="rgba(255,255,255,0.06)"
                                strokeDasharray="4 4"
                            />
                            <text
                                x={width - padding.right + 2}
                                y={y + 3}
                                fontSize="8"
                                fill="rgba(255,255,255,0.2)"
                            >
                                {label}
                            </text>
                        </g>
                    );
                })}

                {/* Area fill */}
                {entries.length > 1 && (
                    <path d={areaPath} fill="url(#area-gradient)" />
                )}

                {/* Line */}
                {entries.length > 1 && (
                    <path
                        d={pathData}
                        fill="none"
                        stroke="rgba(129, 140, 248, 0.6)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Dots */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill={severityColor[p.entry.severity]}
                            stroke="rgba(0,0,0,0.5)"
                            strokeWidth="1.5"
                        />
                        {/* Date label for first and last */}
                        {(i === 0 || i === points.length - 1) && (
                            <text
                                x={p.x}
                                y={height - 4}
                                fontSize="8"
                                fill="rgba(255,255,255,0.3)"
                                textAnchor="middle"
                            >
                                {new Date(p.entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </text>
                        )}
                    </g>
                ))}
            </svg>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                    <p className="text-2xl font-bold text-white">{entries.length}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Scans</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: severityColor[avgLabel] }}>{avgLabel}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Average</p>
                </div>
                <div className="text-center">
                    <p className={`text-2xl font-bold ${trend.color}`}>
                        {trend.label === "Improving" ? "↓" : trend.label === "Getting Worse" ? "↑" : "—"}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Trend</p>
                </div>
            </div>
        </div>
    );
}
