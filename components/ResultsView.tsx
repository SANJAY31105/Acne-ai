"use client";

import { Share2, RefreshCw, AlertCircle, CheckCircle2, ChevronDown, Stethoscope, ShieldAlert, Heart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import SeverityGauge from "./SeverityGauge";

interface ResultsViewProps {
    results: any;
    image: string;
    onReset: () => void;
}

const urgencyConfig: Record<string, { message: string; icon: any; color: string; bgClass: string }> = {
    Mild: {
        message: "Manageable at home with a consistent routine.",
        icon: Heart,
        color: "text-green-400",
        bgClass: "bg-green-500/5 border-green-500/20",
    },
    Moderate: {
        message: "Consider visiting a dermatologist if symptoms persist beyond 6–8 weeks.",
        icon: Stethoscope,
        color: "text-yellow-400",
        bgClass: "bg-yellow-500/5 border-yellow-500/20",
    },
    Severe: {
        message: "Professional consultation is strongly recommended. Severe acne may require prescription treatments.",
        icon: ShieldAlert,
        color: "text-red-400",
        bgClass: "bg-red-500/5 border-red-500/20",
    },
};

export default function ResultsView({ results, image, onReset }: ResultsViewProps) {
    const { primary_diagnosis, recommendations, skin_type } = results;
    const severity = primary_diagnosis?.severity || "Unknown";
    const confidence = primary_diagnosis?.confidence || 0;
    const [expandedType, setExpandedType] = useState<string | null>(null);

    const severityColor: Record<string, string> = {
        Mild: "text-green-400 bg-green-400/10 border-green-400/30",
        Moderate: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
        Severe: "text-red-400 bg-red-400/10 border-red-400/30",
    };

    const colorClass = severityColor[severity] || "text-zinc-400 bg-zinc-400/10 border-zinc-400/30";

    // Structured recommendations
    const likelyTypes: string[] = recommendations?.likely_types || [];
    const personalizedPlan: string[] = recommendations?.personalized_plan || recommendations?.general || (Array.isArray(recommendations) ? recommendations : []);
    const typeTreatments: Record<string, string[]> = recommendations?.type_treatments || recommendations?.by_type || {};
    const urgency = urgencyConfig[severity] || urgencyConfig.Moderate;
    const UrgencyIcon = urgency.icon;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                {/* Left Column: Image + Gauge */}
                <div className="space-y-6">
                    {/* Image with overlay */}
                    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
                        <Image
                            src={image}
                            alt="Analyzed Skin"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 pt-28">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide animate-pulse ${colorClass}`}>
                                    {severity}
                                </span>
                                {likelyTypes.length > 0 && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
                                        {likelyTypes[0]}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-white">{severity} Acne Detected</h2>
                            {likelyTypes.length > 1 && (
                                <p className="text-zinc-400 mt-1 text-sm">
                                    Also likely: {likelyTypes.slice(1).join(" · ")}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Gauge + Stats row */}
                    <div className="flex items-center gap-6">
                        <SeverityGauge severity={severity} confidence={confidence} />
                        <div className="flex-1 space-y-3">
                            <div className="backdrop-blur-md bg-white/[0.03] p-4 rounded-2xl border border-white/10">
                                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Skin Type</p>
                                <p className="text-lg font-bold text-indigo-400">{skin_type || "Not Set"}</p>
                            </div>
                            <div className="backdrop-blur-md bg-white/[0.03] p-4 rounded-2xl border border-white/10">
                                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Status</p>
                                <p className="text-lg font-bold flex items-center gap-2">
                                    {severity === "Severe" ? <AlertCircle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-green-400" />}
                                    {severity}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Recommendations */}
                <div className="flex flex-col h-full justify-between gap-6">
                    <div className="space-y-6">
                        {/* Urgency / Referral Banner */}
                        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${urgency.bgClass}`}>
                            <UrgencyIcon className={`w-5 h-5 mt-0.5 shrink-0 ${urgency.color}`} />
                            <div>
                                <p className={`text-sm font-medium ${urgency.color}`}>
                                    {severity === "Severe" ? "Professional Help Recommended" : severity === "Moderate" ? "Monitor Closely" : "Looking Good"}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">{urgency.message}</p>
                                {severity === "Severe" && (
                                    <a
                                        href="https://find-a-derm.aad.org/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold transition-all hover:scale-[1.02]"
                                    >
                                        <Stethoscope className="w-3.5 h-3.5" />
                                        Find a Dermatologist Near You
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Personalized Treatment Plan */}
                        <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <span className="bg-gradient-to-b from-indigo-400 to-indigo-600 w-1 h-6 rounded-full block"></span>
                                Your Treatment Plan
                            </h3>
                            <div className="space-y-3">
                                {personalizedPlan.map((rec: string, i: number) => (
                                    <div
                                        key={i}
                                        className="backdrop-blur-md bg-white/[0.03] p-4 rounded-xl border border-white/10 flex gap-4 items-start hover:bg-white/[0.06] transition-all duration-300"
                                        style={{
                                            animationDelay: `${i * 150}ms`,
                                            animation: "fadeSlideUp 0.5s ease-out both",
                                        }}
                                    >
                                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm border border-indigo-500/20">
                                            {i + 1}
                                        </div>
                                        <p className="text-zinc-300 leading-relaxed text-sm">{rec}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Type-Specific Treatments */}
                        {Object.keys(typeTreatments).length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <span className="bg-gradient-to-b from-cyan-400 to-cyan-600 w-1 h-5 rounded-full block"></span>
                                    Type-Specific Treatments
                                </h3>
                                <div className="space-y-2">
                                    {Object.entries(typeTreatments).map(([typeName, tips]) => (
                                        <div key={typeName} className="backdrop-blur-md bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden">
                                            <button
                                                onClick={() => setExpandedType(expandedType === typeName ? null : typeName)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.04] transition-colors"
                                            >
                                                <span className="font-medium text-cyan-400 text-sm">{typeName}</span>
                                                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${expandedType === typeName ? "rotate-180" : ""}`} />
                                            </button>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ${expandedType === typeName ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                                            >
                                                <div className="px-4 pb-4 space-y-2">
                                                    {(tips as string[]).map((tip: string, j: number) => (
                                                        <p key={j} className="text-sm text-zinc-400 flex gap-2">
                                                            <span className="text-cyan-500 shrink-0">→</span>
                                                            {tip}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Disclaimer */}
                        <div className="backdrop-blur-md bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-zinc-400 text-sm mb-1">Medical Disclaimer</h4>
                                    <p className="text-xs text-zinc-600 leading-relaxed">
                                        This AI analysis is for informational purposes only and does not constitute medical advice. Always consult a certified dermatologist for professional diagnosis and treatment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={onReset}
                            className="flex-1 py-4 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 hover:scale-[1.01]"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Analyze New Photo
                        </button>
                        <button className="px-6 py-4 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl font-semibold transition-all duration-200 border border-white/10 hover:border-white/20 hover:scale-[1.01]">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* CSS animation keyframes */}
            <style jsx>{`
                @keyframes fadeSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
