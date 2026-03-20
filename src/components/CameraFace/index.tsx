import React, { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  FaceLandmarker,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

interface CameraFaceProps {
  size?: number;
  autoCaptureFrames?: number;
  onCapture?: (imgs: string[]) => void;
  onBack?: () => void;
}

type PoseKey = "front" | "left" | "right" | "up" | "down";

const CameraFace: React.FC<CameraFaceProps> = ({
  size = 360,
  autoCaptureFrames = 12,
  onCapture,
  onBack,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  // Canvas 1: dark backdrop + neon ring (inside clipPath oval)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Canvas 2: landmarks (same size as oval, NO clipPath)
  const landmarkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Canvas 3: full-screen tech background
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const detectorRef = useRef<FaceLandmarker | null>(null);
  const runningRef = useRef(true);
  const capturingRef = useRef(false);
  const tsRef = useRef(0);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const stable = useRef(0);
  const activePoseRef = useRef<PoseKey | null>(null);
  const capturedByPoseRef = useRef<Partial<Record<PoseKey, string>>>({});

  const [msg, setMsg] = useState("Di chuyển khuôn mặt tự do để hệ thống chụp đủ 5 góc");
  const [activePoseLabel, setActivePoseLabel] = useState("Nhìn chính diện");
  const [capturedPoseCount, setCapturedPoseCount] = useState(0);

  const poseTargets = {
    front: { label: "Nhìn chính diện", check: (yaw: number, pitch: number) => Math.abs(yaw) < 0.14 && Math.abs(pitch) < 0.14 },
    left: { label: "Quay mặt sang trái", check: (yaw: number) => yaw > 0.14 },
    right: { label: "Quay mặt sang phải", check: (yaw: number) => yaw < -0.14 },
    up: { label: "Ngẩng mặt lên", check: (_yaw: number, pitch: number) => pitch < -0.1 },
    down: { label: "Cúi mặt xuống", check: (_yaw: number, pitch: number) => pitch > 0.12 },
  } as const;

  const outputPoseOrder: PoseKey[] = ["front", "left", "right", "up", "down"];

  const getMissingPoseLabels = () =>
    outputPoseOrder
      .filter((k) => !capturedByPoseRef.current[k])
      .map((k) => poseTargets[k].label);

  const getMatchedPoseKey = (yaw: number, pitch: number): PoseKey | null => {
    // ưu tiên các góc quay/ngửa/cúi trước, chính diện sau cùng
    const priority: PoseKey[] = ["left", "right", "up", "down", "front"];
    for (const key of priority) {
      if (poseTargets[key].check(yaw, pitch)) return key;
    }
    return null;
  };

  const getPose = (pts: FaceLandmarkerResult["faceLandmarks"][number]) => {
    const leftEye = pts[33];
    const rightEye = pts[263];
    const nose = pts[1];
    const forehead = pts[10];
    const chin = pts[152];
    if (!leftEye || !rightEye || !nose || !forehead || !chin) {
      return { yaw: 0, pitch: 0, valid: false };
    }
    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const eyeMidY = (leftEye.y + rightEye.y) / 2;
    const eyeDist = Math.max(Math.abs(rightEye.x - leftEye.x), 0.001);
    const faceH = Math.max(Math.abs(chin.y - forehead.y), 0.001);

    // yaw > 0: quay trái (theo góc nhìn người dùng), yaw < 0: quay phải
    const yaw = (nose.x - eyeMidX) / eyeDist;
    // pitch > 0: cúi xuống, pitch < 0: ngẩng lên
    const pitch = (nose.y - eyeMidY) / faceH;
    return { yaw, pitch, valid: true };
  };

  // ─────────────────────────────────────────────────
  // FLASH
  // ─────────────────────────────────────────────────
  const flash = () => {
    const f = flashRef.current;
    if (!f) return;
    f.style.opacity = "0.85";
    f.style.transition = "none";
    f.offsetHeight; // eslint-disable-line @typescript-eslint/no-unused-expressions
    f.style.transition = "opacity .45s ease-out";
    f.style.opacity = "0";
  };

  // ─────────────────────────────────────────────────
  // CAMERA
  // ─────────────────────────────────────────────────
  const getUsbCameraDeviceId = async () => {
    const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    tmp.getTracks().forEach((t) => t.stop());
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");
    const usb = cams.find((d) => /usb|hd|logitech|camera|webcam/i.test(d.label));
    return usb?.deviceId || cams[0]?.deviceId;
  };

  const captureOuterEllipse = (): string | null => {
    const v = videoRef.current;
    const wrap = wrapRef.current;
    if (!v || !wrap) return null;
    const vw = v.videoWidth, vh = v.videoHeight;
    const cw = wrap.clientWidth, ch = wrap.clientHeight;
    const scale = Math.max(cw / vw, ch / vh);
    const drawW = vw * scale, drawH = vh * scale;
    const offsetX = (cw - drawW) / 2, offsetY = (ch - drawH) / 2;
    const rx = cw * 0.48, ry = ch * 0.5;
    const c = document.createElement("canvas");
    c.width = Math.round(rx * 2);
    c.height = Math.round(ry * 2);
    const ctx = c.getContext("2d")!;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(c.width / 2, c.height / 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(v, offsetX - (cw / 2 - rx), offsetY - (ch / 2 - ry), drawW, drawH);
    ctx.restore();
    return c.toDataURL("image/png");
  };

  // ─────────────────────────────────────────────────
  // ALIGNMENT
  // ─────────────────────────────────────────────────
  const getAlignmentState = (bbox: { cx: number; cy: number; w: number } | null, cw: number, ch: number) => {
    if (!bbox) {
      return { ok: false, hint: "Không phát hiện khuôn mặt, hãy đưa mặt vào khung" };
    }

    const outer = Math.min(cw, ch) * 0.28;
    const inner = outer * 0.72;
    const dist = Math.hypot(bbox.cx - cw / 2, bbox.cy - ch / 2);
    const sizeRatio = bbox.w / inner;

    if (dist >= inner * 1.15) {
      return { ok: false, hint: "Căn mặt vào chính giữa khung" };
    }

    if (sizeRatio < 0.42) {
      return { ok: false, hint: "Bạn đang xa quá, lại gần camera một chút" };
    }

    if (sizeRatio > 1.85) {
      return { ok: false, hint: "Bạn đang gần quá, lùi ra xa một chút" };
    }

    // Ngưỡng chụp vẫn đủ rộng để tránh khó nhận diện.
    return { ok: sizeRatio > 0.28 && sizeRatio < 2.2, hint: "" };
  };

  // ─────────────────────────────────────────────────
  // DRAW: Full-screen tech background
  // ─────────────────────────────────────────────────
  const drawBackground = (ctx: CanvasRenderingContext2D, sw: number, sh: number, ts: number) => {
    ctx.clearRect(0, 0, sw, sh);
    const cx = sw / 2, cy = sh / 2;

    // Animated grid
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = "#00ffc8";
    ctx.lineWidth = 1;
    const gs = 48;
    const ox = (ts * 0.05) % gs;
    const oy = (ts * 0.03) % gs;
    for (let x = -gs + ox; x < sw; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, sh); ctx.stroke();
    }
    for (let y = -gs + oy; y < sh; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(sw, y); ctx.stroke();
    }
    ctx.restore();

    // Expanding radar rings from center
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = "#00c8ff";
    for (let i = 0; i < 4; i++) {
      const r = ((ts * 0.18 + i * 90) % 340);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Corner HUD brackets
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = "#00ffc8";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#00ffc8";
    ctx.shadowBlur = 8;
    const bl = 36;
    const corners: [number, number, number, number, number, number][] = [
      [bl, 0,  0, 0,  0, bl],
      [sw - bl, 0,  sw, 0,  sw, bl],
      [0, sh - bl,  0, sh,  bl, sh],
      [sw - bl, sh,  sw, sh,  sw, sh - bl],
    ];
    corners.forEach(([x1, y1, x2, y2, x3, y3]) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
    });
    ctx.shadowBlur = 0;
    ctx.restore();

    // Floating particles
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#00ffc8";
    for (let i = 0; i < 22; i++) {
      const px = (Math.sin(ts * 0.001 + i * 0.52) * 0.42 + 0.5) * sw;
      const py = (Math.cos(ts * 0.0008 + i * 0.61) * 0.42 + 0.5) * sh;
      const r = 1.2 + Math.sin(ts * 0.002 + i) * 0.8;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Horizontal scan line
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = "#00c8ff";
    ctx.lineWidth = 2;
    const scanY = (ts * 0.08) % sh;
    ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(sw, scanY); ctx.stroke();
    ctx.restore();
  };

  // ─────────────────────────────────────────────────
  // DRAW: Neon ring + backdrop (inside clip canvas)
  // ─────────────────────────────────────────────────
  const drawRing = (ctx: CanvasRenderingContext2D, cw: number, ch: number, radius: number, ts: number) => {
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fillRect(0, 0, cw, ch);

    const cx = cw / 2, cy = ch / 2;
    const rx = radius * 1.68;
    const ry = radius * 2.22;

    // Cut out oval (show video below)
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Neon glow ring
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,200,255,0.95)";
    ctx.shadowColor = "rgba(0,200,255,0.85)";
    ctx.shadowBlur = 24;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Animated scan arc
    const ang = ((ts * 0.12) % 360) * Math.PI / 180;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 1.02, ry * 1.02, 0, ang - 0.28, ang + 0.28);
    ctx.strokeStyle = "rgba(0,255,180,0.8)";
    ctx.lineWidth = 7;
    ctx.stroke();

    // Outer halo ring để tạo cảm giác "nguy hiểm" rõ hơn.
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 1.24, ry * 1.24, 0, 0, Math.PI * 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(0,180,255,0.45)";
    ctx.shadowColor = "rgba(0,180,255,0.75)";
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 2 arc quay đối xứng để vòng xoay nhìn nổi và rõ hơn.
    const spin = ((ts * 0.22) % 360) * Math.PI / 180;
    ctx.strokeStyle = "rgba(0,255,220,0.92)";
    ctx.lineWidth = 5;
    ctx.shadowColor = "rgba(0,255,220,0.9)";
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 1.26, ry * 1.26, 0, spin - 0.22, spin + 0.22);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 1.26, ry * 1.26, 0, spin + Math.PI - 0.22, spin + Math.PI + 0.22);
    ctx.stroke();

    ctx.shadowBlur = 0;
  };

  // ─────────────────────────────────────────────────
  // DRAW: Landmarks (no clip canvas)
  // ─────────────────────────────────────────────────
  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    result: FaceLandmarkerResult | null,
    cw: number,
    ch: number
  ) => {
    ctx.clearRect(0, 0, cw, ch);
    if (!result?.faceLandmarks?.length) return;

    const pts = result.faceLandmarks[0];
    const v = videoRef.current!;
    const vw = v.videoWidth, vh = v.videoHeight;
    const scale = Math.max(cw / vw, ch / vh);
    const offX = (cw - vw * scale) / 2;
    const offY = (ch - vh * scale) / 2;

    ctx.fillStyle = "rgba(0,255,160,0.55)";
    ctx.shadowColor = "rgba(0,255,160,0.3)";
    ctx.shadowBlur = 1.5;

    for (const p of pts) {
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x * vw * scale + offX, p.y * vh * scale + offY, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  };

  // ─────────────────────────────────────────────────
  // ANIMATION LOOP
  // ─────────────────────────────────────────────────
  const loop = () => {
    if (!runningRef.current) return;
    tsRef.current += 16;
    const ts = tsRef.current;

    const v = videoRef.current;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const landmarkCanvas = landmarkCanvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    const detector = detectorRef.current;

    if (!v || !wrap || !canvas || !detector) {
      requestAnimationFrame(loop);
      return;
    }

    const DPR = window.devicePixelRatio || 1;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;

    // Ring canvas (inside clip)
    canvas.width = cw * DPR;
    canvas.height = ch * DPR;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawRing(ctx, cw, ch, Math.min(cw, ch) * 0.28, ts);

    // Detect
    let result: FaceLandmarkerResult | null = null;
    try { result = detector.detectForVideo(v, performance.now()); } catch {}

    // Landmark canvas (same size, no clip)
    if (landmarkCanvas) {
      landmarkCanvas.width = cw * DPR;
      landmarkCanvas.height = ch * DPR;
      landmarkCanvas.style.width = `${cw}px`;
      landmarkCanvas.style.height = `${ch}px`;
      const lCtx = landmarkCanvas.getContext("2d")!;
      lCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
      drawLandmarks(lCtx, result, cw, ch);
    }

    // Background canvas (full screen) – dùng window.innerWidth/Height để tránh clientWidth = 0
    if (bgCanvas) {
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      bgCanvas.width = sw * DPR;
      bgCanvas.height = sh * DPR;
      bgCanvas.style.width = `${sw}px`;
      bgCanvas.style.height = `${sh}px`;
      const bCtx = bgCanvas.getContext("2d")!;
      bCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
      drawBackground(bCtx, sw, sh, ts);
    }

    // Alignment detection
    let bbox: { cx: number; cy: number; w: number } | null = null;
    if (result?.faceLandmarks?.length) {
      const pts = result.faceLandmarks[0];
      let mnX = 1, mnY = 1, mxX = 0, mxY = 0;
      for (const p of pts) {
        if (p.x < mnX) mnX = p.x;
        if (p.y < mnY) mnY = p.y;
        if (p.x > mxX) mxX = p.x;
        if (p.y > mxY) mxY = p.y;
      }
      bbox = { cx: ((mnX + mxX) / 2) * cw, cy: ((mnY + mxY) / 2) * ch, w: (mxX - mnX) * cw };
    }

    const alignment = getAlignmentState(bbox, cw, ch);
    const ok = alignment.ok;

    let matchedPoseKey: PoseKey | null = null;
    if (result?.faceLandmarks?.length) {
      const pose = getPose(result.faceLandmarks[0]);
      if (pose.valid) {
        matchedPoseKey = getMatchedPoseKey(pose.yaw, pose.pitch);
      }
    }

    const poseNotCaptured = matchedPoseKey ? !capturedByPoseRef.current[matchedPoseKey] : false;
    const poseOk = !!matchedPoseKey && poseNotCaptured;

    if (ok && poseOk && !capturingRef.current) {
      if (activePoseRef.current !== matchedPoseKey) {
        stable.current = 0;
        activePoseRef.current = matchedPoseKey;
      }
      stable.current++;
      setActivePoseLabel(poseTargets[matchedPoseKey!].label);
      setMsg(`${poseTargets[matchedPoseKey!].label} (${stable.current}/${autoCaptureFrames})`);
    } else if (!capturingRef.current) {
      activePoseRef.current = null;
      stable.current = 0;
      if (!ok) {
        setMsg(alignment.hint || "Giữ mặt vào khung để hệ thống nhận góc");
      } else if (matchedPoseKey && !poseNotCaptured) {
        setMsg(`Đã chụp góc: ${poseTargets[matchedPoseKey].label}. Hãy xoay sang góc khác.`);
      } else {
        const missing = getMissingPoseLabels();
        setMsg(`Hãy quay sang góc bất kỳ. Còn thiếu: ${missing.join(" | ")}`);
      }
    }

    if (ok && poseOk && matchedPoseKey && stable.current >= autoCaptureFrames && !capturingRef.current) {
      capturingRef.current = true;
      flash();
      const img = captureOuterEllipse();
      if (img) {
        capturedByPoseRef.current[matchedPoseKey] = img;
        const imageList = outputPoseOrder
          .map((k) => capturedByPoseRef.current[k])
          .filter((v): v is string => Boolean(v));
        setCapturedPoseCount(imageList.length);

        if (imageList.length >= outputPoseOrder.length) {
          const orderedOutput = outputPoseOrder
            .map((k) => capturedByPoseRef.current[k])
            .filter((v): v is string => Boolean(v));
          setMsg("Đã chụp đủ 5 góc khuôn mặt");
          onCapture?.(orderedOutput);
        } else {
          const missing = getMissingPoseLabels();
          stable.current = 0;
          setMsg(`Đã chụp: ${poseTargets[matchedPoseKey].label}. Còn thiếu: ${missing.join(" | ")}`);
          setTimeout(() => {
            capturingRef.current = false;
          }, 200);
        }
      } else {
        capturingRef.current = false;
      }
    }

    requestAnimationFrame(loop);
  };

  // ─────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;
    const video = videoRef.current;

    const init = async () => {
      try {
        const deviceId = await getUsbCameraDeviceId();
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: deviceId ? { exact: deviceId } : undefined },
        });
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }
        video!.srcObject = stream;
        await video!.play();

        const vision = await FilesetResolver.forVisionTasks("./mediapipe/wasm");
        detectorRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "./mediapipe/models/face_landmarker.task" },
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (mounted) requestAnimationFrame(loop);
      } catch (e) {
        console.error("Camera init error:", e);
      }
    };

    // Reset running flag (cần thiết khi React Strict Mode unmount/remount)
    runningRef.current = true;

    init();
    return () => {
      mounted = false;
      runningRef.current = false;
      stream?.getTracks().forEach((t) => t.stop());
      if (video) video.srcObject = null;
      detectorRef.current?.close();
      detectorRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────
  return (
    <div className="w-screen h-screen relative overflow-hidden" style={{ background: "#050a12" }}>

      {/* LAYER 0: Full-screen tech background (z=0) */}
      <canvas
        ref={bgCanvasRef}
        className="absolute pointer-events-none"
        style={{ top: 0, left: 0, zIndex: 0 }}
      />

      {/* LAYER 1: Back button (z=50) */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-cyan-300 hover:text-white transition-colors"
          style={{ zIndex: 50 }}
        >
          ← Quay lại
        </button>
      )}

      {/* LAYER 2: Center oval + ring + landmarks (z=10) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 10 }}
      >
        <div className="relative" style={{ width: size, height: size * 1.25 }}>

          {/* Video + dark backdrop + neon ring – clipped to oval */}
          <div
            ref={wrapRef}
            className="absolute inset-0"
            style={{ clipPath: "ellipse(48% 50% at 50% 50%)", overflow: "hidden" }}
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

          {/* Landmark canvas – SAME SIZE, NO clipPath, on top */}
          <canvas
            ref={landmarkCanvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 5 }}
          />
        </div>
      </div>

      {/* LAYER 3: Flash (z=40) */}
      <div
        ref={flashRef}
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ opacity: 0, zIndex: 40 }}
      />

      {/* LAYER 4: Status text (z=20) */}
      <div
        className="absolute bottom-12 w-full text-center text-cyan-200 text-sm tracking-widest"
        style={{ zIndex: 20 }}
      >
        {msg}
      </div>

      <div
        className="absolute bottom-4 w-full text-center text-cyan-400 text-xs"
        style={{ zIndex: 20 }}
      >
        Ảnh đã chụp: {capturedPoseCount}/5 - Góc đang nhận: {activePoseLabel}
      </div>
    </div>
  );
};

export default CameraFace;
