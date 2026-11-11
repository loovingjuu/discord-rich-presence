const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { Client } = require("@xhayper/discord-rpc");
const presets = require("./presets");

const CONFIG_PATH = path.join(__dirname, "..", "config.json");

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(
      "File config.json belum ada. Salin config.example.json menjadi config.json, lalu isi Application ID lu."
    );
  }

  let config;

  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (error) {
    throw new Error(`config.json bukan JSON yang valid: ${error.message}`);
  }

  const clientId = String(config.clientId ?? "").trim();
  if (!/^\d{17,20}$/.test(clientId)) {
    throw new Error(
      "Application ID belum valid. Isi clientId dengan Application ID dari Discord Developer Portal."
    );
  }

  return {
    clientId,
    largeImageKey: String(config.largeImageKey ?? "").trim(),
    largeImageText: String(config.largeImageText ?? "").trim(),
    smallImageKey: String(config.smallImageKey ?? "").trim(),
    smallImageText: String(config.smallImageText ?? "").trim(),
    buttons: Array.isArray(config.buttons) ? config.buttons.slice(0, 2) : []
  };
}

function cleanText(value, fallback) {
  const text = String(value ?? fallback).trim();
  // Discord membatasi details dan state sampai 128 karakter.
  return text.slice(0, 128);
}

function getValidButtons(buttons) {
  return buttons
    .filter((button) => {
      if (!button || typeof button !== "object") return false;
      if (!button.label || !button.url) return false;

      try {
        const url = new URL(button.url);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    })
    .map((button) => ({
      label: String(button.label).trim().slice(0, 32),
      url: String(button.url).trim()
    }))
    .filter((button) => button.label.length > 0);
}

async function askNonEmpty(rl, question, fallback) {
  const answer = (await rl.question(question)).trim();
  return answer || fallback;
}

async function main() {
  let config;

  try {
    config = loadConfig();
  } catch (error) {
    console.error(`\n[CONFIG ERROR] ${error.message}\n`);
    process.exitCode = 1;
    return;
  }

  // Client ini menghubungkan aplikasi Node.js ke Discord desktop lokal.
  // Ini bukan bot dan tidak membutuhkan bot token.
  const client = new Client({ clientId: config.clientId });
  const rl = readline.createInterface({ input: stdin, output: stdout });
  let shuttingDown = false;

  client.on("disconnected", () => {
    console.log("\n[DISCONNECTED] Koneksi Discord terputus. Buka Discord desktop, lalu jalankan ulang project ini.\n");
  });

  try {
    console.log("\n====================================");
    console.log("       DISCORD PRESENCE STUDIO");
    console.log("====================================\n");
    console.log("Menghubungkan ke Discord desktop...");

    await client.login();
    console.log("[CONNECTED] Berhasil terhubung ke Discord!\n");

    async function updatePresence(activity) {
      if (!client.user) {
        console.log("[ERROR] Client Discord belum siap. Coba jalankan ulang project.\n");
        return;
      }

      const payload = {
        details: cleanText(activity.details, "Doing something interesting"),
        state: cleanText(activity.state, "Just chilling"),
        startTimestamp: new Date()
      };

      // Asset hanya dikirim kalau key-nya diisi di config.json.
      // Key harus sama persis dengan nama asset yang di-upload ke Developer Portal.
      if (config.largeImageKey) payload.largeImageKey = config.largeImageKey;
      if (config.largeImageText) payload.largeImageText = config.largeImageText;
      if (config.smallImageKey) payload.smallImageKey = config.smallImageKey;
      if (config.smallImageText) payload.smallImageText = config.smallImageText;

      const buttons = getValidButtons(config.buttons);
      if (buttons.length > 0) payload.buttons = buttons;

      await client.user.setActivity(payload);
      console.log("\n[PRESENCE UPDATED]");
      console.log(`Details : ${payload.details}`);
      console.log(`State   : ${payload.state}`);
      console.log("Timer   : mulai dihitung dari sekarang\n");
    }

    async function showMenu() {
      console.log("------------------------------------");
      console.log("Pilih aktivitas:");
      console.log("  1. Coding");
      console.log("  2. Gaming");
      console.log("  3. Studying");
      console.log("  4. Chilling");
      console.log("  5. Random vibe");
      console.log("  6. Custom status");
      console.log("  7. Clear Rich Presence");
      console.log("  0. Exit");
      console.log("------------------------------------");
      return (await rl.question("Pilih menu (0-7): ")).trim();
    }

    const presetOrder = ["coding", "gaming", "studying", "chilling"];

    while (!shuttingDown) {
      const choice = await showMenu();

      if (choice === "0") {
        shuttingDown = true;
        break;
      }

      if (["1", "2", "3", "4"].includes(choice)) {
        const key = presetOrder[Number(choice) - 1];
        await updatePresence(presets[key]);
        continue;
      }

      if (choice === "5") {
        const randomKey = presetOrder[Math.floor(Math.random() * presetOrder.length)];
        await updatePresence(presets[randomKey]);
        console.log(`Random vibe terpilih: ${presets[randomKey].label}\n`);
        continue;
      }

      if (choice === "6") {
        console.log("\nBikin status sendiri. Maksimal 128 karakter per baris.");
        const details = await askNonEmpty(rl, "Details (baris utama): ", "Doing something interesting");
        const state = await askNonEmpty(rl, "State (baris kedua): ", "Just chilling");
        await updatePresence({ details, state });
        continue;
      }

      if (choice === "7") {
        await client.user.clearActivity();
        console.log("\n[CLEARED] Rich Presence sudah dihapus dari profil Discord.\n");
        continue;
      }

      console.log("Pilihan tidak tersedia. Masukkan angka 0 sampai 7.\n");
    }
  } catch (error) {
    console.error("\n[ERROR] Gagal menjalankan Rich Presence.");
    console.error(error.message || error);
    console.error("\nPastikan Discord desktop sedang terbuka dan Application ID sudah benar.\n");
    process.exitCode = 1;
  } finally {
    rl.close();

    // Hapus status dan tutup koneksi dengan rapi saat user memilih Exit.
    try {
      if (client.user) await client.user.clearActivity();
    } catch {
      // Discord mungkin sudah tertutup; aman untuk diabaikan saat keluar.
    }

    try {
      await client.destroy();
    } catch {
      // Koneksi mungkin sudah terputus sebelumnya.
    }
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});
