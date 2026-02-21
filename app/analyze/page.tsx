"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Upload, Camera, Loader2, RefreshCw, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ResultsView from "@/components/ResultsView";

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

            // Save to History
            const newHistoryItem = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                image: image,
                diagnosis: data.primary_diagnosis,
                severity: data.primary_diagnosis?.severity || "Unknown",
                confidence: data.primary_diagnosis?.confidence || 0,
            };

            const existingHistory = JSON.parse(localStorage.getItem("acne_scan_history") || "[]");
            const updatedHistory = [...existingHistory, newHistoryItem];
            localStorage.setItem("acne_scan_history", JSON.stringify(updatedHistory));

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
        <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12 font-sans antialiased selection:bg-indigo-500/30">
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
                                    <button
                                        onClick={reset}
                                        className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 transition-colors"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
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
                                    <button
                                        onClick={capture}
                                        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white bg-transparent hover:bg-white/20 transition-all"
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

                        {image && (
                            <button
                                onClick={analyzeImage}
                                disabled={analyzing}
                                className="w-full max-w-md py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    "Analyze Skin"
                                )}
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
