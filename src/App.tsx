// App.tsx
import React, { useState } from "react";
import Menu from "./screens/Menu";
import ReadCCCD from "./screens/ReadCCCD";
import Camera from "./screens/Camera";
import { useFullscreenToggle } from "./hooks/useFullscreenToggle";

export type Screen = "menu" | "readCCCD" | "camera" | "result";

const App = () => {
  useFullscreenToggle();
  const [screen, setScreen] = useState<Screen>("menu");

  // Data toàn bộ flow
  const [flowData, setFlowData] = useState({
    cccd: null as any,
    faceImage: null as string | null,
  });

  // ================================
  // điều khiển FLOW CONTROLLER
  // ================================
  const goTo = (scr: Screen) => setScreen(scr);

  const next = (data?: any) => {
    if (screen === "menu") return goTo("readCCCD");

    if (screen === "readCCCD") {
      setFlowData((prev) => ({ ...prev, cccd: data }));
      return goTo("camera");
    }

    if (screen === "camera") {
      setFlowData((prev) => ({ ...prev, faceImage: data }));
      return goTo("result");
    }
  };

  const back = () => {
    if (screen === "camera") return goTo("readCCCD");
    if (screen === "readCCCD") return goTo("menu");
  };

  // ================================
  // RENDER SCREEN
  // ================================
  return (
    <>
      {screen === "menu" && <Menu onCheckin={() => next()} />}

      {screen === "readCCCD" && (
        <ReadCCCD onNext={(data) => next(data)} onBack={back} />
      )}

      {screen === "camera" && (
        <Camera onCaptured={(img) => next(img)} onBack={back} />
      )}

      {screen === "result" && (
        <div className="w-screen h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
          <h1 className="text-2xl font-bold">Kết quả cuối</h1>

          <div className="flex gap-8">
            <div>
              <h2 className="text-lg mb-2">Ảnh CCCD</h2>
              <img
                src={
                  flowData.cccd?.avatar?.startsWith("data:image")
                    ? flowData.cccd.avatar
                    : `data:image/jpeg;base64,${flowData.cccd?.avatar}`
                }
                className="w-40 rounded-lg border"
              />
            </div>

            <div>
              <h2 className="text-lg mb-2">Ảnh Camera</h2>
              <img
                src={flowData.faceImage ?? ""}
                className="w-40 rounded-lg border"
              />
            </div>
          </div>

          <button
            onClick={() => alert("Match face API goes here")}
            className="px-6 py-3 bg-blue-500 rounded-xl"
          >
            Tiến hành so khớp
          </button>

          <button
            onClick={() => goTo("menu")}
            className="px-6 py-3 bg-gray-600 rounded-xl mt-4"
          >
            Quay về menu
          </button>
        </div>
      )}
    </>
  );
};

export default App;
