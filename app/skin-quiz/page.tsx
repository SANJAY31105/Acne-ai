"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Droplets, Sun, Sparkles, Shield, Zap } from "lucide-react";
import Link from "next/link";

const QUESTIONS = [
    {
        id: "oiliness",
        question: "How does your skin feel by midday?",
        icon: Droplets,
        options: [
            { label: "Very oily & shiny", value: "oily" },
            { label: "Tight, flaky, or rough", value: "dry" },
            { label: "Oily T-zone, dry cheeks", value: "combination" },
            { label: "Comfortable, no issues", value: "normal" },
        ],
    },
    {
        id: "sensitivity",
        question: "How does your skin react to new products?",
        icon: Shield,
        options: [
            { label: "Burns, stings, or turns red easily", value: "sensitive" },
            { label: "Occasionally irritated", value: "moderate" },
            { label: "Rarely reacts to anything", value: "resilient" },
        ],
    },
    {
        id: "pores",
        question: "How would you describe your pores?",
        icon: Sun,
        options: [
            { label: "Large and visible (especially nose/cheeks)", value: "large" },
            { label: "Small and barely visible", value: "small" },
            { label: "Mixed — large on nose, small elsewhere", value: "mixed" },
        ],
    },
    {
        id: "breakouts",
        question: "How often do you get breakouts?",
        icon: Zap,
        options: [
            { label: "Constantly — new pimples every week", value: "frequent" },
            { label: "Sometimes — around period or stress", value: "occasional" },
            { label: "Rarely — once every few months", value: "rare" },
        ],
    },
    {
        id: "hydration",
        question: "After washing your face (no moisturizer), how does it feel after 30 minutes?",
        icon: Sparkles,
        options: [
            { label: "Oily and slick again", value: "oily" },
            { label: "Dry, tight, or uncomfortable", value: "dry" },
            { label: "Normal and comfortable", value: "normal" },
        ],
    },
];

function determineSkinType(answers: Record<string, string>): { type: string; description: string } {
    const oilySignals = [answers.oiliness === "oily", answers.hydration === "oily", answers.pores === "large"].filter(Boolean).length;
    const drySignals = [answers.oiliness === "dry", answers.hydration === "dry", answers.pores === "small"].filter(Boolean).length;
    const sensitiveSignals = answers.sensitivity === "sensitive";
    const comboSignals = answers.oiliness === "combination" || answers.pores === "mixed";

    if (sensitiveSignals && drySignals >= 1) {
        return { type: "Sensitive", description: "Your skin is easily irritated and tends to be dry. Gentle, fragrance-free products are essential." };
    }
    if (sensitiveSignals) {
        return { type: "Sensitive", description: "Your skin reacts easily to products. Stick to hypoallergenic, fragrance-free formulas." };
    }
    if (oilySignals >= 2) {
        return { type: "Oily", description: "Your skin produces excess sebum, especially in the T-zone. Oil-free and non-comedogenic products work best." };
    }
    if (drySignals >= 2) {
        return { type: "Dry", description: "Your skin lacks moisture and can feel tight or flaky. Rich, hydrating products are your friend." };
    }
    if (comboSignals) {
        return { type: "Combination", description: "Your skin is oily in some areas and dry in others. You may need different products for different zones." };
    }
    return { type: "Normal", description: "Your skin is well-balanced — not too oily or too dry. Lucky you! Focus on maintenance." };
}

export default function SkinQuizPage() {
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<{ type: string; description: string } | null>(null);
    const router = useRouter();

    const handleAnswer = (questionId: string, value: string) => {
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);

        if (currentQ < QUESTIONS.length - 1) {
            setTimeout(() => setCurrentQ(currentQ + 1), 300);
        } else {
            // All done — determine skin type
            const skinType = determineSkinType(newAnswers);
            setResult(skinType);
            // Save to localStorage for use in analysis
            localStorage.setItem("skin_type", JSON.stringify(skinType));
        }
    };

    const question = QUESTIONS[currentQ];
    const Icon = question.icon;
    const progress = ((currentQ + (result ? 1 : 0)) / QUESTIONS.length) * 100;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 font-sans">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-10">
                Acne AI — Skin Type Quiz
            </Link>

            {/* Progress Bar */}
            <div className="w-full max-w-lg mb-8">
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-right">
                    {result ? "Complete!" : `Question ${currentQ + 1} of ${QUESTIONS.length}`}
                </p>
            </div>

            {!result ? (
                /* Question Card */
                <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300" key={currentQ}>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6">
                            <Icon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-6">{question.question}</h2>
                        <div className="space-y-3">
                            {question.options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleAnswer(question.id, opt.value)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group
                                        ${answers[question.id] === opt.value
                                            ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                                            : "bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300"
                                        }`}
                                >
                                    <span>{opt.label}</span>
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* Result Card */
                <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 mx-auto mb-6 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-zinc-500 text-sm uppercase tracking-widest mb-2">Your Skin Type</p>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                            {result.type}
                        </h2>
                        <p className="text-zinc-400 leading-relaxed mb-8">{result.description}</p>

                        <button
                            onClick={() => router.push("/analyze")}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/20"
                        >
                            Continue to AI Scan →
                        </button>

                        <button
                            onClick={() => {
                                setCurrentQ(0);
                                setAnswers({});
                                setResult(null);
                            }}
                            className="mt-3 text-sm text-zinc-500 hover:text-zinc-300 transition"
                        >
                            Retake Quiz
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
