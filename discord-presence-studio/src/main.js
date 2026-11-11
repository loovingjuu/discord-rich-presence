
const {
  app,
  BrowserWindow,
  ipcMain
} = require("electron");

const path = require("node:path");
const fs = require("node:fs");
const { Client } = require("@xhayper/discord-rpc");

const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "config.json");

let mainWindow = null;
let rpcClient = null;
let isConnected = false;

const defaultConfig = {
  clientId: "",
  largeImageKey: "",
  largeImageText: "Still writing my life story",
  smallImageKey: "",
  smallImageText: "Software Engineering"
};

// ================================
// CONFIGURATION
// ================================

function readConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      fs.writeFileSync(
        CONFIG_PATH,
        JSON.stringify(defaultConfig, null, 2)
      );
    }

    const saved = JSON.parse(
      fs.readFileSync(CONFIG_PATH, "utf8")
    );

    return {
      ...defaultConfig,
      ...saved
    };
  } catch (error) {
    console.error("Config error:", error);
    return { ...defaultConfig };
  }
}

let config = readConfig();

function saveConfig() {
  fs.writeFileSync(
    CONFIG_PATH,
    JSON.stringify(config, null, 2)
  );
}

function cleanText(value, maxLength = 128) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

// ================================
// DISCORD RPC
// ================================

async function disconnectRPC() {
  const oldClient = rpcClient;

  rpcClient = null;
  isConnected = false;

  if (!oldClient) return;

  try {
    if (oldClient.user) {
      await oldClient.user.clearActivity();
    }
  } catch {}

  try {
    await oldClient.destroy();
  } catch {}
}

async function connectDiscord(clientId) {
  const id = cleanText(clientId, 20);

  if (!/^\d{17,20}$/.test(id)) {
    throw new Error("Application ID tidak valid.");
  }

  await disconnectRPC();

  const client = new Client({
    clientId: id
  });

  let timeout;

  const readyPromise = new Promise((resolve, reject) => {
    timeout = setTimeout(() => {
      reject(
        new Error(
          "Discord tidak merespons. Pastikan Discord desktop terbuka."
        )
      );
    }, 15000);

    client.once("ready", () => {
      clearTimeout(timeout);
      resolve();
    });

    client.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  try {
    await Promise.all([
      client.login(),
      readyPromise
    ]);

    rpcClient = client;
    isConnected = true;

    config.clientId = id;
    saveConfig();

    return {
      success: true,
      message: "Successfully connected!"
    };

  } catch (error) {
    clearTimeout(timeout);

    try {
      await client.destroy();
    } catch {}

    throw new Error(
      error.message || "Gagal menghubungkan Discord."
    );
  }
}

// ================================
// ACTIVITY CONTROLLER
// ================================

async function setActivity(activity) {
  if (!rpcClient || !isConnected || !rpcClient.user) {
    throw new Error("Hubungkan Discord terlebih dahulu.");
  }

  const details = cleanText(activity.details);
  const state = cleanText(activity.state);

  if (!details || !state) {
    throw new Error("Details dan State tidak boleh kosong.");
  }

  const payload = {
    details,
    state,
    startTimestamp: new Date()
  };

  const largeImageKey = cleanText(
    activity.largeImageKey,
    128
  );

  const smallImageKey = cleanText(
    activity.smallImageKey,
    128
  );

  const largeImageText = cleanText(
    activity.largeImageText,
    128
  );

  const smallImageText = cleanText(
    activity.smallImageText,
    128
  );

  if (largeImageKey) {
    payload.largeImageKey = largeImageKey;
  }

  if (smallImageKey) {
    payload.smallImageKey = smallImageKey;
  }

  if (largeImageText) {
    payload.largeImageText = largeImageText;
  }

  if (smallImageText) {
    payload.smallImageText = smallImageText;
  }

  await rpcClient.user.setActivity(payload);

  // Simpan pengaturan artwork
  config.largeImageKey = largeImageKey;
  config.smallImageKey = smallImageKey;
  config.largeImageText = largeImageText;
  config.smallImageText = smallImageText;

  saveConfig();

  return {
    success: true,
    message: "Rich Presence berhasil diperbarui."
  };
}

// ================================
// IPC HANDLERS
// ================================

ipcMain.handle("config:get", () => {
  return config;
});

ipcMain.handle("discord:connect", async (_, clientId) => {
  return await connectDiscord(clientId);
});

ipcMain.handle("discord:set-activity", async (_, activity) => {
  return await setActivity(activity);
});

ipcMain.handle("discord:clear", async () => {
  if (!rpcClient || !isConnected) {
    throw new Error("Discord belum terhubung.");
  }

  await rpcClient.user.clearActivity();

  return {
    success: true,
    message: "Presence berhasil dihapus."
  };
});

ipcMain.handle("discord:disconnect", async () => {
  await disconnectRPC();

  return {
    success: true,
    message: "Discord disconnected."
  };
});

// ================================
// ELECTRON WINDOW
// ================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 790,
    minWidth: 900,
    minHeight: 650,

    title: "Discord Presence Studio",

    backgroundColor: "#090b12",

    autoHideMenuBar: true,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(
    path.join(ROOT, "ui", "index.html")
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Bersihkan koneksi saat aplikasi ditutup
app.on("before-quit", () => {
  if (rpcClient) {
    try {
      rpcClient.user?.clearActivity();
    } catch {}

    try {
      rpcClient.destroy();
    } catch {}

    rpcClient = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
