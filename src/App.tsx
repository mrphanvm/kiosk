// App.tsx
import React, { useState } from "react";
import Menu from "./screens/Menu";
import ReadCCCD from "./screens/ReadCCCD";
import Camera from "./screens/Camera";

export type Screen = "menu" | "readCCCD" | "camera";

const App = () => {
  const [screen, setScreen] = useState<Screen>("menu");
  const [cccdData, setCccdData] = useState<any>(null);

  return (
    <>
      {screen === "menu" && <Menu onCheckin={() => setScreen("readCCCD")} />}

      {screen === "readCCCD" && (
        <ReadCCCD
          onNext={(data) => {
            setCccdData(data);
            setScreen("camera");
          }}
        />
      )}

      {screen === "camera" && (
        <Camera
          onCaptured={(faceImg) => {
            console.log("Ảnh camera:", faceImg);
            console.log("Ảnh CCCD:", cccdData.avatar);

            alert("Đã chụp xong! Anh gọi API so khớp tại đây.");

            // matchFace(cccdData.avatar, faceImg)
          }}
        />
      )}
    </>
  );
};

export default App;
