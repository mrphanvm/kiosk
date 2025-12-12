import React, { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  FaceLandmarker,
  type FaceLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

interface CameraFaceProps {
  size?: number;
  autoCaptureFrames?: number;
  onCapture?: (img: string) => void;
}

const CameraFace: React.FC<CameraFaceProps> = ({
  size = 360,
  autoCaptureFrames = 12,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<FaceLandmarker | null>(null);

  // RUN LOOP FLAGS
  const runningRef = useRef(true);
  const capturedRef = useRef(false);

  // UI STATE
  const [msg, setMsg] = useState("Đưa khuôn mặt vào vòng tròn để bắt đầu");
  const stable = useRef(0);

  // timestamp fix for StrictMode
  const tsRef = useRef(0);

  // FLASH EFFECT
  const flashRef = useRef<HTMLDivElement | null>(null);

  const flash = () => {
    const f = flashRef.current;
    if (!f) return;
    f.style.opacity = "0.85";
    f.style.transition = "none";
    void f.offsetHeight;
    f.style.transition = "opacity 0.35s ease-out";
    f.style.opacity = "0";
  };

  // CAPTURE HIGH-RES FRAME
  const captureFrame = (): string | null => {
    const v = videoRef.current;
    if (!v) return null;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.92);
  };

  // -------- ALIGNMENT LOGIC (REAL FIX) -------- //
  const isAligned = (
    bbox: { cx: number; cy: number; w: number } | null,
    cw: number,
    ch: number
  ) => {
    if (!bbox) return false;
    const outer = Math.min(cw, ch) * 0.28;
    const inner = outer * 0.72;

    const dx = bbox.cx - cw / 2;
    const dy = bbox.cy - ch / 2;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const inside = dist < inner * 0.8;

    const sizeOk = bbox.w > inner * 0.45 && bbox.w < inner * 1.35;

    return inside && sizeOk;
  };

  // -------- DRAW UI -------- //
  const drawUI = (
    ctx: CanvasRenderingContext2D,
    result: FaceLandmarkerResult | null,
    cw: number,
    ch: number,
    radius: number,
    ts: number
  ) => {
    ctx.clearRect(0, 0, cw, ch);

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, cw, ch);

    const cx = cw / 2;
    const cy = ch / 2;

    // MAIN RING
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(0,200,255,0.9)";
    ctx.shadowColor = "rgba(0,200,255,0.7)";
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Radar sweep
    const angle = (ts * 0.15) % 360;
    const rad = (angle * Math.PI) / 180;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius * 1.05, rad - 0.25, rad + 0.25);
    ctx.closePath();
    const g = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
    g.addColorStop(0, "rgba(0,255,200,0.15)");
    g.addColorStop(1, "rgba(0,255,200,0)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    // LANDMARKS (clean + small)
    if (result?.faceLandmarks?.length) {
      const pts: NormalizedLandmark[] = result.faceLandmarks[0];
      const v = videoRef.current!;
      const vw = v.videoWidth;
      const vh = v.videoHeight;

      const scaleX = cw / vw;
      const scaleY = ch / vh;

      ctx.fillStyle = "rgba(0,255,120,0.9)";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(0,255,120,0.9)";

      for (const p of pts) {
        const px = p.x * vw * scaleX;
        const py = p.y * vh * scaleY;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  };

  // -------- MAIN LOOP -------- //
  const loop = () => {
    if (!runningRef.current) return;

    tsRef.current += 16;

    const v = videoRef.current;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;
    if (!v || !wrap || !canvas || !detector) {
      requestAnimationFrame(loop);
      return;
    }

    const DPR = window.devicePixelRatio || 1;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;

    canvas.width = cw * DPR;
    canvas.height = ch * DPR;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    let result: FaceLandmarkerResult | null = null;
    try {
      result = detector.detectForVideo(v, tsRef.current);
    } catch {}

    let bbox: { cx: number; cy: number; w: number } | null = null;

    if (result?.faceLandmarks?.length) {
      const pts = result.faceLandmarks[0];

      const vw = v.videoWidth;
      const vh = v.videoHeight;

      const scaleX = cw / vw;
      const scaleY = ch / vh;

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      for (const p of pts) {
        const px = p.x * vw * scaleX;
        const py = p.y * vh * scaleY;
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      }

      bbox = {
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        w: maxX - minX,
      };
    }

    const radius = Math.min(cw, ch) * 0.28;

    drawUI(ctx, result, cw, ch, radius, tsRef.current);

    // ALIGNMENT STATUS
    const ok = isAligned(bbox, cw, ch);

    if (ok && !capturedRef.current) {
      stable.current++;
      setMsg(`Đang căn chỉnh... (${stable.current}/${autoCaptureFrames})`);
    } else {
      stable.current = 0;
      if (!capturedRef.current)
        setMsg("Đưa khuôn mặt vào vòng tròn để bắt đầu");
    }

    // AUTO CAPTURE
    if (ok && stable.current >= autoCaptureFrames && !capturedRef.current) {
      capturedRef.current = true;
      flash();

      const img = captureFrame();
      onCapture?.(img!);

      // Stop camera + detector
      runningRef.current = false;
      (v.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
      detector.close?.();
      return;
    }

    requestAnimationFrame(loop);
  };

  // -------- MOUNT -------- //
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const v = videoRef.current!;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
      });

      v.srcObject = stream;
      await v.play();

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
      );

      detectorRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });

      if (!isMounted) return;
      requestAnimationFrame(loop);
    };

    init();

    return () => {
      isMounted = false;
      runningRef.current = false;
      (videoRef.current?.srcObject as MediaStream)
        ?.getTracks()
        .forEach((t) => t.stop());
      detectorRef.current?.close?.();
    };
  }, []);

  return (
    <div className="w-screen h-screen relative bg-[#05070a] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#051018] to-[#020305]" />

      <div className="w-full h-full flex items-center justify-center">
        <div
          ref={wrapRef}
          className="relative rounded-full overflow-hidden"
          style={{
            width: size,
            height: size,
          }}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />

          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
          />
        </div>
      </div>

      {/* FLASH EFFECT */}
      <div
        ref={flashRef}
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ opacity: 0 }}
      />

      <div className="absolute bottom-10 w-full text-center text-white/90 text-sm">
        {msg}
      </div>
    </div>
  );
};

export default CameraFace;
