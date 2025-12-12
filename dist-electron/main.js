import { ipcMain as r, app as e, BrowserWindow as a } from "electron";
import o from "path";
import { fileURLToPath as l } from "url";
const d = l(import.meta.url), i = o.dirname(d);
function t() {
  const n = new a({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: o.join(i, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  });
  e.isPackaged ? n.loadFile(o.join(i, "../dist/index.html")) : n.loadURL("http://localhost:5173");
}
r.handle("ping", async () => "pong from main process");
e.whenReady().then(() => {
  t(), e.on("activate", function() {
    a.getAllWindows().length === 0 && t();
  });
});
e.on("window-all-closed", () => {
  process.platform !== "darwin" && e.quit();
});
