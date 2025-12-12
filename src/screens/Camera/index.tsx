// screens/CameraScreen.tsx
import React from "react";
import CameraFace from "../../components/CameraFace";

const Camera = ({ onCaptured }: { onCaptured: (img: string) => void }) => {
  return (
    <CameraFace size={360} autoCaptureFrames={12} onCapture={onCaptured} />
  );
};

export default Camera;
