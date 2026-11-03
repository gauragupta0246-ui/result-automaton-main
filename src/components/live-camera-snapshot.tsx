import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ShieldCheck,
  Video,
  VideoOff,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface LiveCameraSnapshotProps {
  onCapture: (photoDataUrl: string) => void;
  onClear?: () => void;
  capturedPhoto: string | null;
}

export function LiveCameraSnapshot({
  onCapture,
  onClear,
  capturedPhoto,
}: LiveCameraSnapshotProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    if (capturedPhoto) return;
    setIsInitializing(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam access not supported on this device/browser.");
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraActive(true);
      setCameraError(null);
    } catch (err: any) {
      console.warn("Webcam access error:", err);
      setCameraActive(false);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission denied. Please allow camera in browser address bar or use upload fallback."
          : "Webcam initialization failed. Please allow webcam or upload a clear photo snapshot."
      );
    } finally {
      setIsInitializing(false);
    }
  }, [capturedPhoto]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!capturedPhoto) {
      void startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [capturedPhoto, startCamera, stopCamera]);

  // Capture Snapshot from Video Stream
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Mirror flip
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      stopCamera();
      onCapture(dataUrl);
      toast.success("Security identity snapshot captured successfully!");
    }
  };

  // Fallback upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        stopCamera();
        onCapture(dataUrl);
        toast.success("Snapshot photo uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRetake = () => {
    if (onClear) onClear();
    void startCamera();
  };

  return (
    <div className="space-y-2.5 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#0b2545] uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="size-4 text-[#0b2545]" />
          <span>Security Snapshot Gate (Mandatory) *</span>
        </label>

        {capturedPhoto ? (
          <Badge className="bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] text-[11px] font-bold rounded-[2px] gap-1 shadow-xs">
            <CheckCircle2 className="size-3 text-[#15803d]" /> Live Photo Verified
          </Badge>
        ) : cameraActive ? (
          <Badge variant="outline" className="text-[10px] text-[#0b2545] border-[#0b2545] bg-[#e8eef6] gap-1 font-bold rounded-[2px]">
            <span className="size-1.5 rounded-full bg-[#15803d] animate-pulse" />
            Live Camera Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] text-[#991b1b] border-[#fecaca] bg-[#fef2f2] font-bold rounded-[2px] gap-1">
            <Lock className="size-2.5" /> Awaiting Snapshot
          </Badge>
        )}
      </div>

      {/* Solid Bordered Frame with Live Preview */}
      <div className="relative rounded-[2px] overflow-hidden border-2 border-[#003366] bg-[#f8fafc] aspect-[4/3] max-h-[260px] w-full flex items-center justify-center shadow-xs">
        {capturedPhoto ? (
          // Captured Snapshot Preview
          <div className="relative w-full h-full bg-slate-900">
            <img
              src={capturedPhoto}
              alt="Student Captured Selfie"
              className="w-full h-full object-cover object-center"
            />
            {/* Formal University Stamp Banner */}
            <div className="absolute inset-x-0 bottom-0 bg-[#003366]/95 text-white p-2 border-t border-[#b91c1c] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-amber-300" />
                <span className="font-bold text-[11px]">Audit Verified Face Snapshot</span>
              </div>
              <span className="text-[10px] font-mono text-slate-200">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        ) : cameraActive ? (
          // Live Video Preview
          <div className="relative w-full h-full bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Formal Reticle Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-36 h-44 rounded-[2px] border-2 border-dashed border-amber-400 flex items-center justify-center shadow-sm">
                <span className="text-[9px] uppercase tracking-wider font-bold text-white bg-[#003366] px-2 py-0.5 rounded-[2px] border border-amber-400">
                  Align Face Inside Frame
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Offline / Error Frame
          <div className="p-4 text-center space-y-2.5 max-w-xs mx-auto">
            <div className="size-11 rounded-[2px] bg-[#e6eef5] border border-[#d1d5db] text-[#003366] flex items-center justify-center mx-auto">
              {isInitializing ? (
                <RefreshCw className="size-5 animate-spin text-[#003366]" />
              ) : (
                <VideoOff className="size-5 text-slate-500" />
              )}
            </div>
            <div>
              <p className="text-xs text-[#111827] font-bold">
                {isInitializing
                  ? "Starting Live Camera Preview…"
                  : cameraError || "Live webcam snapshot required to access result."}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                A fresh webcam snapshot must be captured to satisfy statutory university examination auditing rules.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={startCamera}
                className="h-8 text-xs bg-[#003366] hover:bg-[#002244] text-white cursor-pointer font-bold rounded-[2px]"
              >
                <Video className="size-3.5 mr-1.5" /> Start Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs border-[#d1d5db] bg-white text-slate-700 hover:text-[#003366] cursor-pointer rounded-[2px] font-semibold"
              >
                <Upload className="size-3.5 mr-1.5" /> Upload Photo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Controls */}
      <div className="flex items-center gap-2">
        {capturedPhoto ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleRetake}
            className="w-full h-9 text-xs border-[#cbd5e1] bg-white hover:bg-slate-50 text-[#0b2545] cursor-pointer font-bold rounded-[4px] gap-1.5 shadow-xs"
          >
            <RefreshCw className="size-3.5 text-[#0b2545]" />
            <span>Retake Live Snapshot</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <Button
              type="button"
              onClick={handleCapture}
              disabled={!cameraActive}
              className={`flex-1 h-10 text-xs font-bold rounded-[4px] gap-2 cursor-pointer transition shadow-xs ${
                cameraActive
                  ? "bg-[#0b2545] hover:bg-[#133966] text-white"
                  : "bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed"
              }`}
            >
              <Camera className="size-4" />
              <span>Capture Live Face Snapshot</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Upload Photo or Mobile Camera"
              onClick={() => fileInputRef.current?.click()}
              className="size-10 shrink-0 border-[#cbd5e1] bg-white text-[#334155] hover:text-[#0b2545] cursor-pointer rounded-[4px]"
            >
              <Upload className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <p className="text-[10px] text-[#475569] leading-tight">
        ℹ️ <strong>Security Gate Rule:</strong> The "Verify &amp; View Result" button remains locked until a live snapshot is captured.
      </p>
    </div>
  );
}
