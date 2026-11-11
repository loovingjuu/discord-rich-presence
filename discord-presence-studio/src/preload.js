
const {
  contextBridge,
  ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld("presenceAPI", {

  getConfig: () =>
    ipcRenderer.invoke("config:get"),

  connect: (clientId) =>
    ipcRenderer.invoke("discord:connect", clientId),

  setActivity: (activity) =>
    ipcRenderer.invoke("discord:set-activity", activity),

  clearActivity: () =>
    ipcRenderer.invoke("discord:clear"),

  disconnect: () =>
    ipcRenderer.invoke("discord:disconnect")

});
