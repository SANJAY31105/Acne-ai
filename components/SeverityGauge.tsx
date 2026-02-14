"use client";

import { useEffect, useState } from "react";

interface SeverityGaugeProps {
    severity: string;
    confidence: number;
}

export default function SeverityGauge({ severity, confidence }: SeverityGaugeProps) {
    const [animatedConfidence, setAnimatedConfidence] = useState(0);
    const [mounted, setMounted] = useState(false);

    const severityConfig: Record<string, { color: string; glow: string; percent: number; gradient: string[] }> = {
        Mild: {
            color: "#34d399",
            glow: "rgba(52, 211, 153, 0.3)",
            percent: 33,
            gradient: ["#34d399", "#6ee7b7"],
        },
        Moderate: {
            color: "#fbbf24",
            glow: "rgba(251, 191, 36, 0.3)",
            percent: 66,
            gradient: ["#f59e0b", "#fbbf24"],
        },
        Severe: {
            color: "#f87171",
            glow: "rgba(248, 113, 113, 0.3)",
            percent: 100,
            gradient: ["#ef4444", "#f87171"],
        },
    };

    const config = severityConfig[severity] || severityConfig.Moderate;

    // Animate on mount
    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => {
            setAnimatedConfidence(confidence);
        }, 100);
        return () => clearTimeout(timer);
    }, [confidence]);

    const radius = 70;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;

    // Severity arc (outer)
    const severityDash = (config.percent / 100) * circumference;
    // Confidence arc (inner)
    const confidenceDash = (animatedConfidence / 100) * circumference;

    const gradientId = `gauge-gradient-${severity}`;

    return (
        <div className="relative flex flex-col items-center">
            <svg
                width={radius * 2}
                height={radius * 2}
                className="transform -rotate-90"
                style={{
                    filter: mounted ? `drop-shadow(0 0 12px ${config.glow})` : "none",
                    transition: "filter 1s ease-out",
                }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={config.gradient[0]} />
                        <stop offset="100%" stopColor={config.gradient[1]} />
                    </linearGradient>
                </defs>

                {/* Background track */}
                <circle
                    cx={radius}
                    cy={radius}
                    r={normalizedRadius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={stroke}
                />

                {/* Confidence arc */}
                <circle
                    cx={radius}
                    cy={radius}
                    r={normalizedRadius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${confidenceDash} ${circumference}`}
                    style={{
                        transition: "stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />

                {/* Inner background */}
                <circle
                    cx={radius}
                    cy={radius}
                    r={normalizedRadius - 14}
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={4}
                />

                {/* Inner severity arc */}
                <circle
                    cx={radius}
                    cy={radius}
                    r={normalizedRadius - 14}
                    fill="none"
                    stroke={config.color}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={`${(config.percent / 100) * (2 * Math.PI * (normalizedRadius - 14))} ${2 * Math.PI * (normalizedRadius - 14)}`}
                    opacity={0.4}
                    style={{
                        transition: "stroke-dasharray 1.8s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                    className="text-3xl font-black tabular-nums"
                    style={{ color: config.color }}
                >
                    {Math.round(animatedConfidence)}%
                </span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
                    Confidence
                </span>
            </div>
        </div>
    );
}
