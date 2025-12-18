import React, { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  FaceLandmarker,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

interface CameraFaceProps {
  size?: number;
  autoCaptureFrames?: number;
  onCapture?: (img: string) => void;
  onBack?: () => void;
}

const CameraFace: React.FC<CameraFaceProps> = ({
  size = 360,
  autoCaptureFrames = 12,
  onCapture,
  onBack,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<FaceLandmarker | null>(null);

  const runningRef = useRef(true);
  const capturingRef = useRef(false);

  const [msg, setMsg] = useState("Đưa khuôn mặt vào khung để bắt đầu");
  const stable = useRef(0);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const tsRef = useRef(0);
  const flashRef = useRef<HTMLDivElement | null>(null);

  // ---------------- FLASH ----------------
  const flash = () => {
    const f = flashRef.current;
    if (!f) return;
    f.style.opacity = "0.85";
    f.style.transition = "none";
    void f.offsetHeight;
    f.style.transition = "opacity .45s ease-out";
    f.style.opacity = "0";
  };

  // ---------------- CAMERA ----------------
  const getUsbCameraDeviceId = async () => {
    await navigator.mediaDevices.getUserMedia({ video: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");
    const usb = cams.find((d) =>
      /usb|hd|logitech|camera|webcam/i.test(d.label)
    );
    return usb?.deviceId || cams[0]?.deviceId;
  };

  const captureFrame = (): string | null => {
    const v = videoRef.current;
    if (!v) return null;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    return c.toDataURL("image/jpeg", 0.92);
  };
  const captureOuterEllipse = (): string | null => {
    const v = videoRef.current;
    const wrap = wrapRef.current;
    if (!v || !wrap) return null;

    const vw = v.videoWidth;
    const vh = v.videoHeight;

    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;

    // object-cover scale (GIỐNG VIDEO HIỂN THỊ)
    const scale = Math.max(cw / vw, ch / vh);
    const drawW = vw * scale;
    const drawH = vh * scale;

    const offsetX = (cw - drawW) / 2;
    const offsetY = (ch - drawH) / 2;

    // ellipse ngoài (đúng clipPath)
    const rx = cw * 0.48;
    const ry = ch * 0.5;

    // output canvas = đúng size ellipse
    const outW = Math.round(rx * 2);
    const outH = Math.round(ry * 2);

    const c = document.createElement("canvas");
    c.width = outW;
    c.height = outH;

    const ctx = c.getContext("2d")!;

    // (OPTIONAL) nền trắng
    // ctx.fillStyle = "#fff";
    // ctx.fillRect(0, 0, outW, outH);

    // mask ellipse ngoài
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(outW / 2, outH / 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();

    // vẽ video đúng như hiển thị
    ctx.drawImage(
      v,
      offsetX - (cw / 2 - rx),
      offsetY - (ch / 2 - ry),
      drawW,
      drawH
    );

    ctx.restore();

    // PNG nền trong suốt (chuẩn eKYC)
    return c.toDataURL("image/png");
  };

  const captureEllipseFace = (): string | null => {
    const v = videoRef.current;
    const wrap = wrapRef.current;
    if (!v || !wrap) return null;

    const vw = v.videoWidth;
    const vh = v.videoHeight;

    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;

    // object-cover scale
    const scale = Math.max(cw / vw, ch / vh);
    const offsetX = (cw - vw * scale) / 2;
    const offsetY = (ch - vh * scale) / 2;

    // ellipse giống UI
    const radius = Math.min(cw, ch) * 0.28;
    const rx = radius * 0.82;
    const ry = radius * 1.12;

    // canvas xuất
    const outW = Math.round(rx * 2);
    const outH = Math.round(ry * 2);

    const c = document.createElement("canvas");
    c.width = outW;
    c.height = outH;

    const ctx = c.getContext("2d")!;

    // MASK ellipse
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(outW / 2, outH / 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();

    // vẽ video đã scale
    ctx.drawImage(
      v,
      offsetX - (cw / 2 - rx),
      offsetY - (ch / 2 - ry),
      vw * scale,
      vh * scale
    );

    ctx.restore();

    // PNG nền trong suốt (chuẩn eKYC)
    return c.toDataURL("image/png");
  };

  // ---------------- ALIGNMENT ----------------
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
    const inside = dist < inner * 0.75;
    const sizeOK = bbox.w > inner * 0.45 && bbox.w < inner * 1.25;
    return inside && sizeOK;
  };

  // ---------------- DRAW UI ----------------
  const drawUI = (
    ctx: CanvasRenderingContext2D,
    result: FaceLandmarkerResult | null,
    cw: number,
    ch: number,
    radius: number,
    ts: number
  ) => {
    ctx.clearRect(0, 0, cw, ch);

    // BACKDROP
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, cw, ch);

    const cx = cw / 2;
    const cy = ch / 2;

    // INNER ELLIPSE (KHUNG NHẬN DIỆN)
    // const rx = radius * 0.72;
    // const ry = radius * 1.0;
    // INNER ELLIPSE (KHUNG NHẬN DIỆN) – MỚI
    const rx = radius * 0.98; // 👈 tăng từ 0.72 → 0.82
    const ry = radius * 1.7; // 👈 tăng chiều dọc

    // CUT OUT
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // GLOW RING
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,200,255,0.95)";
    ctx.shadowColor = "rgba(0,200,255,0.65)";
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // SCAN ARC
    const angle = (ts * 0.12) % 360;
    const rad = (angle * Math.PI) / 180;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 1.02, ry * 1.02, 0, rad - 0.25, rad + 0.25);
    ctx.strokeStyle = "rgba(0,255,200,0.5)";
    ctx.lineWidth = 6;
    ctx.stroke();

    // ---------------- FULL LANDMARK (CHẤM NHỎ) ----------------
    if (result?.faceLandmarks?.length) {
      const pts = result.faceLandmarks[0];
      const v = videoRef.current!;

      const vw = v.videoWidth;
      const vh = v.videoHeight;

      const scale = Math.max(cw / vw, ch / vh); // 👈 object-cover scale
      const offsetX = (cw - vw * scale) / 2;
      const offsetY = (ch - vh * scale) / 2;

      ctx.fillStyle = "rgba(0,255,160,0.75)";
      ctx.shadowColor = "rgba(0,255,160,0.35)";
      ctx.shadowBlur = 1.5;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!p) continue;

        const px = p.x * vw * scale + offsetX;
        const py = p.y * vh * scale + offsetY;

        ctx.beginPath();
        ctx.arc(px, py, 0.6, 0, Math.PI * 2); // chấm nhỏ
        ctx.fill();
      }

      ctx.shadowBlur = 0;
    }
  };

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
      let minX = 1,
        minY = 1,
        maxX = 0,
        maxY = 0;
      pts.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
      bbox = {
        cx: ((minX + maxX) / 2) * cw,
        cy: ((minY + maxY) / 2) * ch,
        w: (maxX - minX) * cw,
      };
    }

    const radius = Math.min(cw, ch) * 0.28;
    drawUI(ctx, result, cw, ch, radius, tsRef.current);

    const ok = isAligned(bbox, cw, ch);
    if (ok && !capturingRef.current) {
      stable.current++;
      setMsg(`Đang căn chỉnh... (${stable.current}/${autoCaptureFrames})`);
    } else {
      stable.current = 0;
      if (!capturingRef.current) setMsg("Đưa khuôn mặt vào khung để bắt đầu");
    }

    if (ok && stable.current >= autoCaptureFrames && !capturingRef.current) {
      capturingRef.current = true;
      flash();
      const img = captureOuterEllipse();
      setPreviewImg(img!);
      onCapture?.(img!);
      setMsg("Đã chụp");
    }

    requestAnimationFrame(loop);
  };

  // ---------------- INIT ----------------
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const v = videoRef.current!;
      const deviceId = await getUsbCameraDeviceId();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined },
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

      if (mounted) requestAnimationFrame(loop);
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------------- RENDER ----------------
  return (
    <div className="w-screen h-screen relative bg-[#05070a] overflow-hidden">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-50 text-cyan-300"
        >
          ← Quay lại
        </button>
      )}

      <div className="w-full h-full flex items-center justify-center">
        <div
          className="relative"
          style={{
            width: size,
            height: size * 1.25,
            filter: "drop-shadow(0 0 30px rgba(0,255,255,0.15))",
          }}
        >
          <div
            ref={wrapRef}
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: "ellipse(48% 50% at 50% 50%)",
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
      </div>

      <div
        ref={flashRef}
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ opacity: 0 }}
      />

      <div className="absolute bottom-12 w-full text-center text-white text-sm">
        {msg}
      </div>

      {previewImg && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4">
            <img src={previewImg} className="w-64 rounded-lg" />
            <div className="text-center mt-3">
              <button
                onClick={() => setPreviewImg(null)}
                className="px-4 py-1 bg-blue-600 text-white rounded-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFace;
