"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [name, setName] = useState("");
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            localStorage.setItem("acne_user", name);
            router.push("/analyze");
        }
    };

    return (
        <main className="min-h-screen bg-[#060a14] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated gradient orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-600/8 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

            <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-zinc-500 mb-4">ACNE AI</p>
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                        <Sparkles className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome</h1>
                    <p className="text-zinc-500 text-sm">Enter your name to start your skin journey</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition font-medium"
                            placeholder="e.g. Alex"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                    >
                        Start Analyzing
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </main>
    );
}
