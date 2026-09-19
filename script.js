import { classifyImage, loadModel } from "./js/ai-model.js";
import { diseaseData } from "./js/disease-data.js";
import { translations, t } from "./js/translations.js";
import { speak, pauseSpeaking, resumeSpeaking, stopSpeaking, isSupported } from "./js/voice.js";

const $ = id => document.getElementById(id);
const input = $("imageInput"), preview = $("preview"), previewWrap = $("previewWrap");
const analyzeBtn = $("analyzeBtn"), statusEl = $("modelStatus");
const resultEmpty = $("resultEmpty"), resultContent = $("resultContent");
const languageSelect = $("languageSelect");
let selectedFile = null, currentResult = null, lang = localStorage.getItem("cropdoc-language") || "en";

languageSelect.value = lang;

function applyTranslations() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(lang, key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t(lang, el.dataset.i18nPlaceholder);
  });
}

function setStatus(keyOrText, direct=false) {
  statusEl.textContent = direct ? keyOrText : t(lang, keyOrText);
}

function normalizeLabel(label="") {
  return label.toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/\s+/g," ").trim();
}

function findDisease(label) {
  const exact = diseaseData[label];
  if (exact) return exact;

  const n = normalizeLabel(label);
  const normalizedKeys = Object.keys(diseaseData);

  // The Hugging Face model uses human-readable labels such as
  // "Tomato with Early Blight", while our database uses PlantVillage
  // labels such as "Tomato___Early_blight". Map the model wording to
  // the corresponding database entry.
  const modelToDatabase = {
    "Apple Scab": "Apple___Apple_scab",
    "Apple with Black Rot": "Apple___Black_rot",
    "Cedar Apple Rust": "Apple___Cedar_apple_rust",
    "Healthy Apple": "Apple___healthy",
    "Healthy Blueberry Plant": "Blueberry___healthy",
    "Cherry with Powdery Mildew": "Cherry_(including_sour)___Powdery_mildew",
    "Healthy Cherry Plant": "Cherry_(including_sour)___healthy",
    "Corn (Maize) with Cercospora and Gray Leaf Spot": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn (Maize) with Common Rust": "Corn_(maize)___Common_rust_",
    "Corn (Maize) with Northern Leaf Blight": "Corn_(maize)___Northern_Leaf_Blight",
    "Healthy Corn (Maize) Plant": "Corn_(maize)___healthy",
    "Grape with Black Rot": "Grape___Black_rot",
    "Grape with Esca (Black Measles)": "Grape___Esca_(Black_Measles)",
    "Grape with Isariopsis Leaf Spot": "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Healthy Grape Plant": "Grape___healthy",
    "Orange with Citrus Greening": "Orange___Haunglongbing_(Citrus_greening)",
    "Peach with Bacterial Spot": "Peach___Bacterial_spot",
    "Healthy Peach Plant": "Peach___healthy",
    "Bell Pepper with Bacterial Spot": "Pepper,_bell___Bacterial_spot",
    "Healthy Bell Pepper Plant": "Pepper,_bell___healthy",
    "Potato with Early Blight": "Potato___Early_blight",
    "Potato with Late Blight": "Potato___Late_blight",
    "Healthy Potato Plant": "Potato___healthy",
    "Healthy Raspberry Plant": "Raspberry___healthy",
    "Healthy Soybean Plant": "Soybean___healthy",
    "Squash with Powdery Mildew": "Squash___Powdery_mildew",
    "Strawberry with Leaf Scorch": "Strawberry___Leaf_scorch",
    "Healthy Strawberry Plant": "Strawberry___healthy",
    "Tomato with Bacterial Spot": "Tomato___Bacterial_spot",
    "Tomato with Early Blight": "Tomato___Early_blight",
    "Tomato with Late Blight": "Tomato___Late_blight",
    "Tomato with Leaf Mold": "Tomato___Leaf_Mold",
    "Tomato with Septoria Leaf Spot": "Tomato___Septoria_leaf_spot",
    "Tomato with Spider Mites or Two-spotted Spider Mite": "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato with Target Spot": "Tomato___Target_Spot",
    "Tomato Yellow Leaf Curl Virus": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato Mosaic Virus": "Tomato___Tomato_mosaic_virus",
    "Healthy Tomato Plant": "Tomato___healthy"
  };

  const mappedKey = modelToDatabase[label] || modelToDatabase[Object.keys(modelToDatabase).find(k => normalizeLabel(k) === n)];
  if (mappedKey && diseaseData[mappedKey]) return diseaseData[mappedKey];

  const key = normalizedKeys.find(k => normalizeLabel(k) === n);
  if (key) return diseaseData[key];
  const key2 = normalizedKeys.find(k => normalizeLabel(k).replace(/_/g," ") === n.replace(/_/g," "));
  return key2 ? diseaseData[key2] : null;
}

function prettyLabel(label) {
  return label.replace(/___/g," — ").replace(/_/g," ").replace(/\s+/g," ").trim();
}

function chooseConfidence(result) {
  return Number(result?.score || 0);
}

