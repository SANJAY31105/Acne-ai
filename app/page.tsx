"use client";

import Link from "next/link";
import { ArrowRight, Camera, Sparkles, Shield, BarChart3, BrainCircuit, Fingerprint, ChevronDown } from "lucide-react";
import { motion, type Variants } from "framer-motion";

/* ─── Animated gradient background ─── */
function GradientHero() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />
    </div>
  );
}

/* ─── Staggered text reveal ─── */
function StaggeredText({ text, className }: { text: string; className?: string }) {
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.3 } },
  };
  const child: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 12, stiffness: 100 } },
  };

  return (
    <motion.h1 className={className} variants={container} initial="hidden" animate="visible">
      {text.split("").map((char, i) => (
        <motion.span key={i} variants={child} className="inline-block">
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.h1>
  );
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 20 } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function Home() {
  const steps = [
    { icon: <Camera className="w-6 h-6" />, phase: "01", title: "Snap", desc: "Take a photo of your skin with your phone camera. No special equipment needed." },
    { icon: <Sparkles className="w-6 h-6" />, phase: "02", title: "Scan", desc: "Our AI analyzes your skin using deep learning trained on clinical dermatology data." },
    { icon: <Shield className="w-6 h-6" />, phase: "03", title: "Solve", desc: "Get a personalized routine with products, timelines, and dermatologist-backed advice." },
  ];

  const features = [
    { title: "Computer Vision", desc: "Facial landmark detection for precise analysis.", icon: <Fingerprint className="w-5 h-5" /> },
    { title: "Deep Learning", desc: "Neural networks trained on 50k+ clinical samples.", icon: <BrainCircuit className="w-5 h-5" /> },
    { title: "Progress Tracking", desc: "Track your healing trajectory over time.", icon: <BarChart3 className="w-5 h-5" /> },
    { title: "Privacy First", desc: "Your data never leaves your device.", icon: <Shield className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-[#060a14] text-white min-h-screen antialiased overflow-x-hidden selection:bg-indigo-500/30">

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 py-5 backdrop-blur-xl bg-[#060a14]/70 border-b border-white/5">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="text-xl md:text-2xl font-black tracking-[0.25em] uppercase hover:text-indigo-400 transition-colors">
            ACNE AI
          </Link>
          <div className="flex items-center gap-6 md:gap-8 text-xs md:text-sm font-medium tracking-widest uppercase text-zinc-400">
            <Link href="/skin-quiz" className="hover:text-white transition-colors">Quiz</Link>
            <Link href="/analyze" className="hover:text-white transition-colors">Scan</Link>
            <Link href="/history" className="hover:text-white transition-colors">History</Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6">
        <GradientHero />

        <div className="relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase">
              AI-Powered Skin Analysis
            </span>
          </motion.div>

          <StaggeredText
            text="Clear Skin Starts Here."
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.0, duration: 1 }}
            className="mt-8 text-base md:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed"
          >
            Snap a photo. Get an instant AI diagnosis. Receive a personalized skincare routine — all in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <Link
              href="/analyze"
              className="group px-8 py-4 bg-white text-black rounded-full font-bold text-sm tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center gap-2"
            >
              Start Scanning
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/skin-quiz"
              className="px-8 py-4 border border-white/10 hover:border-white/25 rounded-full font-bold text-sm tracking-wide transition-all hover:bg-white/5"
            >
              Take Skin Quiz
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-500">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-zinc-500" />
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative py-28 md:py-36 px-6 bg-[#060a14]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-20">
            <span className="text-indigo-500 text-xs font-bold tracking-[0.3em] uppercase">How It Works</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mt-4">Three Simple Steps.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group relative p-8 md:p-10 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-indigo-500/20 transition-all duration-500"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                    {step.icon}
                  </div>
                  <span className="text-zinc-600 text-xs font-mono tracking-wider">PHASE {step.phase}</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-3">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-400 transition-colors">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative py-28 md:py-36 px-6 bg-[#060a14] border-t border-white/5">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-20">
            <span className="text-indigo-500 text-xs font-bold tracking-[0.3em] uppercase">Technology</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mt-4">Clinical Intelligence.</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group flex items-start gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500"
              >
                <div className="mt-0.5 w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold tracking-tight mb-1">{item.title}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-400 transition-colors">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-28 md:py-36 px-6 bg-[#060a14]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={staggerContainer}
          className="text-center max-w-2xl mx-auto"
        >
          <motion.h2 variants={fadeUp} className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            Start Now.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-zinc-500 text-base md:text-lg mb-10">
            Analyze your skin today. Reclaim your confidence tomorrow.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link
              href="/analyze"
              className="group px-10 py-5 bg-white text-black rounded-full font-black text-base transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center gap-3"
            >
              Scan Your Skin
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
            <Link
              href="/skin-quiz"
              className="px-10 py-5 border border-white/10 hover:border-white/25 rounded-full font-black text-base transition-all hover:bg-white/5"
            >
              Take Quiz
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="w-full text-center py-12 border-t border-white/5 bg-[#060a14]">
        <p className="text-[10px] font-bold tracking-[0.8em] uppercase text-zinc-700">ACNE AI — 2026</p>
      </footer>
    </div>
  );
}
