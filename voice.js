const langMap = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  kn: "kn-IN"
};

let currentUtterance = null;
let availableVoices = [];

// Load voices
function loadVoices() {
  if ("speechSynthesis" in window) {
    availableVoices = window.speechSynthesis.getVoices();
  }
}

loadVoices();

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Find the correct voice
function getVoice(locale) {
  const voices =
    availableVoices.length > 0
      ? availableVoices
      : window.speechSynthesis.getVoices();

  // First: exact match
  let voice = voices.find(
    v => v.lang && v.lang.toLowerCase() === locale.toLowerCase()
  );

  if (voice) return voice;

  // Second: same language only
  const language = locale.split("-")[0].toLowerCase();

  voice = voices.find(
    v => v.lang && v.lang.toLowerCase().split("-")[0] === language
  );

  return voice || null;
}

export function speak(text, lang = "en") {
  if (!("speechSynthesis" in window)) {
    return false;
  }

  stopSpeaking();

  const locale = langMap[lang] || "en-IN";

  currentUtterance = new SpeechSynthesisUtterance(text);

  currentUtterance.lang = locale;

  const voice = getVoice(locale);

  if (voice) {
    currentUtterance.voice = voice;
  }

  // Natural speaking speed
  currentUtterance.rate = 0.85;
  currentUtterance.pitch = 1;

  currentUtterance.onend = () => {
    currentUtterance = null;
  };

  currentUtterance.onerror = () => {
    currentUtterance = null;
  };

  window.speechSynthesis.speak(currentUtterance);

  return true;
}

export function pauseSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.resume();
  }
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  currentUtterance = null;
}

export function replaySpeaking(text, lang = "en") {
  return speak(text, lang);
}

export function isSpeaking() {
  return (
    "speechSynthesis" in window &&
    window.speechSynthesis.speaking
  );
}

export function isSupported() {
  return (
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}
