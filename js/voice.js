const langMap = { en:"en-IN", te:"te-IN", hi:"hi-IN", ta:"ta-IN", kn:"kn-IN" };
let currentUtterance = null;

function getVoice(locale) {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  return voices.find(v => v.lang === locale) ||
         voices.find(v => v.lang?.toLowerCase().startsWith(locale.slice(0,2).toLowerCase())) ||
         null;
}

export function speak(text, lang="en") {
  if (!("speechSynthesis" in window)) return false;
  stopSpeaking();
  currentUtterance = new SpeechSynthesisUtterance(text);
  const locale = langMap[lang] || "en-IN";
  currentUtterance.lang = locale;
  const voice = getVoice(locale);
  if (voice) currentUtterance.voice = voice;
  currentUtterance.rate = 0.9;
  currentUtterance.pitch = 1;
  window.speechSynthesis.speak(currentUtterance);
  return true;
}

export function pauseSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.pause();
}

export function resumeSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.resume();
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSupported() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}
