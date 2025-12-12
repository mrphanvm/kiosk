// ---------------- CameraFace.tsx (Final Stable + Popup + No Distortion) -------------------

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

  const [msg, setMsg] = useState("Đưa khuôn mặt vào vòng tròn để bắt đầu");
  const stable = useRef(0);

  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // FIX Strict Mode timestamp
  const tsRef = useRef(0);

  // FLASH EFFECT
  const flashRef = useRef<HTMLDivElement | null>(null);
  const flash = () => {
    const f = flashRef.current;
    if (!f) return;
    f.style.opacity = "0.85";
    f.style.transition = "none";
    void f.offsetHeight;
    f.style.transition = "opacity .45s ease-out";
    f.style.opacity = "0";
  };
  const getUsbCameraDeviceId = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const cams = devices.filter((d) => d.kind === "videoinput");

    // Ưu tiên camera USB (thường có chữ USB, HD Webcam, C270...)
    const usb = cams.find((d) =>
      /usb|hd|logitech|camera|webcam/i.test(d.label)
    );

    return usb?.deviceId || cams[0]?.deviceId;
  };

  // Capture full-resolution frame from video
  const captureFrame = (): string | null => {
    const v = videoRef.current;
    if (!v) return null;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.92);
  };

  // ---------------- ALIGNMENT --------------------
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

  // ---------------- LANDMARK REDUCTION --------------------
  // Giảm từ 478 điểm → còn ~70 điểm quan trọng
  // ~120 landmark đẹp, phân bố mắt – mũi – miệng – jawline – trán – má
  // ~220 landmark – chi tiết vừa phải, rất đẹp, không lag
  const landmarkIndexSample = [
    // === EYES (LEFT + RIGHT) ===
    33,
    7,
    163,
    144,
    145,
    153,
    154,
    155,
    133,
    173,
    157,
    158,
    159,
    160,
    161,
    246,
    362,
    382,
    381,
    380,
    374,
    373,
    390,
    249,
    263,
    466,
    388,
    387,
    386,
    385,
    384,
    398,

    // Add additional around-eye contour points
    130,
    247,
    30,
    29,
    27,
    28,
    56,
    190,
    243,
    112,
    26,
    22,
    23,
    24,
    110,
    463,
    414,
    286,
    258,
    257,
    259,
    260,
    463,
    341,
    359,
    446,
    467,
    468,
    469,

    // === EYEBROWS (FULL DETAIL) ===
    65,
    52,
    55,
    70,
    63,
    105,
    66,
    107, // left brow
    336,
    296,
    334,
    293,
    300,
    276,
    353,
    285, // right brow
    46,
    124,
    35,
    219,
    220,
    221,
    222,
    276,
    282,
    283,
    284,
    295,
    296,
    334,
    293,

    // === NOSE (HIGH DETAIL) ===
    1,
    2,
    98,
    327,
    97,
    168,
    5,
    4,
    351,
    358,
    327,
    197,
    6,
    195,
    197,
    419,
    197,
    196,
    94,
    2,
    98,
    327,
    347,
    348,
    97,
    195,
    168,
    188,
    122,
    217,
    131,
    49,
    279,

    // === MOUTH (FULL OUTER + INNER LIPS) ===
    61,
    146,
    91,
    181,
    84,
    17,
    314,
    405,
    321,
    375,
    291,
    308,
    78,
    191,
    80,
    81,
    82,
    13,
    311,
    310,
    415,
    308,
    402,
    14,
    86,
    87,
    88,
    178,
    179,
    180,
    183,
    184,
    185,
    311,
    312,
    308,
    324,
    318,
    402,
    317,
    316,

    // === CHEEKS & FACE SIDE DETAIL ===
    50,
    205,
    187,
    198,
    131,
    132,
    203,
    129,
    127,
    234,
    416,
    418,
    421,
    425,
    427,
    430,
    432,
    434,
    436,
    403,
    358,
    352,
    347,
    346,
    345,
    344,
    443,
    442,
    280,
    425,
    427,
    436,
    435,
    432,
    376,
    375,
    433,

    // === FOREHEAD DETAIL ===
    10,
    338,
    297,
    332,
    284,
    251,
    389,
    356,
    454,
    449,
    123,
    116,
    117,
    118,
    119,
    120,
    247,
    126,
    142,
    151,
    9,
    336,
    296,
    334,
    338,
    297,
    332,
    284,
    251,

    // === JAWLINE (MORE POINTS) ===
    152,
    148,
    176,
    150,
    136,
    172,
    58,
    132,
    93,
    234,
    127,
    205,
    50,
    209,
    198,
    131,
    177,
    215,
    138,
    135,
    150,
    176,
    148,
    152,
    377,
    400,
    378,
    379,
    397,
    365,
    363,
    379,
    378,
    400,
    377,
    152,
    148,
    176,
    149,
    150,

    // === EXTRA DENSE FACEMESH POINTS (ENHANCE SMOOTHNESS) ===
    // You can remove a few if too heavy; this is still performant.
    33,
    246,
    161,
    160,
    159,
    158,
    157,
    173,
    133,
    387,
    386,
    385,
    384,
    398,
    362,
    263,
    249,
    466,
    351,
    419,
    351,
    419,
    238,
    456,
    399,
    412,
    357,
    81,
    82,
    13,
    312,
    308,
    291,
    324,
    318,
    402,
  ];

  // ---------------- DRAW MASK + UI --------------------
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

    // Main glow ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(0,200,255,0.9)";
    ctx.shadowColor = "rgba(0,200,255,0.6)";
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Radar
    const angle = (ts * 0.12) % 360;
    const rad = (angle * Math.PI) / 180;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius * 1.05, rad - 0.22, rad + 0.22);
    ctx.closePath();

    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
    g.addColorStop(0, "rgba(0,255,200,0.2)");
    g.addColorStop(1, "rgba(0,255,200,0)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    // Face landmarks
    if (result?.faceLandmarks?.length) {
      const pts = result.faceLandmarks[0];
      const v = videoRef.current!;
      const vw = v.videoWidth;
      const vh = v.videoHeight;

      const scaleX = cw / vw;
      const scaleY = ch / vh;

      ctx.fillStyle = "rgba(0,255,120,0.8)";
      ctx.shadowColor = "rgba(0,255,120,0.7)";
      ctx.shadowBlur = 4;

      for (const idx of landmarkIndexSample) {
        const p = pts[idx];
        if (!p) continue;

        const px = p.x * vw * scaleX;
        const py = p.y * vh * scaleY;

        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  };

  // ---------------- MAIN LOOP --------------------
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

    // Compute bbox
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

      bbox = { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX };
    }

    const radius = Math.min(cw, ch) * 0.28;

    drawUI(ctx, result, cw, ch, radius, tsRef.current);

    const ok = isAligned(bbox, cw, ch);

    if (ok && !capturingRef.current) {
      stable.current++;
      setMsg(`Đang căn chỉnh... (${stable.current}/${autoCaptureFrames})`);
    } else {
      stable.current = 0;
      if (!capturingRef.current)
        setMsg("Đưa khuôn mặt vào vòng tròn để bắt đầu");
    }

    // Capture once
    if (ok && stable.current >= autoCaptureFrames && !capturingRef.current) {
      capturingRef.current = true;

      flash();

      const img = captureFrame();
      setPreviewImg(img!);
      onCapture?.(img!);

      // KHÔNG STOP CAMERA
      // Camera + mask vẫn chạy

      setMsg("Đã chụp");
    }

    requestAnimationFrame(loop);
  };

  // ---------------- INIT --------------------
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const v = videoRef.current!;
      const deviceId = await getUsbCameraDeviceId();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: 1280,
          height: 720,
        },
      });
      // const stream = await navigator.mediaDevices.getUserMedia({
      //   video: { facingMode: "user", width: 1280, height: 720 },
      // });
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

      if (!mounted) return;
      requestAnimationFrame(loop);
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-screen h-screen relative bg-[#05070a] overflow-hidden">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1 rounded-lg 
             bg-black/40 backdrop-blur-sm text-cyan-300 hover:text-white 
             border border-cyan-300/20 hover:border-cyan-200/40 transition z-50"
        >
          <span className="text-lg">←</span>
          <span className="text-sm">Quay lại</span>
        </button>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#051018] to-[#020305]" />

      {/* CAMERA AREA */}
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

      {/* FLASH */}
      <div
        ref={flashRef}
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ opacity: 0 }}
      />

      {/* STATUS */}
      <div className="absolute bottom-12 w-full text-center text-white/90 text-sm">
        {msg}
      </div>

      {/* POPUP PREVIEW */}
      {previewImg && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 shadow-xl">
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
