import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Sparkles,
  ShieldCheck,
  Video,
  VideoOff,
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
        throw new Error("Camera API is not supported on this browser or connection.");
      }

      // Stop any existing stream
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
          ? "Camera permission denied. Please allow camera access or use the upload option below."
          : "Could not start camera preview. Please check camera permissions or upload a snapshot."
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

  // Initialize camera when component mounts or when capturedPhoto is cleared
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
      // Flip horizontally to match mirror preview
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      stopCamera();
      onCapture(dataUrl);
      toast.success("Selfie snapshot captured successfully!");
    }
  };

  // Fallback: File upload / Native Mobile Camera capture
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        stopCamera();
        onCapture(dataUrl);
        toast.success("Photo snapshot uploaded successfully!");
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="size-4 text-sky-400" />
          <span>Mandatory Security Snapshot Gate *</span>
        </label>

        {capturedPhoto ? (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[11px] gap-1 font-semibold">
            <CheckCircle2 className="size-3" /> Photo Verified
          </Badge>
        ) : cameraActive ? (
          <Badge variant="outline" className="text-[10px] text-sky-400 border-sky-500/40 gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Camera Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/40">
            Awaiting Capture
          </Badge>
        )}
      </div>

      {/* Camera Preview / Captured Image Frame */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 aspect-[4/3] max-h-[280px] w-full flex items-center justify-center shadow-inner group">
        {capturedPhoto ? (
          // Captured Snapshot Preview
          <div className="relative w-full h-full">
            <img
              src={capturedPhoto}
              alt="Student Snapshot"
              className="w-full h-full object-cover object-center"
            />
            {/* Watermark / Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-3">
              <div className="flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span className="font-semibold text-xs">Fresh Live Snapshot</span>
                </div>
                <span className="text-[10px] text-slate-300 font-mono">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ) : cameraActive ? (
          // Live Video Preview
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Face alignment reticle overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-36 h-44 rounded-full border-2 border-dashed border-sky-400/60 flex items-center justify-center">
                <span className="text-[10px] text-sky-300/80 font-medium bg-slate-950/60 px-2 py-0.5 rounded-full">
                  Align Face Here
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Standby / Error / Offline Frame
          <div className="p-6 text-center space-y-3 max-w-xs mx-auto">
            <div className="size-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              {isInitializing ? (
                <RefreshCw className="size-6 animate-spin text-sky-400" />
              ) : (
                <VideoOff className="size-6 text-slate-500" />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-300 font-medium">
                {isInitializing
                  ? "Starting camera preview…"
                  : cameraError || "Live webcam snapshot required to access results."}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                A fresh photo is captured directly for access audit. No prior stored photo needed.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={startCamera}
                className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white cursor-pointer font-semibold"
              >
                <Video className="size-3.5 mr-1.5" /> Start Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <Upload className="size-3.5 mr-1.5" /> Upload Selfie
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for Mobile / Fallback upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {capturedPhoto ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleRetake}
            className="w-full h-9 text-xs border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 cursor-pointer font-medium gap-1.5"
          >
            <RefreshCw className="size-3.5 text-sky-400" />
            <span>Retake Snapshot</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <Button
              type="button"
              onClick={handleCapture}
              disabled={!cameraActive}
              className={`flex-1 h-10 text-xs font-bold gap-2 cursor-pointer transition shadow-md ${
                cameraActive
                  ? "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-sky-600/20"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
              }`}
            >
              <Camera className="size-4" />
              <span>Capture Selfie / Photo</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Upload Photo or Mobile Camera"
              onClick={() => fileInputRef.current?.click()}
              className="size-10 shrink-0 border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white cursor-pointer"
            >
              <Upload className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 leading-tight">
        ℹ️ <strong>Security Notice:</strong> Result download and viewing remain locked until your live snapshot is captured. This ensures verifiable access audits.
      </p>
    </div>
  );
}
