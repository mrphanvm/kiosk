import { useEffect } from "react";

export const useFullscreenToggle = () => {
  useEffect(() => {
    let pressTimer: number | null = null;

    const toggleFullscreen = async () => {
      const isFullscreen =
        document.fullscreenElement || (document as any).webkitFullscreenElement;

      if (!isFullscreen) {
        const el = document.documentElement;

        if (el.requestFullscreen) await el.requestFullscreen();
        else if ((el as any).webkitRequestFullscreen)
          (el as any).webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen)
          (document as any).webkitExitFullscreen();
      }
    };

    const handleDown = () => {
      pressTimer = setTimeout(() => toggleFullscreen(), 600); // giữ 0.6s
    };

    const handleUp = () => {
      if (pressTimer) clearTimeout(pressTimer);
    };

    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointerleave", handleUp);

    return () => {
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointerleave", handleUp);
    };
  }, []);
};
