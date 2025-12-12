// FaceCameraCircle.tsx
import React, { useEffect, useRef } from "react";

const FaceCameraCircle: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      const s = videoRef.current?.srcObject;
      if (s instanceof MediaStream) {
        s.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#1a1a1a]">
      {/* Vòng tròn chứa camera */}
      <div
        className="relative rounded-full overflow-hidden border-4 border-blue-500 shadow-xl"
        style={{
          width: 320,
          height: 320,
        }}
      >
        {/* Camera */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
      </div>
    </div>
  );
};

export default FaceCameraCircle;
