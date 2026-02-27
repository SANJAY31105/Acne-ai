"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ArrowRight, ChevronDown, Camera, Sparkles, Shield, BarChart3, Binary, BrainCircuit, Fingerprint } from "lucide-react";
import { motion, useScroll, useTransform, type Variants, useSpring } from "framer-motion";
import { useRef, useEffect } from "react";
import Lenis from "lenis";

const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 -z-10 bg-[#030303]" />,
});

/* ─── Character-level Reveal Component ─── */
function StaggeredText({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { duration: 0.12, staggerChildren: 0.08, delayChildren: 0.5 * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  };

  return (
    <motion.h1
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <span key={index} className="inline-block mr-[0.2em] whitespace-nowrap">
          {word.split("").map((char, charIndex) => (
            <motion.span key={charIndex} variants={child} className="inline-block">
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.h1>
  );
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });
    let raf: number;
    function loop(time: number) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Hero Parallax (tightened ranges for better flow)
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.85]);
  const heroY = useTransform(scrollYProgress, [0, 0.12], [0, -150]);

  // Panel Parallax
  const img1Y = useTransform(scrollYProgress, [0.05, 0.3], [150, -150]);
  const img2Y = useTransform(scrollYProgress, [0.28, 0.53], [150, -150]);
  const img3Y = useTransform(scrollYProgress, [0.5, 0.75], [150, -150]);

  // Text reveals
  const t1 = useTransform(scrollYProgress, [0.1, 0.18, 0.3], [0, 1, 0]);
  const t2 = useTransform(scrollYProgress, [0.33, 0.41, 0.53], [0, 1, 0]);
  const t3 = useTransform(scrollYProgress, [0.55, 0.63, 0.75], [0, 1, 0]);

  const reveal: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 25 } },
  };

  const featureItems = [
    { title: "Computer Vision", desc: "Edge-based facial landmark detection for millimetric analysis accuracy.", icon: <Fingerprint className="w-6 h-6" /> },
    { title: "Deep Learning", desc: "MobileNetV2 architecture trained on 50k+ clinical dermatology samples.", icon: <BrainCircuit className="w-6 h-6" /> },
    { title: "Temporal Analysis", desc: "LSTM-powered time series analysis to track your healing trajectory.", icon: <BarChart3 className="w-6 h-6" /> },
    { title: "Zero Trust Privacy", desc: "Military-grade encryption. Your biological data never leaves your control.", icon: <Shield className="w-6 h-6" /> },
  ];

  return (
    <div ref={containerRef} className="text-white selection:bg-indigo-500/30 overflow-x-hidden antialiased">
      <HeroScene />

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-5 backdrop-blur-md bg-[#030303]/60 border-b border-white/5 group">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl md:text-3xl font-black tracking-[0.3em] uppercase text-white hover:text-indigo-400 transition-all duration-500">
            ACNE AI
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            {[
              { label: 'Skin Quiz', href: '/skin-quiz' },
              { label: 'Scan', href: '/analyze' },
              { label: 'History', href: '/history' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase text-zinc-400 hover:text-white transition-all relative overflow-hidden group/link"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-indigo-500 translate-x-[-101%] group-hover/link:translate-x-0 transition-transform duration-500" />
              </Link>
            ))}
          </div>
        </div>
        {/* Scroll Progress Bar */}
        <motion.div className="absolute bottom-0 left-0 h-[2px] bg-indigo-500 origin-left" style={{ scaleX }} />
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative h-[200vh] flex flex-col items-center justify-start pt-[30vh]">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="sticky top-[30vh] text-center px-6 z-20 will-change-transform"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-6 text-sm md:text-2xl font-bold tracking-[0.5em] uppercase text-indigo-400"
          >
            AI-Powered Skin Intelligence
          </motion.div>

          <StaggeredText text="CLEAR SKIN." className="text-[14vw] font-black tracking-tighter leading-[0.75] uppercase italic select-none" />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.2, duration: 1.5 }}
            className="mt-12 text-base md:text-xl text-zinc-500 max-w-xl mx-auto font-medium"
          >
            Capture precision results in seconds. Our state-of-the-art neural networks analyze acne severity with clinical-grade accuracy.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.8, duration: 1.5 }}
            className="mt-16 flex flex-col items-center gap-3"
          >
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Scroll</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── PANEL 1: Scan ─── */}
      <section className="relative h-[150vh] z-10">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-20 overflow-hidden">
          <motion.div
            style={{ y: img1Y }}
            className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/20 shadow-2xl will-change-transform z-0"
          >
            <Image
              src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=60&w=1200&auto=format"
              alt="Skincare routine closeup"
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              priority
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIBAAAgICAgIDAAAAAAAAAAAAAQIDBAARBSEGMRJBUf/EABQBAQAAAAAAAAAAAAAAAAAAAAP/xAAYEQADAQEAAAAAAAAAAAAAAAAAAQIREv/aAAwDAQACEQMRAD8Ax7iuTv1bMkMlmWWBGKrI7kkD6yfv3nTGSjTP//Z"
              className="object-cover opacity-70 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-60" />
          </motion.div>
          <motion.div style={{ opacity: t1 }} className="absolute z-10 text-center max-w-2xl px-6 pointer-events-none drop-shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Camera className="w-8 h-8 text-indigo-400" />
              <span className="text-indigo-400 font-mono text-sm tracking-[0.2em] uppercase">Phase 01</span>
            </div>
            <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic text-glow">SNAP. SCAN.</h2>
            <p className="text-lg md:text-2xl text-white font-medium leading-relaxed">High-fidelity pixel mapping detects <br className="hidden md:block" /> surface irregularities in milliseconds.</p>
          </motion.div>
        </div>
      </section>

      {/* ─── PANEL 2: Analyze ─── */}
      <section className="relative h-[150vh] z-10">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-20 overflow-hidden">
          <motion.div
            style={{ y: img2Y }}
            className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/20 shadow-2xl will-change-transform z-0"
          >
            <Image
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=60&w=1200&auto=format"
              alt="Skin analysis technology"
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMI/8QAHxAAAgICAQUAAAAAAAAAAAAAAQIAAxESITFBYXHR/8QAFQEBAQAAAAAAAAAAAAAAAAAABAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gACAwEAAhEDEEQA/wBLpa6KzWOpycBifE5b3ERC5bE7P//Z"
              className="object-cover opacity-60 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-transparent to-[#030303] opacity-80" />
          </motion.div>
          <motion.div style={{ opacity: t2 }} className="absolute z-10 text-left w-full max-w-4xl px-6 pointer-events-none drop-shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-7 h-7 text-indigo-400" />
              <span className="text-indigo-400 font-mono text-sm tracking-[0.2em] uppercase">Phase 02</span>
            </div>
            <h3 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase leading-[0.85] text-glow">DEEP<br />DIAGNOSIS.</h3>
            <p className="text-lg md:text-2xl text-white font-medium leading-relaxed max-w-xl">Deep learning models classify severity into 4 clinical grades with 92% validated accuracy.</p>
          </motion.div>
        </div>
      </section>

      {/* ─── PANEL 3: Personalize ─── */}
      <section className="relative h-[150vh] z-10">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-20 overflow-hidden">
          <motion.div
            style={{ y: img3Y }}
            className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/20 shadow-2xl will-change-transform z-0"
          >
            <Image
              src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=60&w=1200&auto=format"
              alt="Personalized skincare routine"
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAYH/8QAHxAAAgICAgMBAAAAAAAAAAAAAQIDEQAEBRIhMUFh/8QAFQEBAQAAAAAAAAAAAAAAAAAABAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADERL/2gACAwEAAhEDEEQA/wDB+N5GOHZaJpI2kUWyqfYH3hhjJRaxOz//2Q=="
              className="object-cover opacity-70 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-60" />
          </motion.div>
          <motion.div style={{ opacity: t3 }} className="absolute z-10 text-center max-w-2xl px-6 pointer-events-none drop-shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="w-7 h-7 text-indigo-400" />
              <span className="text-indigo-400 font-mono text-sm tracking-[0.2em] uppercase">Phase 03</span>
            </div>
            <h3 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic text-glow">TOTAL RECOVERY.</h3>
            <p className="text-lg md:text-2xl text-white font-medium leading-relaxed">Dynamic routines that evolve with your skin. <br className="hidden md:block" /> Precision care for unique biometrics.</p>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="relative py-32 px-6 flex flex-col items-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={reveal}
          className="max-w-7xl w-full"
        >
          <div className="text-center mb-24">
            <h4 className="text-indigo-500 font-mono text-sm mb-4 tracking-[0.4em] uppercase">Core Technology</h4>
            <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">Clinical Intelligence.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-10 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/12 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-indigo-500/20 transition-colors duration-700 scale-150">
                  {item.icon}
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-8 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                    {item.icon}
                  </div>
                  <h5 className="text-xl font-bold mb-4 tracking-tight uppercase">{item.title}</h5>
                  <p className="text-zinc-500 leading-relaxed text-sm group-hover:text-zinc-300 transition-colors duration-500">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative h-[100vh] flex flex-col items-center justify-center text-center px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={reveal}
          className="relative z-10"
        >
          <h4 className="text-[10vw] font-black mb-6 tracking-tighter uppercase italic leading-none">START NOW.</h4>
          <p className="text-lg md:text-xl text-zinc-500 mb-14 max-w-md mx-auto">Analyze your skin today. Reclaim your confidence tomorrow.</p>
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
            <Link
              href="/skin-quiz"
              className="px-12 py-6 bg-white text-black rounded-full font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(255,255,255,0.25)] flex items-center gap-3 group"
            >
              Take Skin Quiz
              <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform duration-500" />
            </Link>
            <Link
              href="/analyze"
              className="px-12 py-6 border-2 border-white/10 hover:border-white/25 text-white rounded-full font-black text-lg transition-all backdrop-blur-xl"
            >
              Scan Now
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="w-full text-center py-16 border-t border-white/5 bg-[#030303] relative z-20">
        <p className="text-[10px] font-black tracking-[1em] uppercase text-zinc-800">ACNE AI Laboratory — MMXXVI</p>
      </footer>
    </div>
  );
}
