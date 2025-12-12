// src/components/FaceCaptureRadial.tsx
import React, { useEffect, useRef, useState } from "react";
import { FilesetResolver, FaceDetector } from "@mediapipe/tasks-vision";
import type { FaceDetectorResult, BoundingBox } from "@mediapipe/tasks-vision";

interface FaceCaptureRadialProps {
  onCapture?: (dataUrl: string) => void;
  autoCaptureFrames?: number; // frames required to be stable
  sweepSpeedDegPerSec?: number; // radar speed
}

const FaceCaptureRadial: React.FC<FaceCaptureRadialProps> = ({
  onCapture,
  autoCaptureFrames = 12,
  sweepSpeedDegPerSec = 120,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<FaceDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef<boolean>(false);

  const [status, setStatus] = useState<string>("Khởi tạo...");
  const [captured, setCaptured] = useState<string | null>(null);
  const stableCounter = useRef<number>(0);
  const sweepAngle = useRef<number>(0); // degrees

  /* ---------- Helpers ---------- */

  const roundedRectPath = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  /* ---------- Draw overlay with radial sweep ---------- */
  const drawOverlay = (result: FaceDetectorResult | null): void => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // sync canvas size to video pixels
    const vw = video.videoWidth || video.clientWidth;
    const vh = video.videoHeight || video.clientHeight;
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }

    // clear and dim entire screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // define circle center & radius (center of screen)
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.25; // 25% of min dim

    // cut out circle (make inner area visible)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect(
      cx - radius - 2,
      cy - radius - 2,
      radius * 2 + 4,
      radius * 2 + 4
    );
    ctx.restore();

    // circle border (glow)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(59,130,246,1)"; // blue
    ctx.stroke();
    ctx.restore();

    // inner subtle guide circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.65, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.stroke();

    // draw radar sweep (sector with gradient)
    const sweepDeg = (sweepAngle.current % 360) * (Math.PI / 180);
    const sweepWidthRad = (30 * Math.PI) / 180; // sweep arc width (radians) ~ 30deg
    const sweepStart = sweepDeg - sweepWidthRad / 2;
    const sweepEnd = sweepDeg + sweepWidthRad / 2;

    // gradient for sweep
    const g = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
    g.addColorStop(0, "rgba(34,197,94,0.22)");
    g.addColorStop(1, "rgba(34,197,94,0.02)");

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius * 1.05, sweepStart, sweepEnd);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    // small rotating ticks / tech lines around circle (non-blocking)
    ctx.save();
    const ticks = 36;
    for (let i = 0; i < ticks; i++) {
      const ang = (i / ticks) * Math.PI * 2;
      const innerR = radius + 12;
      const outerR = radius + 22;
      const x1 = cx + Math.cos(ang) * innerR;
      const y1 = cy + Math.sin(ang) * innerR;
      const x2 = cx + Math.cos(ang) * outerR;
      const y2 = cy + Math.sin(ang) * outerR;
      ctx.strokeStyle =
        i % 4 === 0 ? "rgba(59,130,246,0.95)" : "rgba(255,255,255,0.06)";
      ctx.lineWidth = i % 4 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();

    // guideline text below
    ctx.font = "18px system-ui, -apple-system, 'Segoe UI', Roboto, Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Đưa khuôn mặt vào vòng tròn", cx, cy + radius + 48);

    // draw detection box if available (for debug/visual)
    if (result?.detections?.length) {
      const box = result.detections[0].boundingBox;
      if (box) {
        // stroke face bbox in green
        ctx.strokeStyle = "rgba(34,197,94,0.95)";
        ctx.lineWidth = 2;
        ctx.strokeRect(box.originX, box.originY, box.width, box.height);

        // optionally mark center of face
        const faceCx = box.originX + box.width / 2;
        const faceCy = box.originY + box.height / 2;
        ctx.beginPath();
        ctx.fillStyle = "rgba(34,197,94,0.95)";
        ctx.arc(faceCx, faceCy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  /* ---------- check if face center is inside circle ---------- */
  const isFaceInsideCircle = (
    box: BoundingBox | null | undefined,
    canvas: HTMLCanvasElement | null
  ): boolean => {
    if (!box || !canvas) return false;
    const faceCx = box.originX + box.width / 2;
    const faceCy = box.originY + box.height / 2;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.25;
    const dx = faceCx - cx;
    const dy = faceCy - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // also enforce face size roughly fits (not too small)
    const fitsSize = box.width > radius * 0.36 && box.width < radius * 1.4;
    return dist < radius * 0.82 && fitsSize; // margin so face comfortably inside
  };

  /* ---------- capture frame ---------- */
  const captureFrame = (): void => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth || v.clientWidth;
    c.height = v.videoHeight || v.clientHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.92);
    setCaptured(dataUrl);
    setStatus("Đã chụp");
    onCapture?.(dataUrl);
  };

  /* ---------- frame loop ---------- */
  const processFrame = (): void => {
    if (!runningRef.current || !videoRef.current || !detectorRef.current) {
      // keep scheduling to allow detector to appear
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      const res = detectorRef.current.detectForVideo(
        videoRef.current,
        performance.now()
      );
      // update sweep angle based on time
      const now = performance.now();
      // increment sweep using delta stored on ref (approx)
      // simple approach: angle increment per RAF assuming ~60fps:
      const degPerMs = sweepSpeedDegPerSec / 1000;
      sweepAngle.current += degPerMs * 16.6; // ~16.6ms per frame avg, smoothing
      // draw overlay with current detection
      drawOverlay(res);

      // check capture condition
      const box = res?.detections?.[0]?.boundingBox;
      if (box) {
        if (isFaceInsideCircle(box, canvasRef.current)) {
          stableCounter.current += 1;
          setStatus(
            `Đang căn chỉnh... (${stableCounter.current}/${autoCaptureFrames})`
          );
          if (stableCounter.current >= autoCaptureFrames && !captured) {
            captureFrame();
            stableCounter.current = 0;
          }
        } else {
          stableCounter.current = 0;
          setStatus("Vui lòng đặt mặt vào vòng tròn");
        }
      } else {
        stableCounter.current = 0;
        setStatus("Không phát hiện khuôn mặt");
      }
    } catch (err) {
      console.error("detect/process error", err);
    } finally {
      rafRef.current = requestAnimationFrame(processFrame);
    }
  };

  /* ---------- init detector ---------- */
  const initDetector = async (): Promise<void> => {
    if (detectorRef.current) return;
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    detectorRef.current = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
      },
      runningMode: "VIDEO",
    });
  };

  /* ---------- start camera ---------- */
  const startCamera = async (): Promise<void> => {
    try {
      if (videoRef.current?.srcObject) return; // already started (helps StrictMode)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus("Tải model nhận diện...");
      await initDetector();
      setStatus("Sẵn sàng - nhận diện...");
      runningRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error("startCamera error", err);
      setStatus("Không thể truy cập camera");
    }
  };

  /* ---------- stop/cleanup ---------- */
  const stopAll = (): void => {
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try {
      const s = videoRef.current?.srcObject;
      if (s instanceof MediaStream) s.getTracks().forEach((t) => t.stop());
    } catch (e) {
      console.error("stop stream", e);
    }
    try {
      detectorRef.current?.close?.();
    } catch (e) {
      console.error("close detector", e);
    } finally {
      detectorRef.current = null;
    }
  };

  /* ---------- lifecycle ---------- */
  useEffect(() => {
    startCamera();
    return () => {
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- UI ---------- */
  return (
    <div className="w-full h-full relative bg-black overflow-hidden select-none">
      {/* video uses contain so canvas and video coords match visually */}
      <video
        ref={videoRef}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        playsInline
        muted
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />

      <div className="absolute left-4 bottom-4 bg-black/50 text-white px-3 py-2 rounded-md text-sm">
        {status}
      </div>

      {/* preview */}
      {captured && (
        <div className="absolute top-4 right-4 w-44 bg-white rounded-lg p-2 shadow-lg flex flex-col items-center gap-2">
          <img src={captured} alt="capture" className="w-full rounded" />
          <div className="w-full flex gap-2">
            <a
              href={captured}
              download="capture.jpg"
              className="flex-1 text-center bg-blue-600 text-white rounded px-2 py-1 text-xs"
            >
              Tải về
            </a>
            <button
              onClick={() => {
                setCaptured(null);
                setStatus("Tiếp tục nhận diện");
              }}
              className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs"
            >
              Xóa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceCaptureRadial;
