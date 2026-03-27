"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sun, Moon, Droplets, ShieldCheck, Sparkles, AlertTriangle, Pill, FlaskConical, Clock, Leaf, Zap, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 20, stiffness: 80 } },
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

interface SkinProfile {
    type: string;
    concerns: string[];
    lastSeverity: string;
}

const treatmentPlans: Record<string, {
    morning: { step: string; product: string; tip: string }[];
    evening: { step: string; product: string; tip: string }[];
    keyIngredients: { name: string; benefit: string; icon: any }[];
    lifestyle: string[];
    avoid: string[];
    timeline: string;
}> = {
    Mild: {
        morning: [
            { step: "Gentle Cleanser", product: "CeraVe Foaming Cleanser", tip: "Lukewarm water, 60 seconds" },
            { step: "Niacinamide Serum", product: "The Ordinary Niacinamide 10%", tip: "Controls oil & reduces pores" },
            { step: "Moisturizer", product: "Neutrogena Hydro Boost", tip: "Lightweight & non-comedogenic" },
            { step: "Sunscreen SPF 50", product: "La Roche-Posay Anthelios", tip: "Reapply every 2 hours outdoors" },
        ],
        evening: [
            { step: "Oil Cleanser", product: "DHC Deep Cleansing Oil", tip: "Removes sunscreen & makeup" },
            { step: "Water Cleanser", product: "CeraVe Foaming Cleanser", tip: "Double cleanse for clean skin" },
            { step: "Salicylic Acid", product: "Paula's Choice 2% BHA", tip: "Use 3x/week, not daily at start" },
            { step: "Night Moisturizer", product: "CeraVe PM Facial Moisturizer", tip: "Lock in hydration overnight" },
        ],
        keyIngredients: [
            { name: "Salicylic Acid (BHA)", benefit: "Unclogs pores, reduces blackheads", icon: FlaskConical },
            { name: "Niacinamide", benefit: "Controls oil, minimizes pores", icon: Droplets },
            { name: "Green Tea Extract", benefit: "Anti-inflammatory, antioxidant", icon: Leaf },
        ],
        lifestyle: [
            "Change pillowcase every 2-3 days",
            "Don't touch your face during the day",
            "Stay hydrated — aim for 8 glasses of water",
            "Clean phone screen regularly",
            "Exercise 30 min/day to boost circulation",
        ],
        avoid: [
            "Harsh scrubs and physical exfoliants",
            "Touching or picking at blemishes",
            "Heavy, oil-based makeup",
            "Sleeping with makeup on",
        ],
        timeline: "Visible improvement in 4-6 weeks with consistent use",
    },
    Moderate: {
        morning: [
            { step: "Gentle Cleanser", product: "La Roche-Posay Toleriane", tip: "Don't strip skin barrier" },
            { step: "Azelaic Acid", product: "The Ordinary Azelaic Acid 10%", tip: "Reduces redness & inflammation" },
            { step: "Moisturizer", product: "CeraVe Moisturizing Cream", tip: "Ceramides repair skin barrier" },
            { step: "Sunscreen SPF 50", product: "EltaMD UV Clear", tip: "Contains niacinamide, great for acne" },
        ],
        evening: [
            { step: "Oil Cleanser", product: "Banila Co Clean It Zero", tip: "Melts away daily grime" },
            { step: "Water Cleanser", product: "La Roche-Posay Toleriane", tip: "pH-balanced, no irritation" },
            { step: "Retinol Treatment", product: "Differin Gel 0.1%", tip: "Start 2x/week, increase gradually" },
            { step: "Spot Treatment", product: "Cosrx Pimple Patches", tip: "Cover active spots overnight" },
            { step: "Barrier Repair", product: "CeraVe Night Cream", tip: "Supports retinol recovery" },
        ],
        keyIngredients: [
            { name: "Retinol / Adapalene", benefit: "Increases cell turnover, prevents clogging", icon: Zap },
            { name: "Azelaic Acid", benefit: "Anti-bacterial, reduces hyperpigmentation", icon: FlaskConical },
            { name: "Benzoyl Peroxide", benefit: "Kills acne bacteria (use as spot treatment)", icon: ShieldCheck },
            { name: "Centella Asiatica", benefit: "Calms inflammation, speeds healing", icon: Leaf },
        ],
        lifestyle: [
            "Avoid dairy — linked to hormonal breakouts",
            "Reduce sugar and processed food intake",
            "Get 7-8 hours of quality sleep",
            "Manage stress through meditation or yoga",
            "Don't skip moisturizer even if skin is oily",
            "Track triggers in a skin diary",
        ],
        avoid: [
            "Using retinol and AHA/BHA on the same night",
            "Over-washing face (max 2x daily)",
            "Popping or squeezing pimples",
            "Alcohol-based toners",
            "Fragrance-heavy skincare products",
        ],
        timeline: "Significant improvement in 8-12 weeks. Initial purging may occur with retinol (weeks 2-4)",
    },
    Severe: {
        morning: [
            { step: "Gentle Cleanser", product: "Vanicream Gentle Facial Cleanser", tip: "Ultra-gentle, no irritants" },
            { step: "Prescription Antibiotic", product: "Clindamycin Lotion 1%", tip: "Apply thin layer to affected areas" },
            { step: "Moisturizer", product: "Vanicream Daily Facial Moisturizer", tip: "Fragrance-free, hypoallergenic" },
            { step: "Mineral Sunscreen SPF 50", product: "EltaMD UV Physical", tip: "Physical blocker — less irritating" },
        ],
        evening: [
            { step: "Gentle Cleanser", product: "Vanicream Gentle Cleanser", tip: "Don't scrub, just massage gently" },
            { step: "Prescription Retinoid", product: "Tretinoin 0.025%", tip: "Dermatologist prescribed — start low" },
            { step: "Healing Ointment", product: "Aquaphor on dry patches", tip: "Only where skin is peeling" },
            { step: "Thick Moisturizer", product: "CeraVe Moisturizing Cream", tip: "Seal in moisture overnight" },
        ],
        keyIngredients: [
            { name: "Tretinoin (Rx)", benefit: "Gold standard for severe acne, prescription only", icon: Pill },
            { name: "Benzoyl Peroxide (2.5%)", benefit: "Lower concentration = less irritation, still effective", icon: ShieldCheck },
            { name: "Clindamycin (Rx)", benefit: "Topical antibiotic for bacterial acne", icon: FlaskConical },
            { name: "Ceramides", benefit: "Repair damaged skin barrier", icon: Heart },
        ],
        lifestyle: [
            "See a dermatologist — Rx treatments may be needed",
            "Consider topical or oral antibiotics (doctor prescribed)",
            "Ask about hormonal treatments if applicable",
            "Be patient — severe acne takes 3-6 months to improve",
            "Photograph progress monthly to track improvement",
            "Consider Accutane/Isotretinoin for resistant cases",
        ],
        avoid: [
            "All physical exfoliation",
            "Multiple active ingredients at once",
            "DIY remedies (toothpaste, lemon juice, etc.)",
            "Skipping sunscreen (especially on retinoids)",
            "Giving up too early — consistency is key",
        ],
        timeline: "Professional treatment takes 3-6 months for full results. Be patient and consistent.",
    },
};

