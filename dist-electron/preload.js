import { contextBridge as e, ipcRenderer as i } from "electron";
e.exposeInMainWorld("api", {
  ping: async () => i.invoke("ping")
});
