"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Upload, Camera, RefreshCw, LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ResultsView from "@/components/ResultsView";

const scanMessages = [
    "Detecting skin regions...",
    "Mapping acne zones...",
    "Classifying severity...",
    "Analyzing inflammation...",
    "Building your routine...",
];

function ScanStatusText() {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setIdx((i) => (i + 1) % scanMessages.length), 2000);
        return () => clearInterval(timer);
    }, []);
    return (
        <p className="text-sm font-semibold text-emerald-300 tracking-wider animate-pulse">
            {scanMessages[idx]}
        </p>
    );
}
export default function AnalyzePage() {
    const webcamRef = useRef<Webcam>(null);
    const [image, setImage] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const user = localStorage.getItem("acne_user");
        if (!user) {
            router.push("/login");
        }
    }, [router]);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImage(imageSrc);
            setIsCapturing(false);
        }
    }, [webcamRef]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async () => {
        if (!image) return;

        setAnalyzing(true);
        setError(null);

        try {
            // Convert the image to a guaranteed JPEG blob using canvas
            const img = new window.Image();
            const jpegBlob: Blob = await new Promise((resolve, reject) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(
                        (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
                        'image/jpeg',
                        0.92
                    );
                };
                img.onerror = reject;
                img.src = image;
            });

            const file = new File([jpegBlob], "image.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append("image", file);

            // Include skin type from quiz
            const skinData = localStorage.getItem("skin_type");
            const skinType = skinData ? JSON.parse(skinData).type : "Normal";
            formData.append("skin_type", skinType);

            const response = await fetch("/api/predict", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Analysis failed");
            }

            const data = await response.json();

            // Check if the backend rejected the image (e.g., no face detected)
            if (data.status === "error") {
                setError(data.message || "Analysis failed. Please try a different image.");
                return;
            }

            setResults(data);

            // Save to History (no image blob — saves quota)
            const newHistoryItem = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                severity: data.primary_diagnosis?.severity || "Unknown",
                confidence: data.primary_diagnosis?.confidence || 0,
            };

            try {
                const existingHistory = JSON.parse(localStorage.getItem("acne_scan_history") || "[]");
                // Keep only most recent 10 scans to avoid quota issues
                const updatedHistory = [newHistoryItem, ...existingHistory].slice(0, 10);
                localStorage.setItem("acne_scan_history", JSON.stringify(updatedHistory));
            } catch (storageErr) {
                // If still fails, clear and start fresh
                console.warn("localStorage quota exceeded, clearing history.", storageErr);
                localStorage.setItem("acne_scan_history", JSON.stringify([newHistoryItem]));
            }

        } catch (err) {
            setError("Failed to analyze image. Please try again.");
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    const reset = () => {
        setImage(null);
        setResults(null);
        setError(null);
        setIsCapturing(false);
    };

    return (
        <div className="min-h-screen bg-[#060a14] text-white p-6 md:p-12 font-sans antialiased selection:bg-indigo-500/30">
            <header className="mb-8 flex justify-between items-center max-w-5xl mx-auto">
                <Link href="/" className="text-xl md:text-2xl font-black tracking-[0.3em] uppercase text-white hover:text-indigo-400 transition-all duration-500">
                    ACNE AI
                </Link>
                <div className="flex items-center gap-4 md:gap-6">
                    <Link href="/skin-quiz" className="text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase text-zinc-400 hover:text-white transition-all relative overflow-hidden group/link">
                        Skin Quiz
                        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-indigo-500 translate-x-[-101%] group-hover/link:translate-x-0 transition-transform duration-500" />
                    </Link>
                    <Link href="/history" className="text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase text-zinc-400 hover:text-white transition-all relative overflow-hidden group/link">
                        History
                        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-indigo-500 translate-x-[-101%] group-hover/link:translate-x-0 transition-transform duration-500" />
                    </Link>
                    <button
                        onClick={() => {
                            localStorage.removeItem("acne_user");
                            router.push("/");
                        }}
                        className="p-2 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto">
                {results ? (
                    <ResultsView results={results} image={image!} onReset={reset} />
                ) : analyzing ? (
                    /* ─── Skeleton Results Layout ─── */
                    <div className="animate-in zoom-in-95 duration-500">
                        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                            {/* Left Column Skeleton (Image + Scan Overlay) */}
                            <div className="space-y-6">
                                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center justify-center backdrop-blur-sm">
                                    {image && (
                                        <Image src={image} alt="Analyzing" fill className="object-cover opacity-60" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                                    {/* Scan Line */}
                                    <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-[scanLine_2s_ease-in-out_infinite]" />
                                    {/* Corners */}
                                    <div className="absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-indigo-400/80 rounded-tl-md animate-pulse" />
                                    <div className="absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2 border-indigo-400/80 rounded-tr-md animate-pulse" />
                                    <div className="absolute bottom-6 left-6 w-10 h-10 border-b-2 border-l-2 border-indigo-400/80 rounded-bl-md animate-pulse" />
                                    <div className="absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-indigo-400/80 rounded-br-md animate-pulse" />
                                    
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                                        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
                                        <ScanStatusText />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 rounded-full skeleton-loader shrink-0" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-16 rounded-2xl skeleton-loader w-full" />
                                        <div className="h-16 rounded-2xl skeleton-loader w-full" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right Column Skeleton (Dashboard Items) */}
                            <div className="flex flex-col gap-6">
                                <div className="h-24 rounded-2xl skeleton-loader w-full" />
                                <div className="h-12 rounded-xl skeleton-loader w-full" />
                                <div className="space-y-4">
                                    <div className="h-6 skeleton-loader w-40 rounded-full" />
                                    <div className="flex gap-2">
                                        <div className="h-12 flex-1 skeleton-loader rounded-xl" />
                                        <div className="h-12 flex-1 skeleton-loader rounded-xl" />
                                    </div>
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-16 skeleton-loader rounded-xl w-full" />
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <div className="h-32 skeleton-loader rounded-2xl w-full" />
                                    <div className="h-32 skeleton-loader rounded-2xl w-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-8">
                        <h1 className="text-4xl md:text-5xl font-black text-center tracking-tight">
                            Analyze Your Skin
                        </h1>
                        <p className="text-zinc-500 text-center max-w-lg text-sm tracking-wide">
                            Take a photo or upload an image to get an AI-powered analysis of your skin condition and personalized treatment recommendations.
                        </p>

                        <div className="w-full max-w-md aspect-[3/4] bg-white/[0.02] rounded-3xl overflow-hidden border border-white/5 shadow-2xl shadow-black/40 relative flex flex-col items-center justify-center backdrop-blur-sm">
                            {image ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={image}
                                        alt="Captured"
                                        fill
                                        className="object-cover"
                                    />
                                    {!analyzing && (
                                        <button
                                            onClick={reset}
                                            className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 transition-colors z-20"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ) : isCapturing ? (
                                <div className="relative w-full h-full bg-black">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover"
                                        videoConstraints={{ facingMode: "user" }}
                                    />
                                    {/* Face guide overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-48 h-64 border-2 border-white/20 rounded-[50%] animate-pulse" />
                                    </div>
                                    <p className="absolute top-4 left-0 right-0 text-center text-xs text-white/50 font-medium tracking-wider">POSITION YOUR FACE IN THE OVAL</p>
                                    <button
                                        onClick={capture}
                                        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white bg-transparent hover:bg-white/20 transition-all active:scale-90"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 items-center">
                                    <button
                                        onClick={() => setIsCapturing(true)}
                                        className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-indigo-500/20"
                                    >
                                        <Camera className="w-6 h-6" />
                                        Open Camera
                                    </button>
                                    <span className="text-zinc-500 text-sm">or</span>
                                    <label className="flex items-center gap-3 px-8 py-4 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-full font-bold transition-all cursor-pointer border border-white/10 hover:border-white/20">
                                        <Upload className="w-6 h-6" />
                                        Upload Photo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        {image && !analyzing && (
                            <button
                                onClick={analyzeImage}
                                className="w-full max-w-md py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black rounded-full font-bold text-lg hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                            >
                                Analyze Skin
                            </button>
                        )}

                        {error && (
                            <p className="text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
                                {error}
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
