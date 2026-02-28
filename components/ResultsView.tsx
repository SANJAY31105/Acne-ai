"use client";

import { Share2, RefreshCw, AlertCircle, CheckCircle2, ChevronDown, Stethoscope, ShieldAlert, Heart, Sun, Moon, ShoppingBag, ThumbsUp, ThumbsDown, Clock, FlaskConical, Pill, Download } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import SeverityGauge from "./SeverityGauge";

interface ResultsViewProps {
    results: any;
    image: string;
    onReset: () => void;
}

const urgencyConfig: Record<string, { message: string; icon: any; color: string; bgClass: string; label: string }> = {
    Mild: {
        label: "Looking Good",
        message: "Manageable at home with a consistent routine.",
        icon: Heart,
        color: "text-emerald-400",
        bgClass: "bg-emerald-500/5 border-emerald-500/20",
    },
    Moderate: {
        label: "Monitor Closely",
        message: "Consider visiting a dermatologist if symptoms persist beyond 6-8 weeks.",
        icon: Stethoscope,
        color: "text-amber-400",
        bgClass: "bg-amber-500/5 border-amber-500/20",
    },
    Severe: {
        label: "Professional Help Recommended",
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
    const [routineTab, setRoutineTab] = useState<"morning" | "night">("morning");
    const [shareMsg, setShareMsg] = useState<string | null>(null);

    const handleShare = async () => {
        setShareMsg("Generating...");

        // Build a styled report card in a hidden div
        const card = document.createElement("div");
        card.style.cssText = `
            width:420px; padding:32px; background:linear-gradient(135deg,#0a0e1a 0%,#111827 100%);
            color:white; font-family:system-ui,-apple-system,sans-serif; border-radius:24px;
            position:fixed; left:-9999px; top:0; z-index:-1;
        `;

        const severityColors: Record<string, string> = { Mild: "#34d399", Moderate: "#fbbf24", Severe: "#f87171" };
        const sColor = severityColors[severity] || "#a1a1aa";
        const confPct = Math.round(confidence);

        const morningSteps = (recommendations?.morning_routine || []).map((s: string, i: number) => `<div style="padding:6px 0;font-size:12px;color:#d4d4d8;border-bottom:1px solid rgba(255,255,255,0.05)"><span style="color:${sColor};font-weight:700">${i + 1}.</span> ${s}</div>`).join("");
        const nightSteps = (recommendations?.night_routine || []).map((s: string, i: number) => `<div style="padding:6px 0;font-size:12px;color:#d4d4d8;border-bottom:1px solid rgba(255,255,255,0.05)"><span style="color:${sColor};font-weight:700">${i + 1}.</span> ${s}</div>`).join("");
        const dosList = (recommendations?.dos || []).map((s: string) => `<div style="padding:3px 0;font-size:11px;color:#86efac">+ ${s}</div>`).join("");
        const dontsList = (recommendations?.donts || []).map((s: string) => `<div style="padding:3px 0;font-size:11px;color:#fca5a5">- ${s}</div>`).join("");

        card.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
                <div style="font-size:18px;font-weight:900;letter-spacing:0.15em">ACNE AI</div>
                <div style="font-size:10px;color:#71717a;letter-spacing:0.1em">SKIN ANALYSIS REPORT</div>
            </div>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:16px">
                <div style="display:flex;align-items:center;gap:16px">
                    <div style="width:64px;height:64px;border-radius:50%;border:3px solid ${sColor};display:flex;align-items:center;justify-content:center;flex-direction:column">
                        <div style="font-size:20px;font-weight:900;color:${sColor}">${confPct}%</div>
                    </div>
                    <div>
                        <div style="font-size:22px;font-weight:900;margin-bottom:4px">${severity} Acne</div>
                        <div style="font-size:12px;color:#a1a1aa">${primary_diagnosis?.type || ""}</div>
                        <div style="font-size:11px;color:#71717a;margin-top:2px">Skin Type: ${skin_type || "N/A"}</div>
                    </div>
                </div>
                ${recommendations?.timeline ? `<div style="margin-top:12px;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;font-size:11px;color:#a1a1aa">Expected results: <strong style="color:#e5e5e5">${recommendations.timeline}</strong></div>` : ""}
            </div>
            ${morningSteps ? `<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;color:#fbbf24;letter-spacing:0.1em;margin-bottom:6px">MORNING ROUTINE</div>${morningSteps}</div>` : ""}
            ${nightSteps ? `<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;color:#818cf8;letter-spacing:0.1em;margin-bottom:6px">NIGHT ROUTINE</div>${nightSteps}</div>` : ""}
            ${dosList || dontsList ? `
                <div style="display:flex;gap:8px;margin-bottom:16px">
                    ${dosList ? `<div style="flex:1;padding:10px;background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.1);border-radius:10px"><div style="font-size:10px;font-weight:700;color:#22c55e;margin-bottom:4px">DO'S</div>${dosList}</div>` : ""}
                    ${dontsList ? `<div style="flex:1;padding:10px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.1);border-radius:10px"><div style="font-size:10px;font-weight:700;color:#ef4444;margin-bottom:4px">DON'TS</div>${dontsList}</div>` : ""}
                </div>
            ` : ""}
            <div style="text-align:center;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05)">
                <div style="font-size:9px;color:#52525b;letter-spacing:0.15em">ANALYZED BY ACNE AI - acne-ai-doc.vercel.app</div>
            </div>
        `;

        document.body.appendChild(card);

        try {
            const { default: html2canvas } = await import("html2canvas-pro");
            const canvas = await html2canvas(card, { backgroundColor: null, scale: 2 });
            document.body.removeChild(card);

            const blob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((b) => resolve(b!), "image/png")
            );
            const file = new File([blob], "acne-ai-report.png", { type: "image/png" });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({ title: "Acne AI Report", files: [file] });
                setShareMsg("Shared!");
            } else {
                // Download fallback
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "acne-ai-report.png";
                a.click();
                URL.revokeObjectURL(url);
                setShareMsg("Downloaded!");
            }
        } catch {
            document.body.removeChild(card);
            setShareMsg("Error");
        }
        setTimeout(() => setShareMsg(null), 2500);
    };

    const severityColor: Record<string, string> = {
        Mild: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
        Moderate: "text-amber-400 bg-amber-400/10 border-amber-400/30",
        Severe: "text-red-400 bg-red-400/10 border-red-400/30",
    };

    const colorClass = severityColor[severity] || "text-zinc-400 bg-zinc-400/10 border-zinc-400/30";

    // Structured data
    const likelyTypes: string[] = recommendations?.likely_types || [];
    const personalizedPlan: string[] = recommendations?.personalized_plan || recommendations?.general || (Array.isArray(recommendations) ? recommendations : []);
    const typeTreatments: Record<string, string[]> = recommendations?.type_treatments || {};
    const timeline: string | null = recommendations?.timeline || null;
    const keyIngredients: { name: string; purpose: string }[] = recommendations?.key_ingredients || [];
    const morningRoutine: string[] = recommendations?.morning_routine || [];
    const nightRoutine: string[] = recommendations?.night_routine || [];
    const dos: string[] = recommendations?.dos || [];
    const donts: string[] = recommendations?.donts || [];
    const products: { name: string; type: string; key_ingredient: string }[] = recommendations?.products || [];

    const urgency = urgencyConfig[severity] || urgencyConfig.Moderate;
    const UrgencyIcon = urgency.icon;

    const currentRoutine = routineTab === "morning" ? morningRoutine : nightRoutine;

    return (
        <div id="results-view" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                {/* ─── Left Column: Image + Gauge ─── */}
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
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${colorClass}`}>
                                    {severity}
                                </span>
                                {likelyTypes.length > 0 && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
                                        {likelyTypes[0]}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-white">{severity} Acne Detected</h2>
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
                            <div className="backdrop-blur-md bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                <p className="text-zinc-500 text-[10px] uppercase tracking-[0.15em] font-bold mb-1">Skin Type</p>
                                <p className="text-lg font-black text-indigo-400">{skin_type || "Not Set"}</p>
                            </div>
                            <div className="backdrop-blur-md bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                <p className="text-zinc-500 text-[10px] uppercase tracking-[0.15em] font-bold mb-1">Status</p>
                                <p className="text-lg font-black flex items-center gap-2">
                                    {severity === "Severe" ? <AlertCircle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                                    {severity}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ─── Key Ingredients ─── */}
                    {keyIngredients.length > 0 && (
                        <div className="backdrop-blur-md bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                            <h3 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-400 mb-4 flex items-center gap-2">
                                <FlaskConical className="w-4 h-4 text-indigo-400" />
                                Key Ingredients to Look For
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {keyIngredients.map((ing, i) => (
                                    <div key={i} className="group relative">
                                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-default">
                                            {ing.name}
                                        </span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-800 text-zinc-200 text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-xl z-10">
                                            {ing.purpose}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Right Column: Treatment Dashboard ─── */}
                <div className="flex flex-col h-full justify-between gap-6">
                    <div className="space-y-6">
                        {/* Urgency Banner */}
                        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${urgency.bgClass}`}>
                            <UrgencyIcon className={`w-5 h-5 mt-0.5 shrink-0 ${urgency.color}`} />
                            <div>
                                <p className={`text-sm font-black tracking-wide ${urgency.color}`}>
                                    {urgency.label}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">{urgency.message}</p>
                                {severity === "Severe" && (
                                    <a
                                        href="https://find-a-derm.aad.org/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 rounded-xl text-red-300 text-xs font-bold transition-all hover:scale-[1.02]"
                                    >
                                        <Stethoscope className="w-3.5 h-3.5" />
                                        Find a Dermatologist Near You
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* ─── Timeline ─── */}
                        {timeline && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                                <p className="text-sm text-zinc-300">
                                    <span className="font-bold text-indigo-400">Expected results:</span> {timeline}
                                </p>
                            </div>
                        )}

                        {/* ─── AM / PM Routine Tabs ─── */}
                        {(morningRoutine.length > 0 || nightRoutine.length > 0) && (
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-400 mb-4 flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-indigo-400" />
                                    Your Daily Routine
                                </h3>
                                {/* Tab Switcher */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => setRoutineTab("morning")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 border ${routineTab === "morning"
                                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                            : "bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                                            }`}
                                    >
                                        <Sun className="w-4 h-4" />
                                        Morning
                                    </button>
                                    <button
                                        onClick={() => setRoutineTab("night")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 border ${routineTab === "night"
                                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                                            : "bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                                            }`}
                                    >
                                        <Moon className="w-4 h-4" />
                                        Night
                                    </button>
                                </div>
                                {/* Routine Steps */}
                                <div className="space-y-2">
                                    {currentRoutine.map((step, i) => (
                                        <div
                                            key={`${routineTab}-${i}`}
                                            className="backdrop-blur-md bg-white/[0.03] p-4 rounded-xl border border-white/5 flex gap-4 items-start hover:bg-white/[0.06] transition-all duration-300"
                                            style={{
                                                animationDelay: `${i * 100}ms`,
                                                animation: "fadeSlideUp 0.4s ease-out both",
                                            }}
                                        >
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-black text-sm border ${routineTab === "morning"
                                                ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                                                : "bg-indigo-500/15 text-indigo-400 border-indigo-500/20"
                                                }`}>
                                                {i + 1}
                                            </div>
                                            <p className="text-zinc-300 leading-relaxed text-sm">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ─── Do's & Don'ts Grid ─── */}
                        {(dos.length > 0 || donts.length > 0) && (
                            <div className="grid grid-cols-2 gap-3">
                                {/* Do's */}
                                <div className="backdrop-blur-md bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                    <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-400 mb-3">
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        Do&apos;s
                                    </h4>
                                    <div className="space-y-2">
                                        {dos.map((d, i) => (
                                            <p key={i} className="text-[12px] text-zinc-400 leading-relaxed flex gap-2">
                                                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                                                {d}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                {/* Don'ts */}
                                <div className="backdrop-blur-md bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                    <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-red-400 mb-3">
                                        <ThumbsDown className="w-3.5 h-3.5" />
                                        Don&apos;ts
                                    </h4>
                                    <div className="space-y-2">
                                        {donts.map((d, i) => (
                                            <p key={i} className="text-[12px] text-zinc-400 leading-relaxed flex gap-2">
                                                <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                                                {d}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Product Recommendations ─── */}
                        {products.length > 0 && (
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-400 mb-4 flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                                    Recommended Products
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {products.map((p, i) => (
                                        <div
                                            key={i}
                                            className="backdrop-blur-md bg-white/[0.03] p-3 rounded-xl border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
                                            style={{
                                                animationDelay: `${i * 80}ms`,
                                                animation: "fadeSlideUp 0.4s ease-out both",
                                            }}
                                        >
                                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-400/60">{p.type}</p>
                                            <p className="text-sm font-bold text-zinc-200 mt-0.5 leading-tight">{p.name}</p>
                                            <p className="text-[11px] text-zinc-500 mt-1">{p.key_ingredient}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ─── Type-Specific Treatments (Expandable) ─── */}
                        {Object.keys(typeTreatments).length > 0 && (
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-400 mb-3 flex items-center gap-2">
                                    <span className="bg-gradient-to-b from-cyan-400 to-cyan-600 w-1 h-4 rounded-full block"></span>
                                    Type-Specific Treatments
                                </h3>
                                <div className="space-y-2">
                                    {Object.entries(typeTreatments).map(([typeName, tips]) => (
                                        <div key={typeName} className="backdrop-blur-md bg-white/[0.03] rounded-xl border border-white/5 overflow-hidden">
                                            <button
                                                onClick={() => setExpandedType(expandedType === typeName ? null : typeName)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.04] transition-colors"
                                            >
                                                <span className="font-bold text-cyan-400 text-sm">{typeName}</span>
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

                        {/* ─── Disclaimer ─── */}
                        <div className="backdrop-blur-md bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-black text-zinc-400 text-xs uppercase tracking-[0.1em] mb-1">Medical Disclaimer</h4>
                                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                                        This AI analysis is for informational purposes only and does not constitute medical advice. Always consult a certified dermatologist for professional diagnosis and treatment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Action Buttons ─── */}
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={onReset}
                            className="flex-1 py-4 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 border border-white/5 hover:border-white/15 hover:scale-[1.01]"
                        >
                            <RefreshCw className="w-5 h-5" />
                            New Photo
                        </button>
                        <button
                            onClick={handleShare}
                            className="px-5 py-4 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl font-bold transition-all duration-200 border border-white/5 hover:border-white/15 hover:scale-[1.01] flex items-center gap-2"
                        >
                            <Share2 className="w-5 h-5" />
                            {shareMsg || "Share"}
                        </button>
                        <button
                            onClick={async () => {
                                const { default: html2canvas } = await import("html2canvas-pro");
                                const el = document.getElementById("results-view");
                                if (!el) return;
                                const canvas = await html2canvas(el, { backgroundColor: "#030303", scale: 2 });
                                const url = canvas.toDataURL("image/png");
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `acne-ai-report-${new Date().toISOString().slice(0, 10)}.png`;
                                a.click();
                            }}
                            className="px-5 py-4 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl font-bold transition-all duration-200 border border-white/5 hover:border-white/15 hover:scale-[1.01] flex items-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            PDF
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
