
const api = window.presenceAPI;

const $ = (id) => document.getElementById(id);


// ================================
// ELEMENTS
// ================================

const elements = {
  clientId: $("clientId"),

  connectButton: $("connectButton"),
  applyButton: $("applyButton"),
  clearButton: $("clearButton"),

  connectionBadge: $("connectionBadge"),
  connectionText: $("connectionText"),
  connectionMessage: $("connectionMessage"),

  activityMessage: $("activityMessage"),

  details: $("details"),
  state: $("state"),

  largeImageKey: $("largeImageKey"),
  largeImageText: $("largeImageText"),

  smallImageKey: $("smallImageKey"),
  smallImageText: $("smallImageText"),

  previewDetails: $("previewDetails"),
  previewState: $("previewState"),
  previewTimer: $("previewTimer")
};


// ================================
// STATE
// ================================

let connected = false;
let startedAt = null;
let timerInterval = null;


// ================================
// PRESETS
// ================================

const presets = {
  coding: {
    details: "Still Writing My Life Story",
    state: "Software Engineering • VS Code"
  },

  gaming: {
    details: "Taking a break with Mobile Legends",
    state: "One match at a time"
  },

  studying: {
    details: "Learning Something New",
    state: "One step at a time"
  },

  chilling: {
    details: "Taking a Little Break",
    state: "Music • Relaxing • No Rush"
  }
};


// ================================
// MESSAGES
// ================================

function showMessage(element, message, type = "info") {
  element.textContent = message;
  element.dataset.state = type;
}


// ================================
// CONNECTION UI
// ================================

function updateConnection(status) {
  connected = status;

  elements.connectionBadge.classList.toggle(
    "connected",
    status
  );

  elements.connectionText.textContent = status
    ? "Connected"
    : "Disconnected";

  elements.connectButton.textContent = status
    ? "Reconnect Discord"
    : "Connect Discord";

  elements.applyButton.disabled = !status;
  elements.clearButton.disabled = !status;
}


// ================================
// PREVIEW
// ================================

function updatePreview() {
  elements.previewDetails.textContent =
    elements.details.value.trim() ||
    "No activity details";

  elements.previewState.textContent =
    elements.state.value.trim() ||
    "No activity state";
}


elements.details.addEventListener("input", () => {
  updatePreview();
  clearSelectedPreset();
});

elements.state.addEventListener("input", () => {
  updatePreview();
  clearSelectedPreset();
});


function clearSelectedPreset() {
  document.querySelectorAll(".preset-button").forEach((button) => {
    button.classList.remove("selected");
  });
}


// ================================
// PRESET SELECTION
// ================================

document.querySelectorAll("[data-preset]").forEach((button) => {

  button.addEventListener("click", () => {

    const preset = presets[button.dataset.preset];

    if (!preset) return;

    elements.details.value = preset.details;
    elements.state.value = preset.state;

    updatePreview();

    clearSelectedPreset();

    button.classList.add("selected");

    showMessage(
      elements.activityMessage,
      `${button.dataset.preset} preset selected.`,
      "info"
    );

  });

});


// ================================
// TIMER
// ================================

function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}


function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  startedAt = null;

  elements.previewTimer.textContent = "Not started";
}


function startTimer() {
  stopTimer();

  startedAt = Date.now();

  const tick = () => {
    if (!startedAt) return;

    const elapsed = Date.now() - startedAt;

    elements.previewTimer.textContent =
      formatTime(elapsed);
  };

  tick();

  timerInterval = setInterval(tick, 1000);
}


// ================================
// CONNECT DISCORD
// ================================

elements.connectButton.addEventListener(
  "click",
  async () => {

    const id = elements.clientId.value.trim();

    if (!id) {
      showMessage(
        elements.connectionMessage,
        "Application ID is required.",
        "error"
      );

      return;
    }

    elements.connectButton.disabled = true;

    elements.connectButton.textContent =
      "Connecting...";

    showMessage(
      elements.connectionMessage,
      "Connecting to Discord desktop...",
      "info"
    );

    try {

      const result = await api.connect(id);

      updateConnection(true);

      showMessage(
        elements.connectionMessage,
        result.message,
        "success"
      );

    } catch (error) {

      updateConnection(false);

      showMessage(
        elements.connectionMessage,
        error.message,
        "error"
      );

    } finally {

      elements.connectButton.disabled = false;

    }

  }
);


// ================================
// GET ACTIVITY DATA
// ================================

function getActivityData() {
  return {
    details: elements.details.value.trim(),
    state: elements.state.value.trim(),

    largeImageKey:
      elements.largeImageKey.value.trim(),

    largeImageText:
      elements.largeImageText.value.trim(),

    smallImageKey:
      elements.smallImageKey.value.trim(),

    smallImageText:
      elements.smallImageText.value.trim()
  };
}


// ================================
// APPLY PRESENCE
// ================================

elements.applyButton.addEventListener(
  "click",
  async () => {

    if (!connected) {
      showMessage(
        elements.activityMessage,
        "Connect Discord before applying activity.",
        "error"
      );

      return;
    }

    const activity = getActivityData();

    if (!activity.details || !activity.state) {
      showMessage(
        elements.activityMessage,
        "Both activity fields are required.",
        "error"
      );

      return;
    }

    elements.applyButton.disabled = true;

    elements.applyButton.innerHTML =
      "<span>Applying...</span>";

    try {

      const result = await api.setActivity(activity);

      startTimer();

      showMessage(
        elements.activityMessage,
        result.message,
        "success"
      );

    } catch (error) {

      showMessage(
        elements.activityMessage,
        error.message,
        "error"
      );

    } finally {

      elements.applyButton.disabled = !connected;

      elements.applyButton.innerHTML =
        "<span>Apply activity</span><span>↗</span>";

    }

  }
);


// ================================
// CLEAR PRESENCE
// ================================

elements.clearButton.addEventListener(
  "click",
  async () => {

    if (!connected) return;

    elements.clearButton.disabled = true;

    try {

      const result = await api.clearActivity();

      stopTimer();

      showMessage(
        elements.activityMessage,
        result.message,
        "success"
      );

    } catch (error) {

      showMessage(
        elements.activityMessage,
        error.message,
        "error"
      );

    } finally {

      elements.clearButton.disabled = !connected;

    }

  }
);


// ================================
// LOAD CONFIG
// ================================

async function initialize() {

  updateConnection(false);

  updatePreview();

  try {

    const config = await api.getConfig();

    elements.clientId.value =
      config.clientId || "";

    elements.largeImageKey.value =
      config.largeImageKey || "";

    elements.largeImageText.value =
      config.largeImageText || "";

    elements.smallImageKey.value =
      config.smallImageKey || "";

    elements.smallImageText.value =
      config.smallImageText || "";

    showMessage(
      elements.connectionMessage,
      "Discord desktop must be running.",
      "info"
    );

  } catch (error) {

    showMessage(
      elements.connectionMessage,
      `Configuration error: ${error.message}`,
      "error"
    );

  }

  console.log("Presence Studio initialized.");

}


// ================================
// START APPLICATION UI
// ================================

initialize();
