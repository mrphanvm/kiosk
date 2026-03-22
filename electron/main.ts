import {
  app,
  BrowserWindow,
  ipcMain,
  session,
  systemPreferences,
} from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const devServerUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

function createWindow() {
  console.log("process", process.platform);
  if (process.platform === "darwin") {
    systemPreferences.askForMediaAccess("camera");
  }

  // Determine correct preload file for production
  const preloadPath = app.isPackaged
    ? path.join(__dirname, "preload.js")
    : path.join(__dirname, "preload.ts");

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });


  // Force production mode if NODE_ENV=production or app.isPackaged
  const isProd = process.env.NODE_ENV === 'production' || app.isPackaged;
  if (!isProd) {
    win.loadURL(devServerUrl);
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "../dist/index.html");
    win.loadFile(indexPath).catch((err) => {
      console.error("Failed to load index.html:", err);
    });
  }

  // Log load failures for easier debugging
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Window failed to load:', { errorCode, errorDescription, validatedURL });
  });
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