export default function TreatmentsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<SkinProfile>({ type: "Normal", concerns: [], lastSeverity: "Mild" });
    const [routineTab, setRoutineTab] = useState<"morning" | "evening">("morning");

    useEffect(() => {
        const user = localStorage.getItem("acne_user");
        if (!user) { router.push("/login"); return; }

        const skinData = localStorage.getItem("skin_type");
        const historyData = localStorage.getItem("acne_scan_history");

        let skinType = "Normal";
        if (skinData) {
            try { skinType = JSON.parse(skinData).type || "Normal"; } catch { }
        }

        let lastSeverity = "Mild";
        if (historyData) {
            try {
                const history = JSON.parse(historyData);
                if (history.length > 0) lastSeverity = history[0].severity || "Mild";
            } catch { }
        }

        setProfile({ type: skinType, concerns: [], lastSeverity });
    }, [router]);

    const plan = treatmentPlans[profile.lastSeverity] || treatmentPlans.Mild;
    const currentRoutine = routineTab === "morning" ? plan.morning : plan.evening;

    const severityGradient: Record<string, string> = {
        Mild: "from-emerald-500/20 to-cyan-500/10",
        Moderate: "from-amber-500/20 to-orange-500/10",
        Severe: "from-red-500/20 to-rose-500/10",
    };

    return (
        <div className="min-h-screen bg-[#060a14] text-white antialiased selection:bg-indigo-500/30 relative overflow-hidden">
            {/* Background */}
            <div className={`absolute top-0 left-1/3 w-[600px] h-[400px] bg-gradient-to-br ${severityGradient[profile.lastSeverity] || severityGradient.Mild} rounded-full blur-[140px] pointer-events-none`} />

            <div className="relative z-10 px-6 py-8 max-w-3xl mx-auto">
                {/* Header */}
                <header className="flex items-center gap-4 mb-10">
                    <Link href="/history" className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Treatment Plan</h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Personalized for <span className="text-indigo-400 font-bold">{profile.type}</span> skin · <span className={profile.lastSeverity === "Mild" ? "text-emerald-400" : profile.lastSeverity === "Moderate" ? "text-amber-400" : "text-red-400"}>{profile.lastSeverity}</span> acne
                        </p>
                    </div>
                </header>

                <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">

                    {/* Timeline Banner */}
                    <motion.div variants={fadeUp} className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15">
                        <Clock className="w-5 h-5 text-indigo-400 shrink-0" />
                        <p className="text-sm text-zinc-300">
                            <span className="font-bold text-indigo-400">Expected timeline:</span> {plan.timeline}
                        </p>
                    </motion.div>

                    {/* Routine Tabs */}
                    <motion.div variants={fadeUp}>
                        <h2 className="text-xs font-black uppercase tracking-[0.15em] text-zinc-500 mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            Daily Skincare Routine
                        </h2>

                        <div className="flex gap-2 mb-5">
                            <button
                                onClick={() => setRoutineTab("morning")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 border ${routineTab === "morning"
                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-lg shadow-amber-500/5"
                                    : "bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-300"
                                    }`}
                            >
                                <Sun className="w-4 h-4" />
                                Morning
                            </button>
                            <button
                                onClick={() => setRoutineTab("evening")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 border ${routineTab === "evening"
                                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-lg shadow-indigo-500/5"
                                    : "bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-300"
                                    }`}
                            >
                                <Moon className="w-4 h-4" />
                                Evening
                            </button>
                        </div>

                        <div className="space-y-3">
                            {currentRoutine.map((item, i) => (
                                <motion.div
                                    key={`${routineTab}-${i}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="bg-white/[0.02] hover:bg-white/[0.05] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm border ${routineTab === "morning"
                                            ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                                            : "bg-indigo-500/15 text-indigo-400 border-indigo-500/20"
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white">{item.step}</p>
                                            <p className="text-xs text-indigo-400/70 font-medium mt-0.5">{item.product}</p>
                                            <p className="text-xs text-zinc-500 mt-1 group-hover:text-zinc-400 transition-colors">{item.tip}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Key Ingredients */}
                    <motion.div variants={fadeUp}>
                        <h2 className="text-xs font-black uppercase tracking-[0.15em] text-zinc-500 mb-4 flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-indigo-400" />
                            Key Ingredients
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {plan.keyIngredients.map((ing, i) => {
                                const Icon = ing.icon;
                                return (
                                    <div key={i} className="bg-white/[0.02] p-4 rounded-xl border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon className="w-4 h-4 text-indigo-400" />
                                            <p className="text-sm font-bold text-white">{ing.name}</p>
                                        </div>
                                        <p className="text-xs text-zinc-500">{ing.benefit}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Lifestyle Tips + Avoid */}
                    <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Lifestyle */}
                        <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-400 mb-4">
                                <Sparkles className="w-3.5 h-3.5" />
                                Lifestyle Tips
                            </h3>
                            <div className="space-y-2.5">
                                {plan.lifestyle.map((tip, i) => (
                                    <p key={i} className="text-xs text-zinc-400 flex gap-2 leading-relaxed">
                                        <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                                        {tip}
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Avoid */}
                        <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-red-400 mb-4">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Avoid
                            </h3>
                            <div className="space-y-2.5">
                                {plan.avoid.map((item, i) => (
                                    <p key={i} className="text-xs text-zinc-400 flex gap-2 leading-relaxed">
                                        <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                                        {item}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Disclaimer */}
                    <motion.div variants={fadeUp} className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-black text-zinc-400 text-xs uppercase tracking-[0.1em] mb-1">Medical Disclaimer</p>
                                <p className="text-[11px] text-zinc-600 leading-relaxed">
                                    This treatment plan is AI-generated for informational purposes only and does not replace professional dermatological advice. Always consult a board-certified dermatologist before starting new treatments, especially prescription medications.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* CTA */}
                    <motion.div variants={fadeUp} className="flex gap-3">
                        <Link href="/analyze" className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl font-bold text-center hover:from-indigo-500 hover:to-cyan-500 transition-all shadow-lg shadow-indigo-500/20">
                            Scan Again
                        </Link>
                        <Link href="/history" className="px-6 py-4 bg-white/[0.05] border border-white/5 text-white rounded-xl font-bold hover:bg-white/[0.1] transition-all">
                            History
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
