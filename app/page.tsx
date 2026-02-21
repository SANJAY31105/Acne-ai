"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ArrowRight, ChevronDown, Camera, Sparkles, Shield } from "lucide-react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef, useEffect } from "react";
import Lenis from "lenis";

const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 -z-10 bg-[#030303]" />,
});

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

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  // Hero
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.12], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -80]);

  // Panel parallax
  const img1Y = useTransform(scrollYProgress, [0.08, 0.35], [120, -120]);
  const img2Y = useTransform(scrollYProgress, [0.32, 0.58], [120, -120]);
  const img3Y = useTransform(scrollYProgress, [0.55, 0.82], [120, -120]);

  // Text reveals
  const t1 = useTransform(scrollYProgress, [0.15, 0.22, 0.35], [0, 1, 0]);
  const t2 = useTransform(scrollYProgress, [0.38, 0.45, 0.58], [0, 1, 0]);
  const t3 = useTransform(scrollYProgress, [0.62, 0.69, 0.82], [0, 1, 0]);

  const reveal: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 25 } },
  };

  return (
    <div ref={containerRef} className="bg-[#030303] text-white selection:bg-indigo-500/30 overflow-x-hidden antialiased">
      <HeroScene />

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 backdrop-blur-md bg-[#030303]/60 border-b border-white/5">
        <Link href="/" className="text-3xl font-black tracking-[0.3em] uppercase text-white hover:text-indigo-400 transition-colors">
          ACNE AI
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/skin-quiz" className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400 hover:text-white transition-colors">
            Skin Quiz
          </Link>
          <Link href="/analyze" className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400 hover:text-white transition-colors">
            Scan
          </Link>
          <Link href="/history" className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400 hover:text-white transition-colors">
            History
          </Link>
        </div>
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
            className="mb-8 text-2xl font-bold tracking-[0.5em] uppercase text-indigo-400"
          >
            AI-Powered Skin Intelligence
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-[14vw] font-black tracking-tighter leading-[0.75] uppercase italic select-none"
          >
            CLEAR <br /> SKIN.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.8, duration: 1.5 }}
            className="mt-10 text-lg md:text-xl text-zinc-500 max-w-xl mx-auto font-medium"
          >
            Snap a photo. Get an instant AI analysis of your acne severity with personalized care tips.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.4, duration: 1.5 }}
            className="mt-14 flex flex-col items-center gap-3"
          >
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Scroll</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── PANEL 1: Scan ─── */}
      <section className="relative h-[150vh]">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-20 overflow-hidden">
          <motion.div
            style={{ y: img1Y }}
            className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl will-change-transform"
          >
            {/* Skincare / face closeup — beauty-tech vibe */}
            <Image
              src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=60&w=1200&auto=format"
              alt="Skincare routine closeup"
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              priority
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIBAAAgICAgIDAAAAAAAAAAAAAQIDBAARBSEGMRJBUf/EABQBAQAAAAAAAAAAAAAAAAAAAAP/xAAYEQADAQEAAAAAAAAAAAAAAAAAAQIREv/aAAwDAQACEQMRAD8Ax7iuTv1bMkMlmWWBGKrI7kkD6yfv3nTGSjTP//Z"
              className="object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/40 to-transparent" />
          </motion.div>

          <motion.div style={{ opacity: t1 }} className="absolute z-10 text-center max-w-2xl px-6 pointer-events-none">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Camera className="w-8 h-8 text-indigo-400" />
              <span className="text-indigo-400 font-mono text-sm tracking-[0.2em] uppercase">Step 01</span>
            </div>
            <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic">
              SNAP &<br />SCAN.
            </h2>
            <p className="text-lg md:text-2xl text-zinc-400 font-medium leading-relaxed">
              Upload a selfie. Our deep learning model <br className="hidden md:block" />
              maps your skin in under 3 seconds.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── PANEL 2: Analyze ─── */}
      <section className="relative h-[150vh]">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-20 overflow-hidden">
          <motion.div
            style={{ y: img2Y }}
            className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl will-change-transform"
          >
            {/* AI / technology visual */}
            <Image
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=60&w=1200&auto=format"
              alt="Skin analysis technology"
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMI/8QAHxAAAgICAQUAAAAAAAAAAAAAAQIAAxESITFBYXHR/8QAFQEBAQAAAAAAAAAAAAAAAAAABAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEEQA/wBLpa6KzWOpycBifE5b3ERC5bE7P//Z"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-transparent to-[#030303] opacity-90" />
          </motion.div>

          <motion.div style={{ opacity: t2 }} className="absolute z-10 text-left w-full max-w-4xl px-6 pointer-events-none">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-7 h-7 text-indigo-400" />
              <span className="text-indigo-400 font-mono text-sm tracking-[0.2em] uppercase">Step 02</span>
            </div>
            <h3 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase leading-[0.85]">
              AI<br />DIAGNOSIS.
            </h3>
            <p className="text-lg md:text-2xl text-zinc-400 font-medium leading-relaxed max-w-xl">
              Mild, Moderate, or Severe — know your severity level instantly with confidence scores.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── PANEL 3: Personalize ─── */}
      <section className="relative h-[150vh]">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-20 overflow-hidden">
          <motion.div
            style={{ y: img3Y }}
            className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl will-change-transform"
          >
            {/* Skincare products / routine */}
            <Image
              src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=60&w=1200&auto=format"
              alt="Personalized skincare routine"
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAYH/8QAHxAAAgICAgMBAAAAAAAAAAAAAQIDEQAEBRIhMUFh/8QAFQEBAQAAAAAAAAAAAAAAAAAABAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADERL/2gAMAwEAAhEDEEQA/wDB+N5GOHZaJpI2kUWyqfYH3hhjJRaxOz//2Q=="
              className="object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/30 to-transparent" />
          </motion.div>

          <motion.div style={{ opacity: t3 }} className="absolute z-10 text-center max-w-2xl px-6 pointer-events-none">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="w-7 h-7 text-indigo-400" />
              <span className="text-indigo-400 font-mono text-sm tracking-[0.2em] uppercase">Step 03</span>
            </div>
            <h3 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic">
              YOUR<br />ROUTINE.
            </h3>
            <p className="text-lg md:text-2xl text-zinc-400 font-medium leading-relaxed">
              Get a personalized skincare plan and track <br className="hidden md:block" />
              your progress over time.
            </p>
          </motion.div>
        </div>
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
          <h4 className="text-[10vw] font-black mb-6 tracking-tighter uppercase italic leading-none">
            START YOUR <br /> JOURNEY
          </h4>
          <p className="text-lg md:text-xl text-zinc-500 mb-14 max-w-md mx-auto">
            Take a quick skin quiz or jump straight into an AI scan.
          </p>
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
        <p className="text-[10px] font-black tracking-[1em] uppercase text-zinc-800">
          ACNE AI — MMXXVI
        </p>
      </footer>
    </div>
  );
}
