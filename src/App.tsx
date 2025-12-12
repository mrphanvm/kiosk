import "./App.css";
import FaceCapture from "./components/CameraFace";
import FaceCameraCircle from "./components/FaceCameraCircle";
import FaceCaptureRadial from "./components/FaceCaptureRadial";

function App() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-white">
      <FaceCapture />
    </div>
  );
}

export default App;
