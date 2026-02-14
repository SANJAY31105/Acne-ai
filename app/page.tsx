import Link from "next/link";
import { ArrowRight, ScanFace } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center font-sans">
      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8 border border-indigo-500/20">
          <ScanFace className="w-4 h-4" />
          <span>AI-Powered Dermatology</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          Intelligent Acne <br /> Detection & Care
        </h1>

        <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Analyze your skin health instantly with advanced AI. Get personalized treatment recommendations tailored to your specific acne type.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/skin-quiz"
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 group"
          >
            Start Skin Quiz
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/analyze"
            className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-full font-bold text-lg transition-all border border-zinc-800"
          >
            Skip to Analysis
          </Link>
        </div>
        <p className="text-sm text-zinc-600 mt-4">Take the quiz first for personalized treatment recommendations.</p>
      </main>

      <footer className="w-full text-center py-8 text-zinc-600 text-sm">
        <p>© 2026 Acne AI Project. Powered by Deep Learning.</p>
      </footer>
    </div>
  );
}
