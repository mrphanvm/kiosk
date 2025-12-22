import { ipcMain, app, session, systemPreferences, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
function createWindow() {
  console.log("process", process.platform);
  if (process.platform === "darwin" || process.platform === "win32") {
    systemPreferences.askForMediaAccess("camera");
  }
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.ts"),
      contextIsolation: true,
      nodeIntegration: false,
      // 🔥 BẮT BUỘC cho getUserMedia
      sandbox: false
    }
  });
  if (!app.isPackaged) {
    win.loadFile(path.join(__dirname$1, "../dist/index.html"));
  } else {
    win.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
}
function setupPermissions() {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_, permission, callback) => {
    if (permission === "media") {
      callback(true);
    } else {
      callback(false);
    }
  });
}
ipcMain.handle("ping", async () => "pong");
app.whenReady().then(() => {
  setupPermissions();
  createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