function renderPredictions(results) {
  const list = $("predictionList");
  list.innerHTML = "";
  results.forEach(item => {
    const pct = Math.max(0, Math.min(100, item.score * 100));
    const div = document.createElement("div");
    div.className = "prediction";
    div.innerHTML = `<div><div class="prediction-label">${escapeHtml(prettyLabel(item.label))}</div><div class="bar"><i style="width:${pct}%"></i></div></div><div class="prediction-score">${pct.toFixed(1)}%</div>`;
    list.appendChild(div);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}

function showResult(results) {
  currentResult = results[0];
  const info = findDisease(currentResult.label);
  const confidence = chooseConfidence(currentResult);
  $("diseaseName").textContent = info?.name || prettyLabel(currentResult.label);
  $("cropName").textContent = info ? info.crop : "—";
  $("confidenceValue").textContent = `${(confidence*100).toFixed(1)}%`;
  $("diseaseDescription").textContent = info?.description || t(lang,"noResult");
  $("symptoms").textContent = info?.symptoms || "—";
  $("prevention").textContent = info?.prevention || "—";
  $("management").textContent = info?.management || "—";
  renderPredictions(results);
  const warning = $("warning");
  if (confidence < 0.60) {
    warning.textContent = t(lang,"lowConfidence");
    warning.classList.remove("hidden");
  } else {
    warning.classList.add("hidden");
  }
  resultEmpty.classList.add("hidden");
  resultContent.classList.remove("hidden");
}

async function analyze() {
  if (!selectedFile) return;
  analyzeBtn.disabled = true;
  setStatus("loadingModel");
  try {
    await loadModel();
    setStatus("analyzing");
    const results = await classifyImage(selectedFile);
    showResult(results);
    setStatus("", true);
  } catch (error) {
    console.error(error);
    setStatus("modelError");
  } finally {
    analyzeBtn.disabled = false;
  }
}

input.addEventListener("change", () => {
  const file = input.files?.[0];
  if (!file || !file.type.startsWith("image/")) {
    selectedFile = null; analyzeBtn.disabled = true; setStatus("imageError"); return;
  }
  selectedFile = file;
  preview.src = URL.createObjectURL(file);
  previewWrap.classList.remove("hidden");
  analyzeBtn.disabled = false;
  resultEmpty.classList.remove("hidden");
  resultContent.classList.add("hidden");
  setStatus(file.name, true);
});

$("removeImage").addEventListener("click", () => {
  selectedFile = null; input.value = ""; preview.src = ""; previewWrap.classList.add("hidden"); analyzeBtn.disabled = true;
  resultEmpty.classList.remove("hidden"); resultContent.classList.add("hidden"); setStatus("", true);
  stopSpeaking();
});

analyzeBtn.addEventListener("click", analyze);

["dragover","dragenter"].forEach(evt => $("dropzone").addEventListener(evt, e => {
  e.preventDefault(); $("dropzone").classList.add("dragging");
}));
["dragleave","drop"].forEach(evt => $("dropzone").addEventListener(evt, e => {
  e.preventDefault(); $("dropzone").classList.remove("dragging");
}));
$("dropzone").addEventListener("drop", e => {
  const file = e.dataTransfer.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;
  selectedFile = file;
  preview.src = URL.createObjectURL(file);
  previewWrap.classList.remove("hidden");
  analyzeBtn.disabled = false;
  setStatus(file.name, true);
});

languageSelect.addEventListener("change", () => {
  lang = languageSelect.value;
  localStorage.setItem("cropdoc-language", lang);
  applyTranslations();
  if (currentResult) showResult([currentResult]);
});

$("speakBtn").addEventListener("click", () => {
  if (!currentResult) return;
  const info = findDisease(currentResult.label);
  const text = [
    $("diseaseName").textContent,
    $("cropName").textContent,
    info?.description || "",
    info?.symptoms || "",
    info?.prevention || "",
    info?.management || ""
  ].filter(Boolean).join(". ");
  if (!isSupported()) {
    alert(t(lang,"noVoice"));
    return;
  }
  speak(text, lang);
});
$("pauseBtn").addEventListener("click", () => {
  if ("speechSynthesis" in window) {
    if (speechSynthesis.paused) resumeSpeaking(); else pauseSpeaking();
  }
});
$("stopBtn").addEventListener("click", stopSpeaking);

function botReply(message) {
  const m = message.toLowerCase();
  if (m.includes("confidence") || m.includes("विश्वास") || m.includes("నమ్మకం")) {
    return lang==="en" ? "Confidence shows how strongly the image model supports its top class. A low score means you should retake the photo and seek expert confirmation." : t(lang,"lowConfidence");
  }
  if (m.includes("healthy") || m.includes("ఆరోగ్య") || m.includes("स्वस्थ") || m.includes("ஆரோக்கிய") || m.includes("ಆರೋಗ್ಯ")) return t(lang,"healthyAnswer");
  if (currentResult && (m.includes("result") || m.includes("disease") || m.includes("వ్యాధి") || m.includes("रोग") || m.includes("நோய்") || m.includes("ರೋಗ"))) {
    const info = findDisease(currentResult.label);
    if (info) return `${info.name}: ${info.description} ${info.symptoms}`;
  }
  return t(lang,"chatFallback");
}

$("chatForm").addEventListener("submit", e => {
  e.preventDefault();
  const inputEl = $("chatInput");
  const message = inputEl.value.trim();
  if (!message) return;
  const user = document.createElement("div"); user.className = "user-message"; user.textContent = message;
  const bot = document.createElement("div"); bot.className = "bot-message"; bot.textContent = botReply(message);
  $("chatMessages").append(user, bot);
  inputEl.value = "";
  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
});

applyTranslations();
