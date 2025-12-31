import CameraFace from '../../components/CameraFace'

const Camera = ({
  onCaptured,
  onBack,
}: {
  onCaptured: (img: string) => void
  onBack?: () => void
}) => {
  return (
    <CameraFace
      size={360}
      autoCaptureFrames={12}
      onCapture={onCaptured}
      onBack={onBack}
    />
  )
}

export default Camera
